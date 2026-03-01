import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/theme/fitness_theme.dart';
import '../../../../core/widgets/icon_box.dart';
import '../../../../core/router/app_router.dart';
import '../../../auth/providers/auth_provider.dart';
import '../widgets/upcoming_session_card.dart';
import '../widgets/trainer_card.dart';
import '../widgets/subscription_days_card.dart';

/// Client home - Pixel True Fitness UI (free from pixeltrue.com)
class ClientHomeScreen extends ConsumerWidget {
  const ClientHomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final userProfile = ref.watch(currentUserProfileProvider);

    return Scaffold(
      backgroundColor: FitnessColors.black,
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: () async => ref.invalidate(currentUserProfileProvider),
          color: FitnessColors.primaryColor1,
          child: SingleChildScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildHeader(context, userProfile),
                const SizedBox(height: 24),

                _buildWeeklyGoal(context),
                const SizedBox(height: 20),

                const SubscriptionDaysCard(),
                const SizedBox(height: 24),

                _sectionTitle(context, 'Next Session'),
                const SizedBox(height: 12),
                const UpcomingSessionCard(
                  trainerName: 'Coach Ahmad',
                  sessionType: 'Strength Training',
                  dateTime: 'Tomorrow, 10:00 AM',
                  duration: '60 min',
                ),
                const SizedBox(height: 24),

                _sectionTitle(context, 'This Week'),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(child: _statCard(context, Icons.fitness_center, '3', 'Sessions', FitnessColors.primaryG)),
                    const SizedBox(width: 12),
                    Expanded(child: _statCard(context, Icons.local_fire_department, '1,250', 'Calories', FitnessColors.secondaryG)),
                    const SizedBox(width: 12),
                    Expanded(child: _statCard(context, Icons.trending_up, '+2%', 'Progress', FitnessColors.primaryG)),
                  ],
                ),
                const SizedBox(height: 24),

                _sectionTitle(context, 'Your Trainer'),
                const SizedBox(height: 12),
                const TrainerCard(
                  name: 'Ahmad Khalil',
                  specialization: 'Strength & Conditioning',
                  rating: 4.9,
                  imageUrl: null,
                ),
                const SizedBox(height: 24),

                _sectionTitle(context, 'Recent Progress'),
                const SizedBox(height: 12),
                _buildProgressCard(context),
                const SizedBox(height: 24),

                _sectionTitle(context, 'Quick Actions'),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                      child: _actionCard(context, Icons.calendar_today, 'Book Session',
                          () => context.go(AppRoutes.clientBookings)),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: _actionCard(context, Icons.monitor_weight, 'Log Weight',
                          () => context.push(AppRoutes.clientBodyComposition)),
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
          data: (p) => p?.fullName.split(' ').first ?? 'there',
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
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: FitnessColors.grayLight,
                  ),
            ),
            Text(
              'Hi, $name!',
              style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                    color: FitnessColors.white,
                  ),
            ),
          ],
        ),
        Container(
          padding: const EdgeInsets.all(10),
          decoration: BoxDecoration(
            color: FitnessColors.blackCard,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: FitnessColors.yellow.withOpacity(0.3)),
          ),
          child: Stack(
            clipBehavior: Clip.none,
            children: [
              Icon(Icons.notifications_outlined, color: FitnessColors.yellow, size: 24),
              Positioned(
                right: 0,
                top: 0,
                child: Container(
                  width: 8,
                  height: 8,
                  decoration: const BoxDecoration(
                    color: FitnessColors.yellow,
                    shape: BoxShape.circle,
                  ),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildWeeklyGoal(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: FitnessColors.primaryGradient,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: FitnessColors.primaryColor1.withOpacity(0.3),
            blurRadius: 12,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Row(
        children: [
          SizedBox(
            width: 64,
            height: 64,
            child: Stack(
              alignment: Alignment.center,
              children: [
                CircularProgressIndicator(
                  value: 3 / 5,
                  backgroundColor: Colors.white.withOpacity(0.3),
                  valueColor: const AlwaysStoppedAnimation<Color>(FitnessColors.white),
                  strokeWidth: 4,
                ),
                Text(
                  '3',
                  style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                        fontWeight: FontWeight.bold,
                        color: FitnessColors.white,
                      ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 20),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Weekly Goal',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.w600,
                        color: FitnessColors.white,
                      ),
                ),
                const SizedBox(height: 4),
                Text(
                  '3 of 5 sessions done this week',
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: FitnessColors.white.withOpacity(0.9),
                      ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  String _getGreeting() {
    final h = DateTime.now().hour;
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  }

  Widget _sectionTitle(BuildContext context, String title) {
    return Text(
      title,
      style: Theme.of(context).textTheme.titleLarge?.copyWith(
            fontWeight: FontWeight.bold,
            color: FitnessColors.white,
          ),
    );
  }

  Widget _statCard(BuildContext context, IconData icon, String value, String label, List<Color> gradient) {
    final isYellow = gradient == FitnessColors.secondaryG;
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: FitnessColors.blackCard,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: (isYellow ? FitnessColors.yellow : FitnessColors.green).withOpacity(0.3)),
        boxShadow: [
          BoxShadow(
            color: (isYellow ? FitnessColors.yellow : FitnessColors.green).withOpacity(0.1),
            blurRadius: 8,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          IconBox(
            icon: Icon(icon, color: FitnessColors.white, size: 22),
            style: isYellow ? IconBoxStyle.yellow : IconBoxStyle.green,
            size: 44,
          ),
          const SizedBox(height: 12),
          Text(
            value,
            style: Theme.of(context).textTheme.titleLarge?.copyWith(
                  fontWeight: FontWeight.bold,
                  color: FitnessColors.white,
                ),
          ),
          Text(
            label,
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: FitnessColors.grayLight,
                  fontSize: 11,
                ),
          ),
        ],
      ),
    );
  }

  Widget _buildProgressCard(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: FitnessColors.accentGradient,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: FitnessColors.yellow.withOpacity(0.3),
            blurRadius: 12,
            offset: const Offset(0, 6),
          ),
        ],
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
                      color: FitnessColors.black,
                      fontWeight: FontWeight.w600,
                    ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.2),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.trending_down_rounded, color: FitnessColors.black, size: 16),
                    const SizedBox(width: 4),
                    Text(
                      '-2.5 kg',
                      style: Theme.of(context).textTheme.labelMedium?.copyWith(
                            color: FitnessColors.black,
                            fontWeight: FontWeight.w600,
                          ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),
          Row(
            children: [
              _progressStat(context, '85.5', 'Current (kg)'),
              const SizedBox(width: 24),
              _progressStat(context, '80.0', 'Goal (kg)'),
              const SizedBox(width: 24),
              _progressStat(context, '-2.5', 'Lost (kg)'),
            ],
          ),
        ],
      ),
    );
  }

  Widget _progressStat(BuildContext context, String value, String label) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          value,
          style: Theme.of(context).textTheme.titleLarge?.copyWith(
                color: FitnessColors.black,
                fontWeight: FontWeight.bold,
              ),
        ),
        Text(
          label,
          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: FitnessColors.black.withOpacity(0.7),
                fontSize: 11,
              ),
        ),
      ],
    );
  }

  Widget _actionCard(BuildContext context, IconData icon, String label, VoidCallback onTap) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 20),
        decoration: BoxDecoration(
          color: FitnessColors.blackCard,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: FitnessColors.green.withOpacity(0.3)),
          boxShadow: [
            BoxShadow(
              color: FitnessColors.green.withOpacity(0.1),
              blurRadius: 8,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Column(
          children: [
            IconBox(
              icon: Icon(icon, color: FitnessColors.white, size: 24),
              style: IconBoxStyle.green,
              size: 48,
            ),
            const SizedBox(height: 12),
            Text(
              label,
              style: Theme.of(context).textTheme.titleSmall?.copyWith(
                    fontWeight: FontWeight.w600,
                    color: FitnessColors.white,
                  ),
            ),
            ],
          ),
        ),
      ),
    );
  }
}
