import 'package:supabase_flutter/supabase_flutter.dart';

/// Trainer-specific data service
class TrainerService {
  final SupabaseClient _supabase = Supabase.instance.client;
  static String? _cachedDateCol;

  static Future<String> _getBookingDateColumn() async {
    if (_cachedDateCol != null) return _cachedDateCol!;
    try {
      await Supabase.instance.client.from('bookings').select('scheduled_date').limit(1);
      _cachedDateCol = 'scheduled_date';
    } catch (_) {
      _cachedDateCol = 'booking_date';
    }
    return _cachedDateCol!;
  }

  /// Get trainer's assigned clients (client_profiles where assigned_trainer_id = trainer)
  Future<List<Map<String, dynamic>>> getMyClients() async {
    final userId = _supabase.auth.currentUser?.id;
    if (userId == null) return [];

    final res = await _supabase
        .from('client_profiles')
        .select('id, user_id, fitness_goal')
        .eq('assigned_trainer_id', userId) as List<dynamic>;

    if (res.isEmpty) return [];

    final profiles = await _supabase
        .from('profiles')
        .select('id, full_name, email, phone')
        .inFilter('id', res.map((c) => c['user_id']).toList()) as List<dynamic>;

    final profileMap = {
      for (var p in profiles) p['id']: p,
    };

    final List<Map<String, dynamic>> clients = [];
    for (final cp in res) {
      final p = profileMap[cp['user_id']] as Map<String, dynamic>?;
      if (p != null) {
        clients.add({
          'id': cp['id'],
          'user_id': cp['user_id'],
          'full_name': p['full_name'] ?? 'Unknown',
          'email': p['email'],
          'phone': p['phone'],
          'fitness_goal': cp['fitness_goal'],
        });
      }
    }
    return clients;
  }

  /// Get session count per client (from bookings where status = completed)
  Future<Map<String, int>> getSessionCountsByClient() async {
    final userId = _supabase.auth.currentUser?.id;
    if (userId == null) return {};

    final res = await _supabase
        .from('bookings')
        .select('client_id')
        .eq('trainer_id', userId)
        .eq('status', 'completed') as List<dynamic>;

    final counts = <String, int>{};
    for (final r in res) {
      final cid = r['client_id']?.toString();
      if (cid != null) counts[cid] = (counts[cid] ?? 0) + 1;
    }
    return counts;
  }

  /// Get today's schedule (bookings)
  Future<List<Map<String, dynamic>>> getTodaySchedule() async {
    final userId = _supabase.auth.currentUser?.id;
    if (userId == null) return [];

    final today = DateTime.now().toIso8601String().split('T')[0];
    final dateCol = await _getBookingDateColumn();
    final res = await _supabase
        .from('bookings')
        .select('id, client_id, start_time, end_time, session_type, status')
        .eq('trainer_id', userId)
        .eq(dateCol, today)
        .inFilter('status', ['pending', 'confirmed'])
        .order('start_time') as List<dynamic>;

    if (res.isEmpty) return [];

    final clientIds = res.map((b) => b['client_id']).toSet().toList();
    final profiles = await _supabase
        .from('profiles')
        .select('id, full_name')
        .inFilter('id', clientIds) as List<dynamic>;
    final profileMap = {for (var p in profiles) p['id']: p['full_name']};

    return res.map<Map<String, dynamic>>((b) {
      return {
        ...Map<String, dynamic>.from(b as Map),
        'client_name': profileMap[b['client_id']] ?? 'Client',
      };
    }).toList();
  }

  /// Get revenue (sum of amount from completed bookings)
  Future<double> getRevenue({DateTime? from, DateTime? to}) async {
    final userId = _supabase.auth.currentUser?.id;
    if (userId == null) return 0;

    var q = _supabase
        .from('bookings')
        .select('amount')
        .eq('trainer_id', userId)
        .eq('status', 'completed')
        .not('amount', 'is', null);

    final dateCol = await _getBookingDateColumn();
    if (from != null) q = q.gte(dateCol, from.toIso8601String().split('T')[0]);
    if (to != null) q = q.lte(dateCol, to.toIso8601String().split('T')[0]);

    final res = await q as List<dynamic>;
    double sum = 0;
    for (final r in res) {
      final a = r['amount'];
      if (a != null) sum += (a is num ? a.toDouble() : double.tryParse(a.toString()) ?? 0);
    }
    return sum;
  }

  /// Get total time spent (minutes) from completed sessions
  /// Uses booking end_time - start_time when amount/duration not available
  Future<int> getTimeSpentMinutes({DateTime? from, DateTime? to}) async {
    final userId = _supabase.auth.currentUser?.id;
    if (userId == null) return 0;

    var q = _supabase
        .from('bookings')
        .select('start_time, end_time')
        .eq('trainer_id', userId)
        .eq('status', 'completed');

    final dateCol = await _getBookingDateColumn();
    if (from != null) q = q.gte(dateCol, from.toIso8601String().split('T')[0]);
    if (to != null) q = q.lte(dateCol, to.toIso8601String().split('T')[0]);

    final res = await q as List<dynamic>;
    int total = 0;
    for (final r in res) {
      final st = r['start_time']?.toString();
      final et = r['end_time']?.toString();
      if (st != null && et != null) {
        final diff = _parseTimeDiff(st, et);
        if (diff != null) total += diff;
      }
    }
    // Also add workout_logs duration for this trainer
    final wl = await _supabase
        .from('workout_logs')
        .select('duration_minutes')
        .eq('trainer_id', userId)
        .not('duration_minutes', 'is', null) as List<dynamic>;
    for (final r in wl) {
      final d = r['duration_minutes'];
      if (d != null) total += (d is int ? d : int.tryParse(d.toString()) ?? 0);
    }
    return total;
  }

  int? _parseTimeDiff(String start, String end) {
    try {
      final s = start.split(':').map(int.parse).toList();
      final e = end.split(':').map(int.parse).toList();
      if (s.length >= 2 && e.length >= 2) {
        return (e[0] * 60 + (e.length > 2 ? e[2] : 0)) - (s[0] * 60 + (s.length > 2 ? s[2] : 0));
      }
    } catch (_) {}
    return null;
  }

  /// Get trainer offerings (session types/prices)
  Future<List<Map<String, dynamic>>> getMyOfferings() async {
    final userId = _supabase.auth.currentUser?.id;
    if (userId == null) return [];

    final res = await _supabase
        .from('trainer_offerings')
        .select('id, name, description, duration_minutes, price, session_type')
        .eq('trainer_id', userId)
        .eq('is_active', true)
        .order('name') as List<dynamic>;
    return res.map((e) => Map<String, dynamic>.from(e as Map)).toList();
  }

  /// Create a new offering
  Future<void> createOffering({
    required String name,
    String? description,
    int durationMinutes = 60,
    required double price,
    String sessionType = 'pt_session',
  }) async {
    final userId = _supabase.auth.currentUser?.id;
    if (userId == null) throw Exception('Not authenticated');

    await _supabase.from('trainer_offerings').insert({
      'trainer_id': userId,
      'name': name,
      'description': description,
      'duration_minutes': durationMinutes,
      'price': price,
      'session_type': sessionType,
    });
  }

}
