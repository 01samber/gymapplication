import 'package:flutter/material.dart';
import '../../models/body_composition_model.dart';

class SegmentalAnalysisCard extends StatelessWidget {
  final BodyCompositionModel composition;

  const SegmentalAnalysisCard({
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
            Colors.indigo[900]!,
            Colors.indigo[700]!,
          ],
        ),
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.indigo.withOpacity(0.3),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Segmental Analysis',
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                ),
          ),
          const SizedBox(height: 8),
          Text(
            'Lean mass and fat distribution by body segment',
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: Colors.white60,
                ),
          ),
          const SizedBox(height: 20),

          // Lean Mass Section
          _buildSectionHeader(context, 'Lean Mass', Colors.blue),
          const SizedBox(height: 12),

          _buildSegmentRow(
            context,
            'Left Arm',
            composition.leftArmLeanKg,
            composition.leftArmLeanPercent,
            Colors.blue,
          ),
          _buildSegmentRow(
            context,
            'Right Arm',
            composition.rightArmLeanKg,
            composition.rightArmLeanPercent,
            Colors.blue,
          ),
          _buildSegmentRow(
            context,
            'Trunk',
            composition.trunkLeanKg,
            composition.trunkLeanPercent,
            Colors.blue,
          ),
          _buildSegmentRow(
            context,
            'Left Leg',
            composition.leftLegLeanKg,
            composition.leftLegLeanPercent,
            Colors.blue,
          ),
          _buildSegmentRow(
            context,
            'Right Leg',
            composition.rightLegLeanKg,
            composition.rightLegLeanPercent,
            Colors.blue,
          ),

          const SizedBox(height: 20),

          // Fat Mass Section
          _buildSectionHeader(context, 'Fat Mass', Colors.orange),
          const SizedBox(height: 12),

          _buildSegmentRow(
            context,
            'Left Arm',
            composition.leftArmFatKg,
            composition.leftArmFatPercent,
            Colors.orange,
          ),
          _buildSegmentRow(
            context,
            'Right Arm',
            composition.rightArmFatKg,
            composition.rightArmFatPercent,
            Colors.orange,
          ),
          _buildSegmentRow(
            context,
            'Trunk',
            composition.trunkFatKg,
            composition.trunkFatPercent,
            Colors.orange,
          ),
          _buildSegmentRow(
            context,
            'Left Leg',
            composition.leftLegFatKg,
            composition.leftLegFatPercent,
            Colors.orange,
          ),
          _buildSegmentRow(
            context,
            'Right Leg',
            composition.rightLegFatKg,
            composition.rightLegFatPercent,
            Colors.orange,
          ),

          const SizedBox(height: 16),

          // Balance indicator
          _buildBalanceIndicator(context),
        ],
      ),
    );
  }

  Widget _buildSectionHeader(BuildContext context, String title, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: color.withOpacity(0.2),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            title == 'Lean Mass'
                ? Icons.fitness_center
                : Icons.local_fire_department,
            color: color,
            size: 16,
          ),
          const SizedBox(width: 6),
          Text(
            title,
            style: TextStyle(
              color: color,
              fontWeight: FontWeight.bold,
              fontSize: 14,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSegmentRow(
    BuildContext context,
    String segment,
    double? massKg,
    double? percent,
    Color color,
  ) {
    final barPercent = (percent ?? 0) / 100;

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        children: [
          SizedBox(
            width: 80,
            child: Text(
              segment,
              style: const TextStyle(
                color: Colors.white70,
                fontSize: 12,
              ),
            ),
          ),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  height: 12,
                  decoration: BoxDecoration(
                    color: Colors.white10,
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: FractionallySizedBox(
                    alignment: Alignment.centerLeft,
                    widthFactor: barPercent.clamp(0.0, 1.0),
                    child: Container(
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          colors: [color.withOpacity(0.6), color],
                        ),
                        borderRadius: BorderRadius.circular(6),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 10),
          SizedBox(
            width: 55,
            child: Text(
              massKg != null ? '${massKg.toStringAsFixed(1)} kg' : '-',
              style: TextStyle(
                color: color,
                fontWeight: FontWeight.bold,
                fontSize: 11,
              ),
              textAlign: TextAlign.right,
            ),
          ),
          const SizedBox(width: 8),
          SizedBox(
            width: 40,
            child: Text(
              percent != null ? '${percent.toStringAsFixed(0)}%' : '-',
              style: const TextStyle(
                color: Colors.white60,
                fontSize: 11,
              ),
              textAlign: TextAlign.right,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBalanceIndicator(BuildContext context) {
    // Calculate left vs right balance
    final leftLean =
        (composition.leftArmLeanKg ?? 0) + (composition.leftLegLeanKg ?? 0);
    final rightLean =
        (composition.rightArmLeanKg ?? 0) + (composition.rightLegLeanKg ?? 0);

    final leftFat =
        (composition.leftArmFatKg ?? 0) + (composition.leftLegFatKg ?? 0);
    final rightFat =
        (composition.rightArmFatKg ?? 0) + (composition.rightLegFatKg ?? 0);

    final leanDiff =
        ((rightLean - leftLean) / ((leftLean + rightLean) / 2) * 100).abs();
    final fatDiff =
        ((rightFat - leftFat) / ((leftFat + rightFat) / 2) * 100).abs();

    final isBalanced = leanDiff < 5 && fatDiff < 5;

    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: (isBalanced ? Colors.green : Colors.orange).withOpacity(0.15),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(
          color: (isBalanced ? Colors.green : Colors.orange).withOpacity(0.3),
        ),
      ),
      child: Row(
        children: [
          Icon(
            isBalanced ? Icons.check_circle : Icons.info,
            color: isBalanced ? Colors.green : Colors.orange,
            size: 20,
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  isBalanced ? 'Good Balance' : 'Slight Imbalance Detected',
                  style: TextStyle(
                    color: isBalanced ? Colors.green[300] : Colors.orange[300],
                    fontWeight: FontWeight.bold,
                    fontSize: 12,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  isBalanced
                      ? 'Your left and right side composition is well balanced'
                      : 'Consider unilateral exercises to balance both sides',
                  style: const TextStyle(
                    color: Colors.white60,
                    fontSize: 11,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
