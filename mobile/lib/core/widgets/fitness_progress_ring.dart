import 'package:flutter/material.dart';

import '../theme/app_colors.dart';

/// Circular progress ring - fitness app style
/// Used for weekly goals, streaks, subscription progress
class FitnessProgressRing extends StatelessWidget {
  final double progress;
  final double size;
  final double strokeWidth;
  final Color? progressColor;
  final Color? backgroundColor;
  final Widget? child;
  final bool showPercentage;

  const FitnessProgressRing({
    super.key,
    required this.progress,
    this.size = 80,
    this.strokeWidth = 8,
    this.progressColor,
    this.backgroundColor,
    this.child,
    this.showPercentage = false,
  });

  @override
  Widget build(BuildContext context) {
    final prog = progress.clamp(0.0, 1.0);
    final color = progressColor ?? AppColors.primary;
    final bg = backgroundColor ?? color.withOpacity(0.15);

    return SizedBox(
      width: size,
      height: size,
      child: Stack(
        alignment: Alignment.center,
        children: [
          SizedBox(
            width: size,
            height: size,
            child: CustomPaint(
              painter: _RingPainter(
                progress: 1,
                color: bg,
                strokeWidth: strokeWidth,
              ),
            ),
          ),
          SizedBox(
            width: size,
            height: size,
            child: CustomPaint(
              painter: _RingPainter(
                progress: prog,
                color: color,
                strokeWidth: strokeWidth,
              ),
            ),
          ),
          if (child != null)
            child!
          else if (showPercentage)
            Text(
              '${(prog * 100).round()}%',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                    color: AppColors.textPrimary,
                  ),
            ),
        ],
      ),
    );
  }
}

class _RingPainter extends CustomPainter {
  final double progress;
  final Color color;
  final double strokeWidth;

  _RingPainter({
    required this.progress,
    required this.color,
    required this.strokeWidth,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final rect = Rect.fromLTWH(0, 0, size.width, size.height);
    final paint = Paint()
      ..color = color
      ..style = PaintingStyle.stroke
      ..strokeWidth = strokeWidth
      ..strokeCap = StrokeCap.round;

    const startAngle = -1.5708;
    final sweepAngle = 2 * 3.14159 * progress;
    canvas.drawArc(rect, startAngle, sweepAngle, false, paint);
  }

  @override
  bool shouldRepaint(covariant _RingPainter oldDelegate) =>
      oldDelegate.progress != progress || oldDelegate.color != color;
}
