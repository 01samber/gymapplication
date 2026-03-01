import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/theme/fitness_theme.dart';
import '../../../auth/providers/subscription_provider.dart';

/// Subscription days card - Pixel True fitness style
class SubscriptionDaysCard extends ConsumerWidget {
  const SubscriptionDaysCard({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final subAsync = ref.watch(clientSubscriptionDataProvider);

    return subAsync.when(
      data: (data) {
        if (data == null || !data.isActive) return const SizedBox.shrink();
        final color = data.isExpiringSoon ? FitnessColors.secondaryColor1 : FitnessColors.primaryColor1;
        return Container(
          padding: const EdgeInsets.all(18),
          decoration: BoxDecoration(
            color: color.withOpacity(0.12),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: color.withOpacity(0.3)),
          ),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: color.withOpacity(0.2),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(Icons.credit_card, color: color, size: 24),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      '${data.planLabel} • Active',
                      style: Theme.of(context).textTheme.titleSmall?.copyWith(
                            fontWeight: FontWeight.w600,
                            color: FitnessColors.white,
                          ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      '${data.daysRemaining} day${data.daysRemaining == 1 ? '' : 's'} left',
                      style: Theme.of(context).textTheme.titleLarge?.copyWith(
                            fontWeight: FontWeight.bold,
                            color: color,
                          ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        );
      },
      loading: () => const SizedBox.shrink(),
      error: (_, __) => const SizedBox.shrink(),
    );
  }
}
