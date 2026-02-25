import 'package:flutter/material.dart';
import '../../models/body_composition_model.dart';

class WeightControlCard extends StatelessWidget {
  final BodyCompositionModel composition;

  const WeightControlCard({
    super.key,
    required this.composition,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            Colors.teal[900]!,
            Colors.teal[700]!,
          ],
        ),
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.teal.withOpacity(0.3),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.track_changes, color: Colors.white, size: 24),
              const SizedBox(width: 8),
              Text(
                'Weight Control Recommendations',
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
              ),
            ],
          ),
          const SizedBox(height: 20),

          // Current vs Target
          Row(
            children: [
              Expanded(
                child: _buildWeightBox(
                  context,
                  'Current Weight',
                  composition.weightKg,
                  Colors.white,
                ),
              ),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 12),
                child: Icon(
                  Icons.arrow_forward,
                  color: Colors.teal[200],
                ),
              ),
              Expanded(
                child: _buildWeightBox(
                  context,
                  'Target Weight',
                  composition.targetWeightKg,
                  Colors.greenAccent,
                ),
              ),
            ],
          ),

          const SizedBox(height: 20),

          // Control Recommendations
          Text(
            'Adjustments Needed',
            style: Theme.of(context).textTheme.titleSmall?.copyWith(
                  color: Colors.white70,
                ),
          ),
          const SizedBox(height: 12),

          _buildControlItem(
            context,
            'Overall Weight',
            composition.weightControlKg,
            Icons.monitor_weight,
          ),
          const SizedBox(height: 10),
          _buildControlItem(
            context,
            'Body Fat',
            composition.fatControlKg,
            Icons.local_fire_department,
          ),
          const SizedBox(height: 10),
          _buildControlItem(
            context,
            'Muscle Mass',
            composition.muscleControlKg,
            Icons.fitness_center,
          ),

          if (_hasRecommendations()) ...[
            const SizedBox(height: 16),
            const Divider(color: Colors.white24),
            const SizedBox(height: 12),
            _buildSummary(context),
          ],
        ],
      ),
    );
  }

  Widget _buildWeightBox(
    BuildContext context,
    String label,
    double? weight,
    Color color,
  ) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white10,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        children: [
          Text(
            label,
            style: const TextStyle(
              color: Colors.white60,
              fontSize: 12,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            weight != null ? weight.toStringAsFixed(1) : '-',
            style: TextStyle(
              color: color,
              fontSize: 28,
              fontWeight: FontWeight.bold,
            ),
          ),
          Text(
            'kg',
            style: TextStyle(
              color: color.withOpacity(0.7),
              fontSize: 14,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildControlItem(
    BuildContext context,
    String label,
    double? value,
    IconData icon,
  ) {
    final isPositive = (value ?? 0) >= 0;
    final displayValue = value?.abs().toStringAsFixed(1) ?? '-';
    final action = isPositive ? 'Gain' : 'Lose';
    final color = _getControlColor(label, value);

    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white10,
        borderRadius: BorderRadius.circular(10),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: color.withOpacity(0.2),
              shape: BoxShape.circle,
            ),
            child: Icon(icon, color: color, size: 20),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: const TextStyle(
                    color: Colors.white70,
                    fontSize: 12,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  value != null ? '$action $displayValue kg' : 'No data',
                  style: TextStyle(
                    color: color,
                    fontWeight: FontWeight.bold,
                    fontSize: 14,
                  ),
                ),
              ],
            ),
          ),
          if (value != null)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: color.withOpacity(0.2),
                borderRadius: BorderRadius.circular(6),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(
                    isPositive ? Icons.arrow_upward : Icons.arrow_downward,
                    color: color,
                    size: 14,
                  ),
                  Text(
                    isPositive ? '+' : '-',
                    style: TextStyle(color: color, fontSize: 12),
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }

  Color _getControlColor(String label, double? value) {
    if (value == null) return Colors.grey;

    // For fat: negative (lose) is green, positive (gain) is red
    // For muscle: positive (gain) is green, negative (lose) is red
    // For weight: depends on overall need

    if (label == 'Body Fat') {
      if (value < 0) return Colors.green; // Need to lose fat
      if (value > 0) return Colors.orange; // Need to gain fat (rare)
      return Colors.green;
    }

    if (label == 'Muscle Mass') {
      if (value > 0) return Colors.green; // Need to gain muscle
      if (value < 0) return Colors.orange; // Need to lose muscle (rare)
      return Colors.green;
    }

    // Overall weight
    if (value.abs() < 2) return Colors.green;
    if (value.abs() < 5) return Colors.orange;
    return Colors.red;
  }

  bool _hasRecommendations() {
    return composition.weightControlKg != null ||
        composition.fatControlKg != null ||
        composition.muscleControlKg != null;
  }

  Widget _buildSummary(BuildContext context) {
    final messages = <String>[];

    if (composition.fatControlKg != null && composition.fatControlKg! < -2) {
      messages.add('Focus on cardio and caloric deficit to reduce body fat');
    }
    if (composition.muscleControlKg != null &&
        composition.muscleControlKg! > 2) {
      messages.add('Incorporate strength training to build muscle mass');
    }
    if (composition.weightControlKg != null &&
        composition.weightControlKg!.abs() < 2) {
      messages
          .add('Maintain your current routine - you\'re close to your target!');
    }

    if (messages.isEmpty) {
      messages.add('Continue with balanced exercise and nutrition');
    }

    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white10,
        borderRadius: BorderRadius.circular(10),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.tips_and_updates, color: Colors.yellow[600], size: 18),
              const SizedBox(width: 8),
              Text(
                'Recommendations',
                style: TextStyle(
                  color: Colors.yellow[600],
                  fontWeight: FontWeight.bold,
                  fontSize: 12,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          ...messages.map((msg) => Padding(
                padding: const EdgeInsets.only(bottom: 4),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('• ', style: TextStyle(color: Colors.white60)),
                    Expanded(
                      child: Text(
                        msg,
                        style: const TextStyle(
                            color: Colors.white70, fontSize: 12),
                      ),
                    ),
                  ],
                ),
              )),
        ],
      ),
    );
  }
}
