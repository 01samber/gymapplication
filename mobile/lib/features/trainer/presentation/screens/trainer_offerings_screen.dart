import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/theme/app_colors.dart';
import '../../providers/trainer_provider.dart';

/// Trainer offerings (session types/prices) for bookings
class TrainerOfferingsScreen extends ConsumerStatefulWidget {
  const TrainerOfferingsScreen({super.key});

  @override
  ConsumerState<TrainerOfferingsScreen> createState() =>
      _TrainerOfferingsScreenState();
}

class _TrainerOfferingsScreenState extends ConsumerState<TrainerOfferingsScreen> {
  bool _showAddSheet = false;

  @override
  Widget build(BuildContext context) {
    final offeringsAsync = ref.watch(trainerOfferingsProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('My Offerings'),
        actions: [
          IconButton(
            icon: const Icon(Icons.add),
            onPressed: () => _showAddOfferingSheet(context),
          ),
        ],
      ),
      body: offeringsAsync.when(
        data: (offerings) {
          if (offerings.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.sell_outlined, size: 64, color: AppColors.textHint),
                  const SizedBox(height: 16),
                  Text(
                    'No offerings yet',
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          color: AppColors.textSecondary,
                        ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Add session types clients can book',
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: AppColors.textHint,
                        ),
                  ),
                  const SizedBox(height: 24),
                  FilledButton.icon(
                    onPressed: () => _showAddOfferingSheet(context),
                    icon: const Icon(Icons.add),
                    label: const Text('Add Offering'),
                  ),
                ],
              ),
            );
          }
          return ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: offerings.length,
            itemBuilder: (context, index) {
              final o = offerings[index];
              return Container(
                margin: const EdgeInsets.only(bottom: 12),
                child: _glassCard(
                context,
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Row(
                    children: [
                      Container(
                        width: 48,
                        height: 48,
                        decoration: BoxDecoration(
                          color: AppColors.primary.withOpacity(0.2),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Icon(Icons.fitness_center, color: AppColors.primary),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              o['name'] ?? 'Offering',
                              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                                    fontWeight: FontWeight.w600,
                                  ),
                            ),
                            if (o['description'] != null && (o['description'] as String).isNotEmpty)
                              Text(
                                o['description'] as String,
                                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                      color: AppColors.textSecondary,
                                    ),
                                maxLines: 2,
                                overflow: TextOverflow.ellipsis,
                              ),
                            const SizedBox(height: 4),
                            Text(
                              '${o['duration_minutes'] ?? 60} min • \$${_price(o['price'])}',
                              style: Theme.of(context).textTheme.labelMedium?.copyWith(
                                    color: AppColors.primary,
                                  ),
                            ),
                          ],
                        ),
                      ),
                      Icon(Icons.chevron_right, color: AppColors.textHint),
                    ],
                  ),
                ),
              ),
            );
            },
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Error: $e')),
      ),
    );
  }

  String _price(dynamic p) {
    if (p == null) return '0';
    if (p is num) return p.toStringAsFixed(0);
    return p.toString();
  }

  void _showAddOfferingSheet(BuildContext context) {
    final nameController = TextEditingController();
    final descController = TextEditingController();
    final priceController = TextEditingController(text: '50');
    final durationController = TextEditingController(text: '60');

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Container(
        padding: EdgeInsets.only(
          bottom: MediaQuery.of(ctx).viewInsets.bottom,
        ),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
        ),
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text(
                'Add Offering',
                style: Theme.of(ctx).textTheme.titleLarge?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
              ),
              const SizedBox(height: 16),
              TextField(
                controller: nameController,
                decoration: const InputDecoration(
                  labelText: 'Name',
                  hintText: 'e.g. 1hr PT Session',
                ),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: descController,
                decoration: const InputDecoration(
                  labelText: 'Description (optional)',
                  hintText: 'Brief description',
                ),
                maxLines: 2,
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    flex: 2,
                    child: TextField(
                      controller: priceController,
                      keyboardType: TextInputType.number,
                      decoration: const InputDecoration(
                        labelText: 'Price (\$)',
                      ),
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: TextField(
                      controller: durationController,
                      keyboardType: TextInputType.number,
                      decoration: const InputDecoration(
                        labelText: 'Mins',
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 24),
              FilledButton(
                onPressed: () async {
                  final name = nameController.text.trim();
                  final price = double.tryParse(priceController.text) ?? 50;
                  final duration = int.tryParse(durationController.text) ?? 60;
                  if (name.isEmpty) return;
                  try {
                    await ref.read(trainerServiceProvider).createOffering(
                          name: name,
                          description: descController.text.trim().isEmpty
                              ? null
                              : descController.text.trim(),
                          durationMinutes: duration,
                          price: price,
                        );
                    if (context.mounted) {
                      Navigator.pop(ctx);
                      ref.invalidate(trainerOfferingsProvider);
                    }
                  } catch (e) {
                    if (context.mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(content: Text('Error: $e')),
                      );
                    }
                  }
                },
                child: const Text('Add'),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _glassCard(BuildContext context, {required Widget child}) {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.surface.withOpacity(0.5),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.cardBorder.withOpacity(0.5)),
      ),
      child: child,
    );
  }
}
