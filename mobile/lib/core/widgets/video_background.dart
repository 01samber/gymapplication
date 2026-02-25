import 'dart:math' as math;

import 'package:flutter/material.dart';

import '../theme/app_colors.dart';

/// Animated gym-themed moving wallpaper - no video dependency.
/// Unique flowing gradient that evokes energy, sweat, and iron.
class VideoBackground extends StatefulWidget {
  const VideoBackground({super.key});

  @override
  State<VideoBackground> createState() => _VideoBackgroundState();
}

class _VideoBackgroundState extends State<VideoBackground>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _pulse;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: const Duration(seconds: 8),
      vsync: this,
    )..repeat(reverse: true);
    _pulse = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _pulse,
      builder: (context, child) {
        return CustomPaint(
          painter: _GymWallpaperPainter(
            progress: _pulse.value,
            primary: AppColors.primary,
          ),
          size: Size.infinite,
        );
      },
    );
  }
}

class _GymWallpaperPainter extends CustomPainter {
  final double progress;
  final Color primary;

  _GymWallpaperPainter({required this.progress, required this.primary});

  @override
  void paint(Canvas canvas, Size size) {
    final w = size.width;
    final h = size.height;

    // Base: dark charcoal to deep red-amber gym vibe
    final baseGradient = LinearGradient(
      begin: Alignment.topLeft,
      end: Alignment.bottomRight,
      colors: [
        const Color(0xFF0D0D0F),
        const Color(0xFF1A1210),
        Color.lerp(const Color(0xFF1A1210), primary.withValues(alpha: 0.4), 0.3)!,
      ],
    );
    canvas.drawRect(Rect.fromLTWH(0, 0, w, h), Paint()..shader = baseGradient.createShader(Rect.fromLTWH(0, 0, w, h)));

    // Moving "spotlight" orbs - gym floor lights feel
    final orb1X = w * (0.2 + progress * 0.3);
    final orb1Y = h * (0.3 + math.sin(progress * math.pi * 2) * 0.1);
    final orb2X = w * (0.6 + (1 - progress) * 0.25);
    final orb2Y = h * (0.6 + math.cos(progress * math.pi * 2) * 0.1);
    final orb3X = w * (0.4 + progress * 0.2);
    final orb3Y = h * (0.8 - progress * 0.1);

    final paint = Paint()..style = PaintingStyle.fill;
    paint.shader = RadialGradient(
      colors: [
        primary.withValues(alpha: 0.25),
        primary.withValues(alpha: 0.08),
        Colors.transparent,
      ],
      stops: const [0.0, 0.5, 1.0],
    ).createShader(Rect.fromCircle(center: Offset(orb1X, orb1Y), radius: w * 0.5));
    canvas.drawCircle(Offset(orb1X, orb1Y), w * 0.45, paint);

    paint.shader = RadialGradient(
      colors: [
        const Color(0xFFE85D04).withValues(alpha: 0.2),
        const Color(0xFFE85D04).withValues(alpha: 0.05),
        Colors.transparent,
      ],
      stops: const [0.0, 0.5, 1.0],
    ).createShader(Rect.fromCircle(center: Offset(orb2X, orb2Y), radius: w * 0.4));
    canvas.drawCircle(Offset(orb2X, orb2Y), w * 0.4, paint);

    paint.shader = RadialGradient(
      colors: [
        primary.withValues(alpha: 0.15),
        Colors.transparent,
      ],
      stops: const [0.0, 1.0],
    ).createShader(Rect.fromCircle(center: Offset(orb3X, orb3Y), radius: w * 0.35));
    canvas.drawCircle(Offset(orb3X, orb3Y), w * 0.35, paint);

    // Subtle diagonal "barbell" accent lines
    final linePaint = Paint()
      ..color = primary.withValues(alpha: 0.06)
      ..strokeWidth = 1;
    for (var i = -2; i <= 4; i++) {
      final offset = (progress * 60 + i * 30) % 100;
      canvas.drawLine(
        Offset(-w * 0.2 + offset * 20, -h * 0.1),
        Offset(w * 1.2 + offset * 10, h * 1.2),
        linePaint,
      );
    }
  }

  @override
  bool shouldRepaint(covariant _GymWallpaperPainter old) => old.progress != progress;
}
