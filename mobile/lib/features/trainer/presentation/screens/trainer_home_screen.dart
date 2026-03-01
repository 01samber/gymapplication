import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/theme/fitness_theme.dart';
import '../../../auth/providers/auth_provider.dart';
import '../../providers/trainer_provider.dart';

/// Trainer home - Pixel True Fitness UI style
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
      backgroundColor: FitnessColors.black,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _buildHeader(context, userProfile),
              const SizedBox(height: 24),

              _sectionTitle(context, "Today's Schedule"),
              const SizedBox(height: 12),
              _buildTodaySchedule(context, scheduleAsync),
              const SizedBox(height: 24),

              _sectionTitle(context, 'This Week'),
              const SizedBox(height: 12),
              _buildWeekStats(
                context,
                clientsAsync,
                sessionCountsAsync,
                revenueAsync,
                timeSpentAsync,
              ),
              const SizedBox(height: 24),

              _sectionTitle(context, 'My Clients'),
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
          data: (p) => p?.fullName.split(' ').first ?? 'Coach',
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
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: FitnessColors.gray,
                  ),
            ),
            Text(
              'Coach $name',
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
          ),
          child: Stack(
            clipBehavior: Clip.none,
            children: [
              const Icon(Icons.notifications_outlined, color: FitnessColors.gray, size: 24),
              Positioned(
                right: 0,
                top: 0,
                child: Container(
                  width: 8,
                  height: 8,
                  decoration: const BoxDecoration(
                    color: FitnessColors.secondaryColor1,
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

  Widget _sectionTitle(BuildContext context, String title) {
    return Text(
      title,
      style: Theme.of(context).textTheme.titleLarge?.copyWith(
            fontWeight: FontWeight.bold,
            color: FitnessColors.white,
          ),
    );
  }

  Widget _buildTodaySchedule(
    BuildContext context,
    AsyncValue<List<Map<String, dynamic>>> scheduleAsync,
  ) {
    return scheduleAsync.when(
      data: (sessions) {
        if (sessions.isEmpty) {
          return _card(
            context,
            padding: const EdgeInsets.all(28),
            child: Center(
              child: Text(
                'No sessions today',
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: FitnessColors.gray,
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
            return Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: _card(
                context,
                padding: const EdgeInsets.all(16),
                child: Row(
                  children: [
                    Container(
                      width: 4,
                      height: 48,
                      decoration: BoxDecoration(
                        gradient: FitnessColors.primaryGradient,
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
                            style: Theme.of(context).textTheme.titleMedium?.copyWith(
                                  fontWeight: FontWeight.w600,
                                  color: FitnessColors.white,
                                ),
                          ),
                          Text(
                            '$time • ${type.toString().replaceAll('_', ' ')}',
                            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                  color: FitnessColors.gray,
                                ),
                          ),
                        ],
                      ),
                    ),
                    Icon(Icons.chevron_right, color: FitnessColors.gray, size: 22),
                  ],
                ),
              ),
            );
          }).toList(),
        );
      },
      loading: () => _card(
        context,
        padding: const EdgeInsets.all(36),
        child: Center(
          child: CircularProgressIndicator(
            color: FitnessColors.primaryColor1,
            strokeWidth: 2,
          ),
        ),
      ),
      error: (_, __) => _card(
        context,
        padding: const EdgeInsets.all(24),
        child: Center(child: Text('Failed to load', style: TextStyle(color: FitnessColors.gray))),
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
    final sessionCount = sessionCountsAsync.valueOrNull?.values.fold<int>(0, (a, b) => a + b) ?? 0;
    final revenue = revenueAsync.valueOrNull ?? 0;
    final minutes = timeSpentAsync.valueOrNull ?? 0;
    final hours = (minutes / 60).toStringAsFixed(1);

    return Column(
      children: [
        Row(
          children: [
            Expanded(child: _statCard(context, Icons.event, '$sessionCount', 'Sessions')),
            const SizedBox(width: 12),
            Expanded(child: _statCard(context, Icons.people, '$clientCount', 'Clients')),
          ],
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(child: _statCard(context, Icons.timer, '${hours}h', 'Time Spent')),
            const SizedBox(width: 12),
            Expanded(child: _statCard(context, Icons.attach_money, '\$${revenue.toStringAsFixed(0)}', 'Revenue')),
          ],
        ),
      ],
    );
  }

  Widget _statCard(BuildContext context, IconData icon, String value, String label) {
    return _card(
      context,
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              gradient: FitnessColors.primaryGradient,
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(icon, color: FitnessColors.white, size: 20),
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
                  color: FitnessColors.gray,
                  fontSize: 11,
                ),
          ),
        ],
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
          return _card(
            context,
            padding: const EdgeInsets.all(24),
            child: Center(
              child: Text(
                'No clients assigned yet',
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: FitnessColors.gray,
                    ),
              ),
            ),
          );
        }
        return Column(
          children: clients.take(5).map((client) {
            final cid = client['user_id']?.toString() ?? '';
            final sessions = counts[cid] ?? 0;
            return Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: _card(
                context,
                padding: const EdgeInsets.all(16),
                child: Row(
                  children: [
                    CircleAvatar(
                      radius: 22,
                      backgroundColor: FitnessColors.primaryColor1.withOpacity(0.2),
                      child: Text(
                        _getInitials(client['full_name'] ?? '?'),
                        style: const TextStyle(
                          color: FitnessColors.green,
                          fontWeight: FontWeight.bold,
                          fontSize: 14,
                        ),
                      ),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            client['full_name'] ?? 'Client',
                            style: Theme.of(context).textTheme.titleSmall?.copyWith(
                                  fontWeight: FontWeight.w600,
                                  color: FitnessColors.white,
                                ),
                          ),
                          Text(
                            '${_goalLabel(client['fitness_goal'])} • $sessions sessions',
                            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                  color: FitnessColors.gray,
                                ),
                          ),
                        ],
                      ),
                    ),
                    Icon(Icons.chevron_right, color: FitnessColors.gray, size: 22),
                  ],
                ),
              ),
            );
          }).toList(),
        );
      },
      loading: () => _card(
        context,
        padding: const EdgeInsets.all(36),
        child: Center(
          child: CircularProgressIndicator(color: FitnessColors.primaryColor1, strokeWidth: 2),
        ),
      ),
      error: (_, __) => _card(
        context,
        padding: const EdgeInsets.all(24),
        child: Center(child: Text('Failed to load', style: TextStyle(color: FitnessColors.gray))),
      ),
    );
  }

  Widget _card(BuildContext context, {required EdgeInsets padding, required Widget child}) {
    return Container(
      padding: padding,
      decoration: BoxDecoration(
        color: FitnessColors.blackCard,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: FitnessColors.green.withOpacity(0.3)),
        boxShadow: [
          BoxShadow(
            color: FitnessColors.green.withOpacity(0.1),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: child,
    );
  }

  String _getInitials(String name) {
    final names = name.split(' ');
    if (names.length >= 2) return '${names.first[0]}${names.last[0]}'.toUpperCase();
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
