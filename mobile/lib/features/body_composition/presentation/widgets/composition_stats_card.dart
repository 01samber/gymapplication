import 'package:flutter/material.dart';
import '../../models/body_composition_model.dart';

class CompositionStatsCard extends StatelessWidget {
  final BodyCompositionModel composition;

  const CompositionStatsCard({
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
            Colors.blueGrey[900]!,
            Colors.blueGrey[800]!,
          ],
        ),
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.3),
            blurRadius: 10,
            offset: const Offset(0, 4),
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
                'Body Composition',
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
              ),
              _buildBadge(
                composition.getBmiCategory(),
                _getBmiColor(composition.bmi),
              ),
            ],
          ),
          const SizedBox(height: 16),

          // Main Stats Row
          Row(
            children: [
              Expanded(
                child: _buildStatItem(
                  context,
                  'Weight',
                  '${composition.weightKg?.toStringAsFixed(1) ?? '-'} kg',
                  Icons.monitor_weight_outlined,
                  Colors.blue,
                ),
              ),
              Expanded(
                child: _buildStatItem(
                  context,
                  'BMI',
                  composition.bmi?.toStringAsFixed(1) ?? '-',
                  Icons.analytics_outlined,
                  _getBmiColor(composition.bmi),
                ),
              ),
              Expanded(
                child: _buildStatItem(
                  context,
                  'Body Fat',
                  '${composition.percentBodyFat?.toStringAsFixed(1) ?? '-'}%',
                  Icons.pie_chart_outline,
                  Colors.orange,
                ),
              ),
            ],
          ),

          const SizedBox(height: 16),
          const Divider(color: Colors.white24),
          const SizedBox(height: 12),

          // Body Composition Analysis
          Text(
            'Body Composition Analysis',
            style: Theme.of(context).textTheme.titleSmall?.copyWith(
                  color: Colors.white70,
                ),
          ),
          const SizedBox(height: 12),

          _buildCompositionBar(
            context,
            'Total Body Water',
            composition.totalBodyWaterL ?? 0,
            50,
            'L',
            Colors.cyan,
          ),
          const SizedBox(height: 8),
          _buildCompositionBar(
            context,
            'Protein',
            composition.proteinKg ?? 0,
            20,
            'kg',
            Colors.purple,
          ),
          const SizedBox(height: 8),
          _buildCompositionBar(
            context,
            'Minerals',
            composition.mineralsKg ?? 0,
            5,
            'kg',
            Colors.amber,
          ),
          const SizedBox(height: 8),
          _buildCompositionBar(
            context,
            'Body Fat Mass',
            composition.bodyFatMassKg ?? 0,
            40,
            'kg',
            Colors.red[300]!,
          ),

          const SizedBox(height: 16),
          const Divider(color: Colors.white24),
          const SizedBox(height: 12),

          // Muscle-Fat Analysis
          Text(
            'Muscle-Fat Analysis',
            style: Theme.of(context).textTheme.titleSmall?.copyWith(
                  color: Colors.white70,
                ),
          ),
          const SizedBox(height: 12),

          Row(
            children: [
              Expanded(
                child: _buildCompactStat(
                  'Skeletal Muscle',
                  '${composition.skeletalMuscleMassKg?.toStringAsFixed(1) ?? '-'} kg',
                  Colors.green,
                ),
              ),
              Expanded(
                child: _buildCompactStat(
                  'Fat Free Mass',
                  '${composition.fatFreeMassKg?.toStringAsFixed(1) ?? '-'} kg',
                  Colors.teal,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildStatItem(
    BuildContext context,
    String label,
    String value,
    IconData icon,
    Color color,
  ) {
    return Column(
      children: [
        Container(
          padding: const EdgeInsets.all(10),
          decoration: BoxDecoration(
            color: color.withOpacity(0.2),
            shape: BoxShape.circle,
          ),
          child: Icon(icon, color: color, size: 24),
        ),
        const SizedBox(height: 8),
        Text(
          value,
          style: Theme.of(context).textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.bold,
                color: Colors.white,
              ),
        ),
        Text(
          label,
          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: Colors.white60,
              ),
        ),
      ],
    );
  }

  Widget _buildCompositionBar(
    BuildContext context,
    String label,
    double value,
    double maxValue,
    String unit,
    Color color,
  ) {
    final percentage = (value / maxValue).clamp(0.0, 1.0);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              label,
              style: const TextStyle(color: Colors.white70, fontSize: 12),
            ),
            Text(
              '${value.toStringAsFixed(1)} $unit',
              style: TextStyle(
                color: color,
                fontWeight: FontWeight.bold,
                fontSize: 12,
              ),
            ),
          ],
        ),
        const SizedBox(height: 4),
        Container(
          height: 8,
          decoration: BoxDecoration(
            color: Colors.white12,
            borderRadius: BorderRadius.circular(4),
          ),
          child: FractionallySizedBox(
            alignment: Alignment.centerLeft,
            widthFactor: percentage,
            child: Container(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [color.withOpacity(0.7), color],
                ),
                borderRadius: BorderRadius.circular(4),
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildCompactStat(String label, String value, Color color) {
    return Container(
      padding: const EdgeInsets.all(12),
      margin: const EdgeInsets.symmetric(horizontal: 4),
      decoration: BoxDecoration(
        color: color.withOpacity(0.15),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: color.withOpacity(0.3)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: TextStyle(
              color: color.withOpacity(0.8),
              fontSize: 11,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            value,
            style: TextStyle(
              color: color,
              fontWeight: FontWeight.bold,
              fontSize: 16,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBadge(String label, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: color.withOpacity(0.2),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withOpacity(0.5)),
      ),
      child: Text(
        label,
        style: TextStyle(
          color: color,
          fontWeight: FontWeight.bold,
          fontSize: 12,
        ),
      ),
    );
  }

  Color _getBmiColor(double? bmi) {
    if (bmi == null) return Colors.grey;
    if (bmi < 18.5) return Colors.blue;
    if (bmi < 25) return Colors.green;
    if (bmi < 30) return Colors.orange;
    return Colors.red;
  }
}
