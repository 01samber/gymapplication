import 'dart:ui';

import 'package:flutter/material.dart';

import '../theme/app_colors.dart';

/// Glass morphism card - fitness app style
/// Frosted glass with subtle border, rounded corners
class FitnessGlassCard extends StatelessWidget {
  final Widget child;
  final EdgeInsetsGeometry? padding;
  final double borderRadius;
  final VoidCallback? onTap;
  final bool hasGradient;
  final Color? gradientStart;
  final Color? gradientEnd;

  const FitnessGlassCard({
    super.key,
    required this.child,
    this.padding,
    this.borderRadius = 20,
    this.onTap,
    this.hasGradient = false,
    this.gradientStart,
    this.gradientEnd,
  });

  @override
  Widget build(BuildContext context) {
    final content = ClipRRect(
      borderRadius: BorderRadius.circular(borderRadius),
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
        child: Container(
          padding: padding ?? const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: hasGradient ? null : Colors.white.withOpacity(0.06),
            gradient: hasGradient
                ? LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [
                      (gradientStart ?? AppColors.primary).withOpacity(0.25),
                      (gradientEnd ?? AppColors.accentRed).withOpacity(0.08),
                    ],
                  )
                : null,
            borderRadius: BorderRadius.circular(borderRadius),
            border: Border.all(
              color: Colors.white.withOpacity(0.1),
              width: 1,
            ),
          ),
          child: child,
        ),
      ),
    );

    if (onTap != null) {
      return Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(borderRadius),
          child: content,
        ),
      );
    }
    return content;
  }
}
