import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import 'package:shared_preferences/shared_preferences.dart';

import '../../features/auth/presentation/screens/login_screen.dart';
import '../../features/auth/presentation/screens/register_screen.dart';
import '../../features/auth/presentation/screens/set_password_screen.dart';
import '../../features/auth/presentation/screens/splash_screen.dart';
import '../../features/auth/providers/auth_provider.dart';
import '../../features/client/presentation/screens/client_home_screen.dart';
import '../../features/client/presentation/screens/client_bookings_screen.dart';
import '../../features/client/presentation/screens/client_progress_screen.dart';
import '../../features/client/presentation/screens/client_profile_screen.dart';
import '../../features/trainer/presentation/screens/trainer_home_screen.dart';
import '../../features/trainer/presentation/screens/trainer_clients_screen.dart';
import '../../features/trainer/presentation/screens/trainer_schedule_screen.dart';
import '../../features/trainer/presentation/screens/trainer_offerings_screen.dart';
import '../../features/trainer/presentation/screens/trainer_profile_screen.dart';
import '../../features/shared/presentation/screens/booking_detail_screen.dart';
import '../../models/user_model.dart';
import '../../features/shared/presentation/widgets/main_scaffold.dart';
import '../../features/body_composition/presentation/screens/body_composition_screen.dart';
import '../../features/nutrition/presentation/screens/diet_plans_screen.dart';
import '../../features/nutrition/presentation/screens/meal_log_screen.dart';

/// Route names as constants for type-safe navigation
class AppRoutes {
  AppRoutes._();

  // Auth routes
  static const String splash = '/';
  static const String login = '/login';
  static const String register = '/register';
  static const String setPassword = '/set-password';

  // Client routes
  static const String clientHome = '/client';
  static const String clientBookings = '/client/bookings';
  static const String clientProgress = '/client/progress';
  static const String clientProfile = '/client/profile';
  static const String clientBodyComposition = '/client/body-composition';
  static const String clientDietPlans = '/client/diet-plans';
  static const String clientMealLog = '/client/meal-log';

  // Trainer routes
  static const String trainerHome = '/trainer';
  static const String trainerClients = '/trainer/clients';
  static const String trainerSchedule = '/trainer/schedule';
  static const String trainerOfferings = '/trainer/offerings';
  static const String trainerProfile = '/trainer/profile';

  // Shared routes
  static const String bookingDetail = '/booking/:id';
}

/// Navigation keys for nested navigators
final _rootNavigatorKey = GlobalKey<NavigatorState>();
final _clientShellNavigatorKey = GlobalKey<NavigatorState>();
final _trainerShellNavigatorKey = GlobalKey<NavigatorState>();

/// Router provider with authentication redirect logic
final appRouterProvider = Provider<GoRouter>((ref) {
  final authState = ref.watch(authStateProvider);

  return GoRouter(
    navigatorKey: _rootNavigatorKey,
    initialLocation: kIsWeb ? AppRoutes.login : AppRoutes.splash,
    debugLogDiagnostics: false,
    redirect: (context, state) async {
      final authService = ref.read(authServiceProvider);
      final user = authState.valueOrNull;
      final isLoggedIn = user != null;
      final isLoggingIn = state.matchedLocation == AppRoutes.login ||
          state.matchedLocation == AppRoutes.register;
      final isSplash = state.matchedLocation == AppRoutes.splash;
      final isSetPassword = state.matchedLocation == AppRoutes.setPassword;
      final isProtectedRoute = state.matchedLocation.startsWith('/client') ||
          state.matchedLocation.startsWith('/trainer') ||
          state.matchedLocation.startsWith('/booking');

      // Auth still loading: stay on login/register/splash; only redirect protected routes to splash
      if (authState.isLoading) {
        if (isLoggingIn || isSplash) return null;
        if (isProtectedRoute) return AppRoutes.splash;
        return null;
      }

      // Not logged in
      if (!isLoggedIn) {
        if (isSetPassword) return AppRoutes.login;
        if (!isLoggingIn && !isSplash) return AppRoutes.login;
        return null;
      }

      // Logged in - check if first-time password setup required
      final needsPasswordChange = user.userMetadata?['needs_password_change'] == true;
      if (needsPasswordChange && !isSetPassword) {
        final prefs = await SharedPreferences.getInstance();
        final completed = prefs.getBool('password_set_${user.id}') ?? false;
        if (!completed) return AppRoutes.setPassword;
      }

      // Logged in on auth screens -> go to home by role
      if (isLoggingIn || isSplash) {
        final profile = await authService.getUserProfile(user.id);
        if (profile?.role == UserRole.trainer) return AppRoutes.trainerHome;
        return AppRoutes.clientHome;
      }

      return null;
    },
    routes: [
      // Splash Screen
      GoRoute(
        path: AppRoutes.splash,
        builder: (context, state) => const SplashScreen(),
      ),

      // Auth Routes
      GoRoute(
        path: AppRoutes.login,
        builder: (context, state) => const LoginScreen(),
      ),
      GoRoute(
        path: AppRoutes.register,
        builder: (context, state) => const RegisterScreen(),
      ),
      GoRoute(
        path: AppRoutes.setPassword,
        builder: (context, state) => const SetPasswordScreen(),
      ),

      // Client Shell (Bottom Navigation)
      ShellRoute(
        navigatorKey: _clientShellNavigatorKey,
        builder: (context, state, child) => MainScaffold(
          userRole: UserRole.client,
          child: child,
        ),
        routes: [
          GoRoute(
            path: AppRoutes.clientHome,
            pageBuilder: (context, state) => const NoTransitionPage(
              child: ClientHomeScreen(),
            ),
          ),
          GoRoute(
            path: AppRoutes.clientBookings,
            pageBuilder: (context, state) => const NoTransitionPage(
              child: ClientBookingsScreen(),
            ),
          ),
          GoRoute(
            path: AppRoutes.clientProgress,
            pageBuilder: (context, state) => const NoTransitionPage(
              child: ClientProgressScreen(),
            ),
          ),
          GoRoute(
            path: AppRoutes.clientProfile,
            pageBuilder: (context, state) => const NoTransitionPage(
              child: ClientProfileScreen(),
            ),
          ),
        ],
      ),

      // Trainer Shell (Bottom Navigation)
      ShellRoute(
        navigatorKey: _trainerShellNavigatorKey,
        builder: (context, state, child) => MainScaffold(
          userRole: UserRole.trainer,
          child: child,
        ),
        routes: [
          GoRoute(
            path: AppRoutes.trainerHome,
            pageBuilder: (context, state) => const NoTransitionPage(
              child: TrainerHomeScreen(),
            ),
          ),
          GoRoute(
            path: AppRoutes.trainerClients,
            pageBuilder: (context, state) => const NoTransitionPage(
              child: TrainerClientsScreen(),
            ),
          ),
          GoRoute(
            path: AppRoutes.trainerSchedule,
            pageBuilder: (context, state) => const NoTransitionPage(
              child: TrainerScheduleScreen(),
            ),
          ),
          GoRoute(
            path: AppRoutes.trainerOfferings,
            pageBuilder: (context, state) => const NoTransitionPage(
              child: TrainerOfferingsScreen(),
            ),
          ),
          GoRoute(
            path: AppRoutes.trainerProfile,
            pageBuilder: (context, state) => const NoTransitionPage(
              child: TrainerProfileScreen(),
            ),
          ),
        ],
      ),

      // Booking Detail (Full screen, no bottom nav)
      GoRoute(
        path: AppRoutes.bookingDetail,
        builder: (context, state) {
          final bookingId = state.pathParameters['id']!;
          return BookingDetailScreen(bookingId: bookingId);
        },
      ),

      // Body Composition Screen (Full screen)
      GoRoute(
        path: AppRoutes.clientBodyComposition,
        builder: (context, state) => const BodyCompositionScreen(),
      ),

      // Diet Plans Screen (Full screen)
      GoRoute(
        path: AppRoutes.clientDietPlans,
        builder: (context, state) => const DietPlansScreen(),
      ),

      // Meal Log Screen (Full screen)
      GoRoute(
        path: AppRoutes.clientMealLog,
        builder: (context, state) => const MealLogScreen(),
      ),
    ],
    errorBuilder: (context, state) => Scaffold(
      body: Center(
        child: Text('Page not found: ${state.uri}'),
      ),
    ),
  );
});

