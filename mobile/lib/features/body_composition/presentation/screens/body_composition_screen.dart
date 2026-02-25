import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../providers/body_composition_provider.dart';
import '../widgets/body_visualization.dart';
import '../widgets/composition_stats_card.dart';
import '../widgets/metabolism_card.dart';
import '../widgets/weight_control_card.dart';
import '../widgets/segmental_analysis_card.dart';

class BodyCompositionScreen extends ConsumerStatefulWidget {
  const BodyCompositionScreen({super.key});

  @override
  ConsumerState<BodyCompositionScreen> createState() =>
      _BodyCompositionScreenState();
}

class _BodyCompositionScreenState extends ConsumerState<BodyCompositionScreen> {
  int _selectedHistoryIndex = 0;

  @override
  Widget build(BuildContext context) {
    final historyAsync = ref.watch(bodyCompositionNotifierProvider);

    return Scaffold(
      backgroundColor: const Color(0xFF0D1117),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        title: const Text(
          'Body Composition',
          style: TextStyle(
            fontWeight: FontWeight.bold,
            color: Colors.white,
          ),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh, color: Colors.white),
            onPressed: () {
              ref.read(bodyCompositionNotifierProvider.notifier).refresh();
            },
          ),
          IconButton(
            icon: const Icon(Icons.history, color: Colors.white),
            onPressed: () => _showHistorySheet(context),
          ),
        ],
      ),
      body: historyAsync.when(
        loading: () => const Center(
          child: CircularProgressIndicator(color: Colors.teal),
        ),
        error: (error, stack) => _buildErrorState(context, error.toString()),
        data: (history) {
          if (history.isEmpty) {
            return _buildEmptyState(context);
          }

          final composition = history[_selectedHistoryIndex];

          return RefreshIndicator(
            onRefresh: () async {
              await ref
                  .read(bodyCompositionNotifierProvider.notifier)
                  .refresh();
            },
            color: Colors.teal,
            backgroundColor: const Color(0xFF1A1F26),
            child: SingleChildScrollView(
              physics: const AlwaysScrollableScrollPhysics(),
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Date selector
                  _buildDateSelector(context, history),
                  const SizedBox(height: 20),

                  // Body Visualization
                  BodyVisualization(composition: composition),
                  const SizedBox(height: 20),

                  // Composition Stats
                  CompositionStatsCard(composition: composition),
                  const SizedBox(height: 16),

                  // Metabolism & Health
                  MetabolismCard(composition: composition),
                  const SizedBox(height: 16),

                  // Segmental Analysis
                  SegmentalAnalysisCard(composition: composition),
                  const SizedBox(height: 16),

                  // Weight Control
                  WeightControlCard(composition: composition),
                  const SizedBox(height: 32),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildDateSelector(BuildContext context, List history) {
    if (history.length <= 1) return const SizedBox.shrink();

    final composition = history[_selectedHistoryIndex];
    final date = composition.measurementDate;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: Colors.white10,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          IconButton(
            icon: const Icon(Icons.chevron_left, color: Colors.white),
            onPressed: _selectedHistoryIndex < history.length - 1
                ? () => setState(() => _selectedHistoryIndex++)
                : null,
          ),
          Column(
            children: [
              const Text(
                'Measurement Date',
                style: TextStyle(
                  color: Colors.white60,
                  fontSize: 12,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                '${date.day}/${date.month}/${date.year}',
                style: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.bold,
                  fontSize: 16,
                ),
              ),
            ],
          ),
          IconButton(
            icon: const Icon(Icons.chevron_right, color: Colors.white),
            onPressed: _selectedHistoryIndex > 0
                ? () => setState(() => _selectedHistoryIndex--)
                : null,
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: Colors.teal.withOpacity(0.1),
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.monitor_weight_outlined,
                size: 64,
                color: Colors.teal,
              ),
            ),
            const SizedBox(height: 24),
            const Text(
              'No Body Composition Data',
              style: TextStyle(
                color: Colors.white,
                fontSize: 20,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 12),
            const Text(
              'Your dietitian will add your body composition measurements after your assessment.',
              textAlign: TextAlign.center,
              style: TextStyle(
                color: Colors.white60,
                fontSize: 14,
              ),
            ),
            const SizedBox(height: 24),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white10,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Column(
                children: [
                  const Icon(
                    Icons.info_outline,
                    color: Colors.teal,
                  ),
                  const SizedBox(height: 8),
                  const Text(
                    'InBody Analysis includes:',
                    style: TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 8),
                  _buildInfoItem('Body fat percentage'),
                  _buildInfoItem('Muscle mass distribution'),
                  _buildInfoItem('Metabolic rate'),
                  _buildInfoItem('Hydration levels'),
                  _buildInfoItem('Segmental analysis'),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildInfoItem(String text) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 2),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.check, color: Colors.teal, size: 16),
          const SizedBox(width: 8),
          Text(
            text,
            style: const TextStyle(color: Colors.white70, fontSize: 12),
          ),
        ],
      ),
    );
  }

  Widget _buildErrorState(BuildContext context, String error) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(
              Icons.error_outline,
              size: 64,
              color: Colors.red,
            ),
            const SizedBox(height: 16),
            const Text(
              'Unable to Load Data',
              style: TextStyle(
                color: Colors.white,
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              error,
              textAlign: TextAlign.center,
              style: const TextStyle(color: Colors.white60),
            ),
            const SizedBox(height: 24),
            ElevatedButton.icon(
              onPressed: () {
                ref.read(bodyCompositionNotifierProvider.notifier).refresh();
              },
              icon: const Icon(Icons.refresh),
              label: const Text('Retry'),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.teal,
                foregroundColor: Colors.white,
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showHistorySheet(BuildContext context) {
    final historyAsync = ref.read(bodyCompositionNotifierProvider);

    historyAsync.whenData((history) {
      showModalBottomSheet(
        context: context,
        backgroundColor: const Color(0xFF1A1F26),
        shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
        ),
        builder: (context) {
          return Container(
            padding: const EdgeInsets.all(20),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Measurement History',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 16),
                if (history.isEmpty)
                  const Center(
                    child: Padding(
                      padding: EdgeInsets.all(20),
                      child: Text(
                        'No measurements yet',
                        style: TextStyle(color: Colors.white60),
                      ),
                    ),
                  )
                else
                  SizedBox(
                    height: 300,
                    child: ListView.builder(
                      itemCount: history.length,
                      itemBuilder: (context, index) {
                        final comp = history[index];
                        final date = comp.measurementDate;
                        final isSelected = index == _selectedHistoryIndex;

                        return ListTile(
                          leading: Container(
                            padding: const EdgeInsets.all(10),
                            decoration: BoxDecoration(
                              color: isSelected
                                  ? Colors.teal.withOpacity(0.2)
                                  : Colors.white10,
                              shape: BoxShape.circle,
                            ),
                            child: Icon(
                              Icons.monitor_weight,
                              color: isSelected ? Colors.teal : Colors.white60,
                            ),
                          ),
                          title: Text(
                            '${date.day}/${date.month}/${date.year}',
                            style: TextStyle(
                              color: isSelected ? Colors.teal : Colors.white,
                              fontWeight: isSelected
                                  ? FontWeight.bold
                                  : FontWeight.normal,
                            ),
                          ),
                          subtitle: Text(
                            'Weight: ${comp.weightKg?.toStringAsFixed(1) ?? '-'} kg • BMI: ${comp.bmi?.toStringAsFixed(1) ?? '-'}',
                            style: const TextStyle(color: Colors.white60),
                          ),
                          trailing: isSelected
                              ? const Icon(Icons.check_circle,
                                  color: Colors.teal)
                              : null,
                          onTap: () {
                            setState(() => _selectedHistoryIndex = index);
                            Navigator.pop(context);
                          },
                        );
                      },
                    ),
                  ),
              ],
            ),
          );
        },
      );
    });
  }
}
