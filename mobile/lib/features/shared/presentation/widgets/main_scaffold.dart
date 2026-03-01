import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/router/app_router.dart';
import '../../../../core/theme/fitness_theme.dart';
import '../../../../models/user_model.dart';
import '../../../auth/providers/subscription_provider.dart';

/// Main scaffold - Pixel True Fitness UI style (light, center FAB)
/// Free design from: pixeltrue.com/free-ui-kits/fitness-app-ui-kit
class MainScaffold extends ConsumerWidget {
  final Widget child;
  final UserRole userRole;

  const MainScaffold({
    super.key,
    required this.child,
    required this.userRole,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      backgroundColor: FitnessColors.black,
      body: child,
      floatingActionButtonLocation: FloatingActionButtonLocation.centerDocked,
      floatingActionButton: _buildCenterFAB(context, ref),
      bottomNavigationBar: _buildBottomNav(context, ref),
    );
  }

  Widget? _buildCenterFAB(BuildContext context, WidgetRef ref) {
    if (userRole != UserRole.client) return null;
    return SizedBox(
      width: 64,
      height: 64,
      child: Material(
        elevation: 4,
        shadowColor: Colors.black26,
        borderRadius: BorderRadius.circular(32),
        child: InkWell(
          onTap: () => context.go(AppRoutes.clientBookings),
          borderRadius: BorderRadius.circular(32),
            child: Container(
              decoration: const BoxDecoration(
                gradient: FitnessColors.primaryGradient,
                borderRadius: BorderRadius.all(Radius.circular(32)),
              ),
            child: const Icon(
              Icons.calendar_today_rounded,
              color: FitnessColors.white,
              size: 28,
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildBottomNav(BuildContext context, WidgetRef ref) {
    final location = GoRouterState.of(context).matchedLocation;

    if (userRole == UserRole.client) {
      return _buildClientNav(context, ref, location);
    } else {
      return _buildTrainerNav(context, location);
    }
  }

  Widget _buildClientNav(BuildContext context, WidgetRef ref, String location) {
    final hasPtAccess = ref.watch(clientHasPtAccessProvider);
    final idx = _getClientIndex(location, hasPtAccess);

    return BottomAppBar(
      height: 68,
      padding: EdgeInsets.zero,
      notchMargin: 8,
      shape: const CircularNotchedRectangle(),
      color: FitnessColors.blackCard,
      elevation: 8,
      shadowColor: Colors.black,
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: [
          _navItem(context, Icons.home_outlined, Icons.home_rounded, 'Home', idx == 0,
              () => context.go(AppRoutes.clientHome)),
          if (hasPtAccess)
            _navItem(context, Icons.calendar_today_outlined, Icons.calendar_today_rounded, 'Sessions',
                idx == 1, () => context.go(AppRoutes.clientBookings)),
          const SizedBox(width: 48),
          _navItem(context, Icons.trending_up_outlined, Icons.trending_up_rounded, 'Progress',
              idx == (hasPtAccess ? 2 : 1), () => context.go(AppRoutes.clientProgress)),
          _navItem(context, Icons.person_outline, Icons.person_rounded, 'Profile',
              idx == (hasPtAccess ? 3 : 2), () => context.go(AppRoutes.clientProfile)),
        ],
      ),
    );
  }

  Widget _navItem(BuildContext context, IconData icon, IconData selectedIcon, String label,
      bool isActive, VoidCallback onTap) {
    return InkWell(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 6),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              isActive ? selectedIcon : icon,
              color: isActive ? FitnessColors.green : FitnessColors.gray,
              size: 24,
            ),
            const SizedBox(height: 2),
            Text(
              label,
              style: TextStyle(
                fontSize: 10,
                color: isActive ? FitnessColors.green : FitnessColors.gray,
                fontWeight: isActive ? FontWeight.w600 : FontWeight.normal,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTrainerNav(BuildContext context, String location) {
    final idx = _getTrainerIndex(location);

    return BottomAppBar(
      height: 68,
      padding: EdgeInsets.zero,
      color: FitnessColors.blackCard,
      elevation: 8,
      shadowColor: Colors.black,
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: [
          _navItem(context, Icons.home_outlined, Icons.home_rounded, 'Home', idx == 0,
              () => context.go(AppRoutes.trainerHome)),
          _navItem(context, Icons.people_outline, Icons.people_rounded, 'Clients', idx == 1,
              () => context.go(AppRoutes.trainerClients)),
          _navItem(context, Icons.calendar_month_outlined, Icons.calendar_month_rounded, 'Schedule',
              idx == 2, () => context.go(AppRoutes.trainerSchedule)),
          _navItem(context, Icons.sell_outlined, Icons.sell_rounded, 'Offerings', idx == 3,
              () => context.go(AppRoutes.trainerOfferings)),
          _navItem(context, Icons.person_outline, Icons.person_rounded, 'Profile', idx == 4,
              () => context.go(AppRoutes.trainerProfile)),
        ],
      ),
    );
  }

  int _getClientIndex(String location, bool hasPtAccess) {
    if (location.startsWith(AppRoutes.clientBookings)) return hasPtAccess ? 1 : 0;
    if (location.startsWith(AppRoutes.clientProgress)) return hasPtAccess ? 2 : 1;
    if (location.startsWith(AppRoutes.clientProfile)) return hasPtAccess ? 3 : 2;
    return 0;
  }

  int _getTrainerIndex(String location) {
    if (location.startsWith(AppRoutes.trainerClients)) return 1;
    if (location.startsWith(AppRoutes.trainerSchedule)) return 2;
    if (location.startsWith(AppRoutes.trainerOfferings)) return 3;
    if (location.startsWith(AppRoutes.trainerProfile)) return 4;
    return 0;
  }
}
