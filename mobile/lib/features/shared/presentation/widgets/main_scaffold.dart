import 'dart:ui';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/widgets/video_background.dart';
import '../../../../core/router/app_router.dart';
import '../../../../models/user_model.dart';
import '../../../auth/providers/subscription_provider.dart';

/// Main scaffold with bottom navigation - same gym video as admin, glassy content overlay
/// For clients: hides Sessions (PT) tab when plan is Nutrition-only (with_dietitian)
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
      body: Stack(
        fit: StackFit.expand,
        children: [
          const VideoBackground(),
          ColoredBox(color: Colors.black.withValues(alpha: 0.25)),
          ClipRect(
            child: BackdropFilter(
              filter: ImageFilter.blur(sigmaX: 6, sigmaY: 6),
              child: Container(
                color: Colors.black.withValues(alpha: 0.2),
                child: child,
              ),
            ),
          ),
        ],
      ),
      bottomNavigationBar: _buildBottomNav(context, ref),
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
    final destinations = [
      const NavigationDestination(
        icon: Icon(Icons.home_outlined),
        selectedIcon: Icon(Icons.home),
        label: 'Home',
      ),
      if (hasPtAccess)
        const NavigationDestination(
          icon: Icon(Icons.calendar_today_outlined),
          selectedIcon: Icon(Icons.calendar_today),
          label: 'Sessions',
        ),
      const NavigationDestination(
        icon: Icon(Icons.trending_up_outlined),
        selectedIcon: Icon(Icons.trending_up),
        label: 'Progress',
      ),
      const NavigationDestination(
        icon: Icon(Icons.person_outline),
        selectedIcon: Icon(Icons.person),
        label: 'Profile',
      ),
    ];
    final idx = _getClientIndex(location, hasPtAccess);
    return Container(
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surface.withValues(alpha: 0.85),
      ),
      child: NavigationBar(
        selectedIndex: idx.clamp(0, destinations.length - 1),
        onDestinationSelected: (index) => _onClientNavTap(context, index, hasPtAccess),
        destinations: destinations,
      ),
    );
  }

  Widget _buildTrainerNav(BuildContext context, String location) {
    return Container(
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surface.withValues(alpha: 0.85),
      ),
      child: NavigationBar(
        selectedIndex: _getTrainerIndex(location),
        onDestinationSelected: (index) => _onTrainerNavTap(context, index),
        destinations: const [
        NavigationDestination(
          icon: Icon(Icons.home_outlined),
          selectedIcon: Icon(Icons.home),
          label: 'Home',
        ),
        NavigationDestination(
          icon: Icon(Icons.people_outline),
          selectedIcon: Icon(Icons.people),
          label: 'Clients',
        ),
        NavigationDestination(
          icon: Icon(Icons.calendar_month_outlined),
          selectedIcon: Icon(Icons.calendar_month),
          label: 'Schedule',
        ),
        NavigationDestination(
          icon: Icon(Icons.sell_outlined),
          selectedIcon: Icon(Icons.sell),
          label: 'Offerings',
        ),
        NavigationDestination(
          icon: Icon(Icons.person_outline),
          selectedIcon: Icon(Icons.person),
          label: 'Profile',
        ),
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

  void _onClientNavTap(BuildContext context, int index, bool hasPtAccess) {
    if (hasPtAccess) {
      switch (index) {
        case 0:
          context.go(AppRoutes.clientHome);
          break;
        case 1:
          context.go(AppRoutes.clientBookings);
          break;
        case 2:
          context.go(AppRoutes.clientProgress);
          break;
        case 3:
          context.go(AppRoutes.clientProfile);
          break;
      }
    } else {
      switch (index) {
        case 0:
          context.go(AppRoutes.clientHome);
          break;
        case 1:
          context.go(AppRoutes.clientProgress);
          break;
        case 2:
          context.go(AppRoutes.clientProfile);
          break;
      }
    }
  }

  void _onTrainerNavTap(BuildContext context, int index) {
    switch (index) {
      case 0:
        context.go(AppRoutes.trainerHome);
        break;
      case 1:
        context.go(AppRoutes.trainerClients);
        break;
      case 2:
        context.go(AppRoutes.trainerSchedule);
        break;
      case 3:
        context.go(AppRoutes.trainerOfferings);
        break;
      case 4:
        context.go(AppRoutes.trainerProfile);
        break;
    }
  }
}
