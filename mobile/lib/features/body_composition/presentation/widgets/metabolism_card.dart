import 'package:flutter/material.dart';
import '../../models/body_composition_model.dart';

class MetabolismCard extends StatelessWidget {
  final BodyCompositionModel composition;

  const MetabolismCard({
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
            Colors.deepPurple[900]!,
            Colors.deepPurple[700]!,
          ],
        ),
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.deepPurple.withOpacity(0.3),
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
              const Icon(Icons.local_fire_department,
                  color: Colors.orange, size: 24),
              const SizedBox(width: 8),
              Text(
                'Metabolism & Health',
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
              ),
            ],
          ),
          const SizedBox(height: 20),

          // BMR Display
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white10,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Basal Metabolic Rate',
                        style: TextStyle(color: Colors.white70, fontSize: 12),
                      ),
                      const SizedBox(height: 4),
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          Text(
                            '${composition.basalMetabolicRate ?? '-'}',
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 32,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const Padding(
                            padding: EdgeInsets.only(bottom: 6, left: 4),
                            child: Text(
                              'kcal/day',
                              style: TextStyle(
                                  color: Colors.white60, fontSize: 14),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.orange.withOpacity(0.2),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(
                    Icons.whatshot,
                    color: Colors.orange,
                    size: 30,
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: 16),

          // Health Indicators Grid
          Row(
            children: [
              Expanded(
                child: _buildHealthIndicator(
                  context,
                  'Metabolic Age',
                  '${composition.metabolicAge ?? '-'}',
                  'years',
                  _getMetabolicAgeColor(
                      composition.metabolicAge, composition.age),
                  Icons.cake_outlined,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _buildHealthIndicator(
                  context,
                  'Visceral Fat',
                  '${composition.visceralFatLevel ?? '-'}',
                  'level',
                  _getVisceralFatColor(composition.visceralFatLevel),
                  Icons.favorite_border,
                ),
              ),
            ],
          ),

          const SizedBox(height: 12),

          Row(
            children: [
              Expanded(
                child: _buildHealthIndicator(
                  context,
                  'Waist-Hip Ratio',
                  composition.waistHipRatio?.toStringAsFixed(2) ?? '-',
                  '',
                  _getWaistHipColor(
                      composition.waistHipRatio, composition.gender),
                  Icons.straighten,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _buildHealthIndicator(
                  context,
                  'Height',
                  composition.heightCm?.toStringAsFixed(0) ?? '-',
                  'cm',
                  Colors.blue,
                  Icons.height,
                ),
              ),
            ],
          ),

          if (composition.metabolicAge != null && composition.age != null) ...[
            const SizedBox(height: 16),
            _buildMetabolicAgeComparison(context),
          ],
        ],
      ),
    );
  }

  Widget _buildHealthIndicator(
    BuildContext context,
    String label,
    String value,
    String unit,
    Color color,
    IconData icon,
  ) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white10,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, color: color, size: 18),
              const SizedBox(width: 6),
              Expanded(
                child: Text(
                  label,
                  style: const TextStyle(
                    color: Colors.white60,
                    fontSize: 11,
                  ),
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Row(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                value,
                style: TextStyle(
                  color: color,
                  fontSize: 22,
                  fontWeight: FontWeight.bold,
                ),
              ),
              if (unit.isNotEmpty)
                Padding(
                  padding: const EdgeInsets.only(bottom: 2, left: 2),
                  child: Text(
                    unit,
                    style: const TextStyle(
                      color: Colors.white60,
                      fontSize: 12,
                    ),
                  ),
                ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildMetabolicAgeComparison(BuildContext context) {
    final diff = (composition.metabolicAge ?? 0) - (composition.age ?? 0);
    final isGood = diff <= 0;

    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: (isGood ? Colors.green : Colors.red).withOpacity(0.15),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(
          color: (isGood ? Colors.green : Colors.red).withOpacity(0.3),
        ),
      ),
      child: Row(
        children: [
          Icon(
            isGood ? Icons.thumb_up : Icons.warning,
            color: isGood ? Colors.green : Colors.red,
            size: 20,
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              isGood
                  ? 'Your metabolic age is ${diff.abs()} years younger than your actual age!'
                  : 'Your metabolic age is $diff years older than your actual age.',
              style: TextStyle(
                color: isGood ? Colors.green[300] : Colors.red[300],
                fontSize: 12,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Color _getMetabolicAgeColor(int? metabolicAge, int? actualAge) {
    if (metabolicAge == null || actualAge == null) return Colors.grey;
    final diff = metabolicAge - actualAge;
    if (diff <= -5) return Colors.green;
    if (diff <= 0) return Colors.lightGreen;
    if (diff <= 5) return Colors.orange;
    return Colors.red;
  }

  Color _getVisceralFatColor(int? level) {
    if (level == null) return Colors.grey;
    if (level <= 9) return Colors.green;
    if (level <= 14) return Colors.orange;
    return Colors.red;
  }

  Color _getWaistHipColor(double? ratio, String? gender) {
    if (ratio == null) return Colors.grey;
    if (gender?.toLowerCase() == 'male') {
      if (ratio <= 0.90) return Colors.green;
      if (ratio <= 0.99) return Colors.orange;
      return Colors.red;
    } else {
      if (ratio <= 0.80) return Colors.green;
      if (ratio <= 0.84) return Colors.orange;
      return Colors.red;
    }
  }
}
