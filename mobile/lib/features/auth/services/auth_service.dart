import 'dart:convert';
import 'package:crypto/crypto.dart';
import 'package:http/http.dart' as http;
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../../core/config/env_config.dart';
import '../../../models/user_model.dart';

/// Authentication service using Supabase Edge Functions for security
///
/// SECURE FLOW:
/// 1. User registers -> Edge Function validates and creates registration_request
/// 2. Admin approves -> Edge Function updates status
/// 3. User logs in -> Edge Function verifies, creates auth user, returns session
class AuthService {
  final SupabaseClient _client;

  // Get URLs from config
  String get _baseUrl => EnvConfig.supabaseUrl;
  String get _anonKey => EnvConfig.supabaseAnonKey;

  String get _registerUrl => '$_baseUrl/functions/v1/register';
  String get _loginUrl => '$_baseUrl/functions/v1/login';

  AuthService(this._client);

  /// Get current user
  User? get currentUser => _client.auth.currentUser;

  /// Hash password using SHA256 (same as Edge Functions)
  String _hashPassword(String password) {
    return sha256.convert(utf8.encode(password)).toString();
  }

  /// Sign in with email and password
  Future<AuthResponse> signInWithEmail({
    required String email,
    required String password,
  }) async {
    final normalizedEmail = email.toLowerCase().trim();

    // FIRST: Try direct Supabase sign-in (works for admin-added members and returning users)
    try {
      return await _client.auth.signInWithPassword(
        email: normalizedEmail,
        password: password,
      );
    } catch (_) {
      // Direct sign-in failed - fall through to Edge Function / registration flow
    }

    // SECOND: Try Edge Function login (for app registrants)
    try {
      final response = await http
          .post(
            Uri.parse(_loginUrl),
            headers: {
              'Content-Type': 'application/json',
              'apikey': _anonKey,
            },
            body: jsonEncode({
              'email': normalizedEmail,
              'password': password,
            }),
          )
          .timeout(const Duration(seconds: 10));

      final data = jsonDecode(response.body);

      if (response.statusCode == 200 && data['success'] == true) {
        // Edge Function returned session - use direct sign in
        return await _client.auth.signInWithPassword(
          email: normalizedEmail,
          password: password,
        );
      }

      // Handle specific error cases from Edge Function
      if (data['status'] == 'PENDING') {
        throw Exception(
            'PENDING: ${data['error'] ?? 'Awaiting admin approval'}');
      }
      if (data['status'] == 'REJECTED') {
        throw Exception(
            'REJECTED: ${data['error'] ?? 'Registration was rejected'}');
      }
      if (response.statusCode == 401) {
        throw Exception(data['error'] ?? 'Invalid credentials');
      }
      if (response.statusCode == 403) {
        throw Exception(data['error'] ?? 'Access denied');
      }

      // For other errors, fall through to direct login
    } catch (e) {
      // If it's a specific error we threw, rethrow it
      if (e.toString().contains('PENDING') ||
          e.toString().contains('REJECTED')) {
        rethrow;
      }
      // Otherwise continue to fallback
    }

    // Fallback: Check registration_requests table directly
    final request = await _client
        .from('registration_requests')
        .select()
        .eq('email', normalizedEmail)
        .maybeSingle();

    if (request != null) {
      final status = request['status'] as String;

      if (status == 'pending') {
        throw Exception(
            'PENDING: Your registration is awaiting admin approval.');
      }

      if (status == 'rejected') {
        throw Exception(
            'REJECTED: Your registration was rejected. Contact the gym.');
      }

      if (status == 'approved') {
        // Verify password
        final storedHash = request['password_hash'] as String;
        final inputHash = _hashPassword(password);

        if (storedHash != inputHash) {
          throw Exception('Invalid password.');
        }

        // Try to sign in - if user doesn't exist in auth, create them
        try {
          return await _client.auth.signInWithPassword(
            email: normalizedEmail,
            password: password,
          );
        } catch (signInError) {
          // User doesn't exist yet - create them
          try {
            final signUpResponse = await _client.auth.signUp(
              email: normalizedEmail,
              password: password,
            );

            if (signUpResponse.user != null) {
              final userId = signUpResponse.user!.id;

              // Create profile
              await _client.from('profiles').insert({
                'id': userId,
                'email': normalizedEmail,
                'full_name': request['full_name'],
                'phone': request['phone'],
                'role': request['role'] ?? 'client',
              });

              // Create client profile if client
              if (request['role'] == 'client' || request['role'] == null) {
                await _client.from('client_profiles').insert({
                  'user_id': userId,
                  'fitness_goal': request['fitness_goal'],
                });

                // Create subscription (supports both schemas: legacy type/price_usd or V2 subscription_type)
                final now = DateTime.now();
                final plan = request['requested_plan'] ?? 'open_gym';
                final planType = plan == 'open_gym' ? 'normal_gym' : plan;

                try {
                  // Try COMPLETE_SETUP_V2 schema first
                  await _client.from('subscriptions').insert({
                    'client_id': userId,
                    'subscription_type': planType,
                    'status': 'active',
                    'start_date': now.toIso8601String().split('T')[0],
                    'end_date': now
                        .add(const Duration(days: 30))
                        .toIso8601String()
                        .split('T')[0],
                  });
                } catch (_) {
                  // Fallback for legacy schema (type, price_usd, pt_sessions_included)
                  await _client.from('subscriptions').insert({
                    'client_id': userId,
                    'type': plan,
                    'status': 'active',
                    'price_usd': plan == 'with_pt' ? 200 : 75,
                    'start_date': now.toIso8601String().split('T')[0],
                    'end_date': now
                        .add(const Duration(days: 30))
                        .toIso8601String()
                        .split('T')[0],
                    'pt_sessions_included': plan == 'with_pt' ? 12 : 0,
                    'pt_sessions_used': 0,
                  });
                }

                // Create loyalty tracking
                await _client.from('loyalty_tracking').insert({
                  'client_id': userId,
                  'consecutive_months': 1,
                  'total_months': 1,
                  'last_subscription_date': now.toIso8601String().split('T')[0],
                });
              } else if (request['role'] == 'trainer') {
                await _client.from('trainer_profiles').insert({
                  'user_id': userId,
                  'is_active': true,
                });
              }

              // Delete registration request
              await _client
                  .from('registration_requests')
                  .delete()
                  .eq('id', request['id']);

              // Sign in
              return await _client.auth.signInWithPassword(
                email: normalizedEmail,
                password: password,
              );
            }
          } catch (createError) {
            // If user already exists in auth, just sign in
            if (createError.toString().contains('already registered')) {
              // Delete the registration request
              await _client
                  .from('registration_requests')
                  .delete()
                  .eq('id', request['id']);

              return await _client.auth.signInWithPassword(
                email: normalizedEmail,
                password: password,
              );
            }
            rethrow;
          }
        }
      }
    }

    // No registration request - try direct login (e.g. user exists in auth from admin add)
    try {
      return await _client.auth.signInWithPassword(
        email: normalizedEmail,
        password: password,
      );
    } catch (e) {
      throw Exception('Invalid email or password. Please try again.');
    }
  }

  /// Submit registration request using Edge Function (secure)
  Future<void> submitRegistrationRequest({
    required String email,
    required String password,
    required String fullName,
    String? phone,
    String role = 'client',
    String plan = 'open_gym',
    String? fitnessGoal,
  }) async {
    final normalizedEmail = email.toLowerCase().trim();

    // Try Edge Function first (with timeout)
    try {
      final response = await http
          .post(
            Uri.parse(_registerUrl),
            headers: {
              'Content-Type': 'application/json',
              'apikey': _anonKey,
            },
            body: jsonEncode({
              'email': normalizedEmail,
              'password': password,
              'fullName': fullName,
              'phone': phone,
              'role': role,
              'plan': plan,
              'fitnessGoal': fitnessGoal,
            }),
          )
          .timeout(const Duration(seconds: 10));

      final data = jsonDecode(response.body);

      if (response.statusCode == 200 && data['success'] == true) {
        return; // Success
      }

      if (response.statusCode == 400 || response.statusCode == 409) {
        throw Exception(data['error'] ?? 'Email already registered');
      }

      throw Exception(data['error'] ?? 'Registration failed');
    } catch (e) {
      if (e.toString().contains('Exception:')) {
        rethrow;
      }

      // Fallback: Insert directly into registration_requests
      // Check if already registered
      final existingProfile = await _client
          .from('profiles')
          .select('id')
          .eq('email', normalizedEmail)
          .maybeSingle();

      if (existingProfile != null) {
        throw Exception('This email is already registered. Please login.');
      }

      // Check for existing request
      final existingRequest = await _client
          .from('registration_requests')
          .select('id, status')
          .eq('email', normalizedEmail)
          .maybeSingle();

      if (existingRequest != null) {
        if (existingRequest['status'] == 'pending') {
          throw Exception(
              'Registration already pending. Please wait for approval.');
        }
        if (existingRequest['status'] == 'approved') {
          throw Exception('Registration approved! Please login.');
        }
        // Delete rejected request
        await _client
            .from('registration_requests')
            .delete()
            .eq('id', existingRequest['id']);
      }

      // Create registration request
      await _client.from('registration_requests').insert({
        'email': normalizedEmail,
        'full_name': fullName,
        'phone': phone,
        'password_hash': _hashPassword(password),
        'role': role,
        'requested_plan': plan,
        'fitness_goal': fitnessGoal,
        'status': 'pending',
      });
    }
  }

  /// Legacy method - redirects to registration request
  Future<AuthResponse> signUpWithEmail({
    required String email,
    required String password,
    required String fullName,
    String? phone,
    UserRole role = UserRole.client,
  }) async {
    await submitRegistrationRequest(
      email: email,
      password: password,
      fullName: fullName,
      phone: phone,
      role: role.name,
    );
    throw Exception(
        'SUCCESS: Registration submitted! Please wait for admin approval.');
  }

  /// Sign out
  Future<void> signOut() async {
    await _client.auth.signOut();
  }

  /// Send password reset email
  Future<void> resetPassword(String email) async {
    await _client.auth.resetPasswordForEmail(email);
  }

  /// Get user profile by ID
  Future<UserProfile?> getUserProfile(String userId) async {
    final response =
        await _client.from('profiles').select().eq('id', userId).maybeSingle();

    if (response == null) return null;
    return UserProfile.fromJson(response);
  }

  /// Update user profile
  Future<UserProfile> updateProfile({
    required String userId,
    String? fullName,
    String? phone,
    String? avatarUrl,
    DateTime? dateOfBirth,
    String? gender,
    String? emergencyContactName,
    String? emergencyContactPhone,
  }) async {
    final updates = <String, dynamic>{};

    if (fullName != null) updates['full_name'] = fullName;
    if (phone != null) updates['phone'] = phone;
    if (avatarUrl != null) updates['avatar_url'] = avatarUrl;
    if (dateOfBirth != null) {
      updates['date_of_birth'] = dateOfBirth.toIso8601String().split('T').first;
    }
    if (gender != null) updates['gender'] = gender;
    if (emergencyContactName != null) {
      updates['emergency_contact_name'] = emergencyContactName;
    }
    if (emergencyContactPhone != null) {
      updates['emergency_contact_phone'] = emergencyContactPhone;
    }

    final response = await _client
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();

    return UserProfile.fromJson(response);
  }

  /// Check if email is already registered
  Future<bool> isEmailRegistered(String email) async {
    final response = await _client
        .from('profiles')
        .select('id')
        .eq('email', email.toLowerCase().trim())
        .maybeSingle();

    return response != null;
  }
}
