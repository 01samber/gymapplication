import 'package:flutter/material.dart';

import '../../../../core/theme/fitness_theme.dart';

/// Trainer card - Pixel True fitness style
class TrainerCard extends StatelessWidget {
  final String name;
  final String specialization;
  final double rating;
  final String? imageUrl;
  final VoidCallback? onTap;
  final VoidCallback? onMessage;

  const TrainerCard({
    super.key,
    required this.name,
    required this.specialization,
    required this.rating,
    this.imageUrl,
    this.onTap,
    this.onMessage,
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
            border: Border.all(color: FitnessColors.yellow.withOpacity(0.3)),
            boxShadow: [
              BoxShadow(
                color: FitnessColors.yellow.withOpacity(0.1),
                blurRadius: 8,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: Row(
            children: [
              CircleAvatar(
                radius: 28,
                backgroundColor: FitnessColors.primaryColor1.withOpacity(0.2),
                backgroundImage: imageUrl != null ? NetworkImage(imageUrl!) : null,
                child: imageUrl == null
                    ? Text(
                        _getInitials(name),
                        style: Theme.of(context).textTheme.titleLarge?.copyWith(
                              color: FitnessColors.green,
                              fontWeight: FontWeight.bold,
                            ),
                      )
                    : null,
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      name,
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                            fontWeight: FontWeight.w600,
                            color: FitnessColors.white,
                          ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      specialization,
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: FitnessColors.gray,
                          ),
                    ),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        Icon(Icons.star_rounded, size: 18, color: FitnessColors.yellow),
                        const SizedBox(width: 4),
                        Text(
                          rating.toStringAsFixed(1),
                          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                fontWeight: FontWeight.w600,
                                color: FitnessColors.white,
                              ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              GestureDetector(
                onTap: onMessage,
                child: Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    gradient: FitnessColors.primaryGradient,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Icon(Icons.message_outlined, color: FitnessColors.white, size: 22),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  String _getInitials(String name) {
    final names = name.split(' ');
    if (names.length >= 2) return '${names.first[0]}${names.last[0]}'.toUpperCase();
    return name.isNotEmpty ? name[0].toUpperCase() : '?';
  }
}
