import 'package:flutter/material.dart';

import '../../../../core/theme/fitness_theme.dart';

/// Session card - Pixel True fitness style
class UpcomingSessionCard extends StatelessWidget {
  final String trainerName;
  final String sessionType;
  final String dateTime;
  final String duration;
  final VoidCallback? onTap;
  final VoidCallback? onCancel;

  const UpcomingSessionCard({
    super.key,
    required this.trainerName,
    required this.sessionType,
    required this.dateTime,
    required this.duration,
    this.onTap,
    this.onCancel,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Container(
          padding: const EdgeInsets.all(18),
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
          child: Row(
            children: [
              Container(
                width: 56,
                height: 72,
                decoration: BoxDecoration(
                  gradient: FitnessColors.primaryGradient,
                  borderRadius: BorderRadius.circular(14),
                ),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(Icons.calendar_today, color: FitnessColors.white, size: 22),
                    const SizedBox(height: 6),
                    Text(
                      _getDayAbbr(),
                      style: Theme.of(context).textTheme.labelSmall?.copyWith(
                            color: FitnessColors.white,
                            fontWeight: FontWeight.bold,
                          ),
                    ),
                    Text(
                      '${DateTime.now().day + 1}',
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                            color: FitnessColors.white,
                            fontWeight: FontWeight.bold,
                          ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 18),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      sessionType,
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                            fontWeight: FontWeight.w600,
                            color: FitnessColors.white,
                          ),
                    ),
                    const SizedBox(height: 6),
                    Row(
                      children: [
                        Icon(Icons.person_outline, size: 14, color: FitnessColors.gray),
                        const SizedBox(width: 4),
                        Text(
                          trainerName,
                          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                color: FitnessColors.gray,
                              ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 2),
                    Row(
                      children: [
                        Icon(Icons.access_time, size: 14, color: FitnessColors.gray),
                        const SizedBox(width: 4),
                        Text(
                          '$dateTime • $duration',
                          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                color: FitnessColors.gray,
                              ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              Icon(Icons.chevron_right, color: FitnessColors.gray, size: 24),
            ],
          ),
        ),
      ),
    );
  }

  String _getDayAbbr() {
    final d = DateTime.now().add(const Duration(days: 1));
    const days = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
    return days[d.weekday - 1];
  }
}
