import 'package:flutter/material.dart';

import '../theme/fitness_theme.dart';

/// Styled icon container - black/yellow/green theme
/// Used for stats, actions, and navigation accents
enum IconBoxStyle { green, yellow, outline }

class IconBox extends StatelessWidget {
  final Widget icon;
  final IconBoxStyle style;
  final double size;

  const IconBox({
    super.key,
    required this.icon,
    this.style = IconBoxStyle.green,
    this.size = 48,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        gradient: style == IconBoxStyle.green ? FitnessColors.primaryGradient : null,
        color: style == IconBoxStyle.yellow ? FitnessColors.yellow.withOpacity(0.2) : null,
        borderRadius: BorderRadius.circular(size * 0.35),
        border: style == IconBoxStyle.outline
            ? Border.all(color: FitnessColors.green.withOpacity(0.5), width: 1.5)
            : null,
        boxShadow: style == IconBoxStyle.green
            ? [
                BoxShadow(
                  color: FitnessColors.green.withOpacity(0.3),
                  blurRadius: 8,
                  offset: const Offset(0, 4),
                ),
              ]
            : style == IconBoxStyle.yellow
                ? [
                    BoxShadow(
                      color: FitnessColors.yellow.withOpacity(0.2),
                      blurRadius: 8,
                      offset: const Offset(0, 4),
                    ),
                  ]
                : null,
      ),
      child: Center(child: icon),
    );
  }
}
