import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/theme/app_colors.dart';

/// Client bookings/schedule screen
class ClientBookingsScreen extends ConsumerStatefulWidget {
  const ClientBookingsScreen({super.key});

  @override
  ConsumerState<ClientBookingsScreen> createState() =>
      _ClientBookingsScreenState();
}

class _ClientBookingsScreenState extends ConsumerState<ClientBookingsScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('My Sessions'),
        bottom: TabBar(
          controller: _tabController,
          labelColor: AppColors.primary,
          unselectedLabelColor: AppColors.textSecondary,
          indicatorColor: AppColors.primary,
          tabs: const [
            Tab(text: 'Upcoming'),
            Tab(text: 'Past'),
          ],
        ),
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _showBookingBottomSheet(context),
        icon: const Icon(Icons.add),
        label: const Text('Book Session'),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _buildUpcomingList(),
          _buildPastList(),
        ],
      ),
    );
  }

  Widget _buildUpcomingList() {
    // Mock data - will be replaced with real data
    final upcomingSessions = [
      _SessionData(
        date: DateTime.now().add(const Duration(days: 1)),
        time: '10:00 AM',
        trainer: 'Coach Ahmad',
        type: 'Strength Training',
        status: 'confirmed',
      ),
      _SessionData(
        date: DateTime.now().add(const Duration(days: 3)),
        time: '2:00 PM',
        trainer: 'Coach Ahmad',
        type: 'Cardio',
        status: 'pending',
      ),
      _SessionData(
        date: DateTime.now().add(const Duration(days: 5)),
        time: '11:00 AM',
        trainer: 'Coach Ahmad',
        type: 'Full Body',
        status: 'confirmed',
      ),
    ];

    if (upcomingSessions.isEmpty) {
      return _buildEmptyState(
        icon: Icons.calendar_today,
        title: 'No Upcoming Sessions',
        subtitle: 'Book a session with your trainer',
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: upcomingSessions.length,
      itemBuilder: (context, index) {
        final session = upcomingSessions[index];
        return _buildSessionCard(session, isUpcoming: true);
      },
    );
  }

  Widget _buildPastList() {
    // Mock data
    final pastSessions = [
      _SessionData(
        date: DateTime.now().subtract(const Duration(days: 2)),
        time: '10:00 AM',
        trainer: 'Coach Ahmad',
        type: 'Strength Training',
        status: 'completed',
      ),
      _SessionData(
        date: DateTime.now().subtract(const Duration(days: 5)),
        time: '3:00 PM',
        trainer: 'Coach Ahmad',
        type: 'HIIT',
        status: 'completed',
      ),
    ];

    if (pastSessions.isEmpty) {
      return _buildEmptyState(
        icon: Icons.history,
        title: 'No Past Sessions',
        subtitle: 'Your completed sessions will appear here',
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: pastSessions.length,
      itemBuilder: (context, index) {
        final session = pastSessions[index];
        return _buildSessionCard(session, isUpcoming: false);
      },
    );
  }

  Widget _buildSessionCard(_SessionData session, {required bool isUpcoming}) {
    Color statusColor;
    String statusText;

    switch (session.status) {
      case 'confirmed':
        statusColor = AppColors.success;
        statusText = 'Confirmed';
        break;
      case 'pending':
        statusColor = AppColors.warning;
        statusText = 'Pending';
        break;
      case 'completed':
        statusColor = AppColors.secondary;
        statusText = 'Completed';
        break;
      case 'cancelled':
        statusColor = AppColors.error;
        statusText = 'Cancelled';
        break;
      default:
        statusColor = AppColors.textSecondary;
        statusText = session.status;
    }

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: InkWell(
        onTap: () {
          // Navigate to booking detail
        },
        borderRadius: BorderRadius.circular(16),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            children: [
              Row(
                children: [
                  // Date badge
                  Container(
                    width: 50,
                    padding: const EdgeInsets.symmetric(vertical: 8),
                    decoration: BoxDecoration(
                      color: isUpcoming
                          ? AppColors.primary.withOpacity(0.1)
                          : AppColors.surfaceVariant,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Column(
                      children: [
                        Text(
                          _getWeekday(session.date),
                          style:
                              Theme.of(context).textTheme.labelSmall?.copyWith(
                                    color: isUpcoming
                                        ? AppColors.primary
                                        : AppColors.textSecondary,
                                  ),
                        ),
                        Text(
                          session.date.day.toString(),
                          style:
                              Theme.of(context).textTheme.titleLarge?.copyWith(
                                    fontWeight: FontWeight.bold,
                                    color: isUpcoming
                                        ? AppColors.primary
                                        : AppColors.textSecondary,
                                  ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 16),
                  // Details
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          session.type,
                          style:
                              Theme.of(context).textTheme.titleMedium?.copyWith(
                                    fontWeight: FontWeight.w600,
                                  ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          '${session.time} • ${session.trainer}',
                          style:
                              Theme.of(context).textTheme.bodyMedium?.copyWith(
                                    color: AppColors.textSecondary,
                                  ),
                        ),
                      ],
                    ),
                  ),
                  // Status badge
                  Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      color: statusColor.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text(
                      statusText,
                      style: Theme.of(context).textTheme.labelSmall?.copyWith(
                            color: statusColor,
                            fontWeight: FontWeight.w600,
                          ),
                    ),
                  ),
                ],
              ),
              if (isUpcoming && session.status != 'cancelled') ...[
                const SizedBox(height: 12),
                const Divider(),
                const SizedBox(height: 8),
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton(
                        onPressed: () => _showCancelDialog(context),
                        style: OutlinedButton.styleFrom(
                          foregroundColor: AppColors.error,
                          side: const BorderSide(color: AppColors.error),
                        ),
                        child: const Text('Cancel'),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: ElevatedButton(
                        onPressed: () {
                          // Reschedule
                        },
                        child: const Text('Reschedule'),
                      ),
                    ),
                  ],
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildEmptyState({
    required IconData icon,
    required String title,
    required String subtitle,
  }) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(icon, size: 64, color: AppColors.textHint),
          const SizedBox(height: 16),
          Text(
            title,
            style: Theme.of(context).textTheme.titleLarge?.copyWith(
                  color: AppColors.textSecondary,
                ),
          ),
          const SizedBox(height: 8),
          Text(
            subtitle,
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: AppColors.textHint,
                ),
          ),
        ],
      ),
    );
  }

  String _getWeekday(DateTime date) {
    const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    return days[date.weekday % 7];
  }

  void _showBookingBottomSheet(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => DraggableScrollableSheet(
        initialChildSize: 0.7,
        minChildSize: 0.5,
        maxChildSize: 0.95,
        expand: false,
        builder: (context, scrollController) {
          return Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Center(
                  child: Container(
                    width: 40,
                    height: 4,
                    decoration: BoxDecoration(
                      color: AppColors.divider,
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                ),
                const SizedBox(height: 20),
                Text(
                  'Book a Session',
                  style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                ),
                const SizedBox(height: 8),
                Text(
                  'Select a date and time for your next PT session',
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: AppColors.textSecondary,
                      ),
                ),
                const SizedBox(height: 24),
                // TODO: Add calendar picker and time slots
                const Expanded(
                  child: Center(
                    child: Text(
                      'Calendar and time slots will appear here',
                      style: TextStyle(color: AppColors.textHint),
                    ),
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  void _showCancelDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Cancel Session?'),
        content: const Text(
          'Are you sure you want to cancel this session? '
          'Cancellations within 24 hours may affect your subscription.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Keep Session'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              // Cancel session logic
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.error,
            ),
            child: const Text('Cancel Session'),
          ),
        ],
      ),
    );
  }
}

class _SessionData {
  final DateTime date;
  final String time;
  final String trainer;
  final String type;
  final String status;

  _SessionData({
    required this.date,
    required this.time,
    required this.trainer,
    required this.type,
    required this.status,
  });
}
