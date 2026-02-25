import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../auth/providers/auth_provider.dart';
import '../widgets/upcoming_session_card.dart';
import '../widgets/quick_stats_card.dart';
import '../widgets/trainer_card.dart';

/// Client home/dashboard screen
class ClientHomeScreen extends ConsumerWidget {
  const ClientHomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final userProfile = ref.watch(currentUserProfileProvider);

    return Scaffold(
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: () async {
            ref.invalidate(currentUserProfileProvider);
          },
          child: SingleChildScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Header with greeting
                _buildHeader(context, userProfile),
                const SizedBox(height: 24),

                // Next session card
                _buildSectionTitle(context, 'Next Session'),
                const SizedBox(height: 12),
                const UpcomingSessionCard(
                  trainerName: 'Coach Ahmad',
                  sessionType: 'Strength Training',
                  dateTime: 'Tomorrow, 10:00 AM',
                  duration: '60 min',
                ),
                const SizedBox(height: 24),

                // Quick stats
                _buildSectionTitle(context, 'This Week'),
                const SizedBox(height: 12),
                const Row(
                  children: [
                    Expanded(
                      child: QuickStatsCard(
                        icon: Icons.fitness_center,
                        label: 'Sessions',
                        value: '3',
                        color: AppColors.primary,
                      ),
                    ),
                    SizedBox(width: 12),
                    Expanded(
                      child: QuickStatsCard(
                        icon: Icons.local_fire_department,
                        label: 'Calories',
                        value: '1,250',
                        color: AppColors.warning,
                      ),
                    ),
                    SizedBox(width: 12),
                    Expanded(
                      child: QuickStatsCard(
                        icon: Icons.trending_up,
                        label: 'Progress',
                        value: '+2%',
                        color: AppColors.success,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 24),

                // Your trainer
                _buildSectionTitle(context, 'Your Trainer'),
                const SizedBox(height: 12),
                const TrainerCard(
                  name: 'Ahmad Khalil',
                  specialization: 'Strength & Conditioning',
                  rating: 4.9,
                  imageUrl: null,
                ),
                const SizedBox(height: 24),

                // Recent progress
                _buildSectionTitle(context, 'Recent Progress'),
                const SizedBox(height: 12),
                _buildProgressCard(context),
                const SizedBox(height: 24),

                // Quick actions
                _buildSectionTitle(context, 'Quick Actions'),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                      child: _buildActionButton(
                        context,
                        icon: Icons.calendar_today,
                        label: 'Book Session',
                        onTap: () {
                          // Navigate to booking
                        },
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: _buildActionButton(
                        context,
                        icon: Icons.monitor_weight,
                        label: 'Log Weight',
                        onTap: () {
                          // Navigate to metrics
                        },
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 40),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildHeader(BuildContext context, AsyncValue userProfile) {
    final name = userProfile.whenOrNull(
          data: (profile) => profile?.fullName.split(' ').first ?? 'there',
        ) ??
        'there';

    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              _getGreeting(),
              style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                    color: AppColors.textSecondary,
                  ),
            ),
            Text(
              'Hi, $name!',
              style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
            ),
          ],
        ),
        // Notification bell
        Stack(
          children: [
            IconButton(
              icon: const Icon(Icons.notifications_outlined),
              iconSize: 28,
              onPressed: () {
                // Navigate to notifications
              },
            ),
            Positioned(
              right: 8,
              top: 8,
              child: Container(
                width: 8,
                height: 8,
                decoration: const BoxDecoration(
                  color: AppColors.error,
                  shape: BoxShape.circle,
                ),
              ),
            ),
          ],
        ),
      ],
    );
  }

  String _getGreeting() {
    final hour = DateTime.now().hour;
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }

  Widget _buildSectionTitle(BuildContext context, String title) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          title,
          style: Theme.of(context).textTheme.titleLarge?.copyWith(
                fontWeight: FontWeight.bold,
              ),
        ),
        TextButton(
          onPressed: () {},
          child: const Text('See All'),
        ),
      ],
    );
  }

  Widget _buildProgressCard(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: AppColors.primaryGradient,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Weight Progress',
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      color: Colors.white,
                      fontWeight: FontWeight.w600,
                    ),
              ),
              const Icon(Icons.trending_down, color: Colors.white),
            ],
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              _buildProgressStat(context, '85.5', 'Current (kg)'),
              const SizedBox(width: 32),
              _buildProgressStat(context, '80.0', 'Goal (kg)'),
              const SizedBox(width: 32),
              _buildProgressStat(context, '-2.5', 'Lost (kg)'),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildProgressStat(BuildContext context, String value, String label) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          value,
          style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                color: Colors.white,
                fontWeight: FontWeight.bold,
              ),
        ),
        Text(
          label,
          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: Colors.white.withOpacity(0.8),
              ),
        ),
      ],
    );
  }

  Widget _buildActionButton(
    BuildContext context, {
    required IconData icon,
    required String label,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 16),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppColors.cardBorder),
        ),
        child: Column(
          children: [
            Icon(icon, color: AppColors.primary, size: 28),
            const SizedBox(height: 8),
            Text(
              label,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    fontWeight: FontWeight.w500,
                  ),
            ),
          ],
        ),
      ),
    );
  }
}
