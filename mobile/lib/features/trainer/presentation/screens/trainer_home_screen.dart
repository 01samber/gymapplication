import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../auth/providers/auth_provider.dart';
import '../../providers/trainer_provider.dart';

/// Trainer home/dashboard screen - real data from Supabase
class TrainerHomeScreen extends ConsumerWidget {
  const TrainerHomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final userProfile = ref.watch(currentUserProfileProvider);
    final clientsAsync = ref.watch(trainerClientsProvider);
    final scheduleAsync = ref.watch(trainerTodayScheduleProvider);
    final revenueAsync = ref.watch(trainerRevenueProvider);
    final timeSpentAsync = ref.watch(trainerTimeSpentProvider);
    final sessionCountsAsync = ref.watch(trainerSessionCountsProvider);

    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _buildHeader(context, userProfile),
              const SizedBox(height: 24),

              _buildSectionTitle(context, "Today's Schedule"),
              const SizedBox(height: 12),
              _buildTodaySchedule(context, scheduleAsync),
              const SizedBox(height: 24),

              _buildSectionTitle(context, 'This Week'),
              const SizedBox(height: 12),
              _buildWeekStats(
                context,
                clientsAsync,
                sessionCountsAsync,
                revenueAsync,
                timeSpentAsync,
              ),
              const SizedBox(height: 24),

              _buildSectionTitle(context, 'My Clients'),
              const SizedBox(height: 12),
              _buildClientUpdates(context, clientsAsync, sessionCountsAsync),
              const SizedBox(height: 40),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildHeader(BuildContext context, AsyncValue userProfile) {
    final name = userProfile.whenOrNull(
          data: (profile) => profile?.fullName.split(' ').first ?? 'Coach',
        ) ??
        'Coach';

    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Welcome back,',
              style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                    color: AppColors.textSecondary,
                  ),
            ),
            Text(
              'Coach $name',
              style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
            ),
          ],
        ),
        Stack(
          children: [
            IconButton(
              icon: const Icon(Icons.notifications_outlined),
              iconSize: 28,
              onPressed: () {},
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
      ],
    );
  }

  Widget _buildTodaySchedule(
    BuildContext context,
    AsyncValue<List<Map<String, dynamic>>> scheduleAsync,
  ) {
    return scheduleAsync.when(
      data: (sessions) {
        if (sessions.isEmpty) {
          return _glassCard(
            context,
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: Center(
                child: Text(
                  'No sessions today',
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: AppColors.textSecondary,
                      ),
                ),
              ),
            ),
          );
        }
        return Column(
          children: sessions.map((session) {
            final time = session['start_time']?.toString() ?? '--:--';
            final client = session['client_name'] ?? 'Client';
            final type = session['session_type'] ?? 'Session';
            return Container(
              margin: const EdgeInsets.only(bottom: 12),
              child: _glassCard(
                context,
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Row(
                    children: [
                      Container(
                        width: 4,
                        height: 50,
                        decoration: BoxDecoration(
                          color: AppColors.primary,
                          borderRadius: BorderRadius.circular(2),
                        ),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              client,
                              style:
                                  Theme.of(context).textTheme.titleMedium?.copyWith(
                                        fontWeight: FontWeight.w600,
                                      ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              '$time • ${type.toString().replaceAll('_', ' ')}',
                              style:
                                  Theme.of(context).textTheme.bodyMedium?.copyWith(
                                        color: AppColors.textSecondary,
                                      ),
                            ),
                          ],
                        ),
                      ),
                      IconButton(
                        icon: const Icon(Icons.chevron_right),
                        onPressed: () {},
                      ),
                    ],
                  ),
                ),
              ),
            );
          }).toList(),
        );
      },
      loading: () => _glassCard(
        context,
        child: const Padding(
          padding: EdgeInsets.all(32),
          child: Center(child: CircularProgressIndicator()),
        ),
      ),
      error: (_, __) => _glassCard(
        context,
        child: const Padding(
          padding: EdgeInsets.all(24),
          child: Center(child: Text('Failed to load schedule')),
        ),
      ),
    );
  }

  Widget _buildWeekStats(
    BuildContext context,
    AsyncValue<List<Map<String, dynamic>>> clientsAsync,
    AsyncValue<Map<String, int>> sessionCountsAsync,
    AsyncValue<double> revenueAsync,
    AsyncValue<int> timeSpentAsync,
  ) {
    final clientCount = clientsAsync.valueOrNull?.length ?? 0;
    final sessionCount =
        sessionCountsAsync.valueOrNull?.values.fold<int>(0, (a, b) => a + b) ?? 0;
    final revenue = revenueAsync.valueOrNull ?? 0;
    final minutes = timeSpentAsync.valueOrNull ?? 0;
    final hours = (minutes / 60).toStringAsFixed(1);

    return Column(
      children: [
        Row(
          children: [
            Expanded(
              child: _buildStatCard(
                context,
                icon: Icons.event,
                value: '$sessionCount',
                label: 'Sessions',
                color: AppColors.primary,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _buildStatCard(
                context,
                icon: Icons.people,
                value: '$clientCount',
                label: 'Clients',
                color: AppColors.secondary,
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(
              child: _buildStatCard(
                context,
                icon: Icons.timer,
                value: '${hours}h',
                label: 'Time Spent',
                color: AppColors.success,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _buildStatCard(
                context,
                icon: Icons.attach_money,
                value: '\$${revenue.toStringAsFixed(0)}',
                label: 'Revenue',
                color: AppColors.warning,
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildStatCard(
    BuildContext context, {
    required IconData icon,
    required String value,
    required String label,
    required Color color,
  }) {
    return _glassCard(
      context,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            Icon(icon, color: color, size: 24),
            const SizedBox(height: 8),
            Text(
              value,
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.bold,
                    color: color,
                  ),
            ),
            Text(
              label,
              style: Theme.of(context).textTheme.labelSmall?.copyWith(
                    color: color.withOpacity(0.8),
                  ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildClientUpdates(
    BuildContext context,
    AsyncValue<List<Map<String, dynamic>>> clientsAsync,
    AsyncValue<Map<String, int>> sessionCountsAsync,
  ) {
    return clientsAsync.when(
      data: (clients) {
        final counts = sessionCountsAsync.valueOrNull ?? {};
        if (clients.isEmpty) {
          return _glassCard(
            context,
            child: const Padding(
              padding: EdgeInsets.all(24),
              child: Center(child: Text('No clients assigned yet')),
            ),
          );
        }
        return Column(
          children: clients.take(5).map((client) {
            final cid = client['user_id']?.toString() ?? '';
            final sessions = counts[cid] ?? 0;
            return Container(
              margin: const EdgeInsets.only(bottom: 12),
              child: _glassCard(
                context,
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Row(
                    children: [
                      CircleAvatar(
                        radius: 20,
                        backgroundColor: AppColors.secondary.withOpacity(0.2),
                        child: Text(
                          _getInitials(client['full_name'] ?? '?'),
                          style: const TextStyle(
                            color: AppColors.secondary,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              client['full_name'] ?? 'Client',
                              style:
                                  Theme.of(context).textTheme.titleSmall?.copyWith(
                                        fontWeight: FontWeight.w600,
                                      ),
                            ),
                            Text(
                              '${_goalLabel(client['fitness_goal'])} • $sessions sessions',
                              style:
                                  Theme.of(context).textTheme.bodySmall?.copyWith(
                                        color: AppColors.textSecondary,
                                      ),
                            ),
                          ],
                        ),
                      ),
                      const Icon(
                        Icons.chevron_right,
                        color: AppColors.textHint,
                        size: 20,
                      ),
                    ],
                  ),
                ),
              ),
            );
          }).toList(),
        );
      },
      loading: () => _glassCard(
        context,
        child: const Padding(
          padding: EdgeInsets.all(32),
          child: Center(child: CircularProgressIndicator()),
        ),
      ),
      error: (_, __) => _glassCard(
        context,
        child: const Padding(
          padding: EdgeInsets.all(24),
          child: Center(child: Text('Failed to load clients')),
        ),
      ),
    );
  }

  Widget _glassCard(BuildContext context, {required Widget child}) {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.surface.withOpacity(0.4),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.cardBorder.withOpacity(0.5)),
      ),
      child: child,
    );
  }

  String _getInitials(String name) {
    final names = name.split(' ');
    if (names.length >= 2) {
      return '${names.first[0]}${names.last[0]}'.toUpperCase();
    }
    return name.isNotEmpty ? name[0].toUpperCase() : '?';
  }

  String _goalLabel(String? goal) {
    if (goal == null || goal.isEmpty) return 'No goal';
    const labels = {
      'weight_loss': 'Weight Loss',
      'muscle_gain': 'Muscle Gain',
      'general_fitness': 'General Fitness',
      'strength': 'Strength',
      'endurance': 'Endurance',
    };
    return labels[goal] ?? goal;
  }
}
