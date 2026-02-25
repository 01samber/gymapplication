import 'package:flutter/material.dart';
import '../../models/body_composition_model.dart';

class BodyVisualization extends StatelessWidget {
  final BodyCompositionModel composition;

  const BodyVisualization({
    super.key,
    required this.composition,
  });

  @override
  Widget build(BuildContext context) {
    final isMale = composition.gender?.toLowerCase() == 'male';

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [
            isMale
                ? const Color(0xFF1E3A5F).withOpacity(0.3)
                : const Color(0xFF5F1E3A).withOpacity(0.3),
            Colors.transparent,
          ],
        ),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Column(
        children: [
          Text(
            isMale ? 'Male Body Analysis' : 'Female Body Analysis',
            style: Theme.of(context).textTheme.titleLarge?.copyWith(
                  fontWeight: FontWeight.bold,
                  color: isMale ? Colors.blue[300] : Colors.pink[300],
                ),
          ),
          const SizedBox(height: 20),
          SizedBox(
            height: 400,
            child: Stack(
              alignment: Alignment.center,
              children: [
                // Body outline
                CustomPaint(
                  size: const Size(200, 380),
                  painter: BodyOutlinePainter(
                    isMale: isMale,
                    composition: composition,
                  ),
                ),
                // Segmental indicators
                ..._buildSegmentalIndicators(context, isMale),
              ],
            ),
          ),
          const SizedBox(height: 20),
          _buildLegend(context),
        ],
      ),
    );
  }

  List<Widget> _buildSegmentalIndicators(BuildContext context, bool isMale) {
    final indicators = <Widget>[];

    // Right Arm
    if (composition.rightArmFatPercent != null) {
      indicators.add(
        Positioned(
          right: 20,
          top: 80,
          child: _buildIndicatorBadge(
            'R. Arm',
            composition.rightArmFatPercent!,
            composition.rightArmLeanPercent,
            isMale,
          ),
        ),
      );
    }

    // Left Arm
    if (composition.leftArmFatPercent != null) {
      indicators.add(
        Positioned(
          left: 20,
          top: 80,
          child: _buildIndicatorBadge(
            'L. Arm',
            composition.leftArmFatPercent!,
            composition.leftArmLeanPercent,
            isMale,
          ),
        ),
      );
    }

    // Trunk
    if (composition.trunkFatPercent != null) {
      indicators.add(
        Positioned(
          right: 30,
          top: 170,
          child: _buildIndicatorBadge(
            'Trunk',
            composition.trunkFatPercent!,
            composition.trunkLeanPercent,
            isMale,
          ),
        ),
      );
    }

    // Right Leg
    if (composition.rightLegFatPercent != null) {
      indicators.add(
        Positioned(
          right: 40,
          bottom: 60,
          child: _buildIndicatorBadge(
            'R. Leg',
            composition.rightLegFatPercent!,
            composition.rightLegLeanPercent,
            isMale,
          ),
        ),
      );
    }

    // Left Leg
    if (composition.leftLegFatPercent != null) {
      indicators.add(
        Positioned(
          left: 40,
          bottom: 60,
          child: _buildIndicatorBadge(
            'L. Leg',
            composition.leftLegFatPercent!,
            composition.leftLegLeanPercent,
            isMale,
          ),
        ),
      );
    }

    return indicators;
  }

  Widget _buildIndicatorBadge(
      String label, double fatPercent, double? leanPercent, bool isMale) {
    Color getColorForFat(double percent) {
      if (percent < 15) return Colors.green;
      if (percent < 25) return Colors.yellow[700]!;
      if (percent < 35) return Colors.orange;
      return Colors.red;
    }

    return Container(
      padding: const EdgeInsets.all(8),
      decoration: BoxDecoration(
        color: Colors.black54,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(
          color: getColorForFat(fatPercent),
          width: 2,
        ),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            label,
            style: const TextStyle(
              color: Colors.white70,
              fontSize: 10,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            '${fatPercent.toStringAsFixed(1)}%',
            style: TextStyle(
              color: getColorForFat(fatPercent),
              fontSize: 12,
              fontWeight: FontWeight.bold,
            ),
          ),
          if (leanPercent != null)
            Text(
              'Lean: ${leanPercent.toStringAsFixed(0)}%',
              style: const TextStyle(
                color: Colors.blue,
                fontSize: 9,
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildLegend(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.black26,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceEvenly,
        children: [
          _legendItem(Colors.green, 'Optimal'),
          _legendItem(Colors.yellow[700]!, 'Normal'),
          _legendItem(Colors.orange, 'High'),
          _legendItem(Colors.red, 'Very High'),
        ],
      ),
    );
  }

  Widget _legendItem(Color color, String label) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 12,
          height: 12,
          decoration: BoxDecoration(
            color: color,
            shape: BoxShape.circle,
          ),
        ),
        const SizedBox(width: 4),
        Text(
          label,
          style: const TextStyle(
            color: Colors.white70,
            fontSize: 10,
          ),
        ),
      ],
    );
  }
}

class BodyOutlinePainter extends CustomPainter {
  final bool isMale;
  final BodyCompositionModel composition;

  BodyOutlinePainter({
    required this.isMale,
    required this.composition,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = Colors.white.withOpacity(0.3)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2;

    final fillPaint = Paint()..style = PaintingStyle.fill;

    final centerX = size.width / 2;

    if (isMale) {
      _drawMaleBody(canvas, size, centerX, paint, fillPaint);
    } else {
      _drawFemaleBody(canvas, size, centerX, paint, fillPaint);
    }
  }

  void _drawMaleBody(
      Canvas canvas, Size size, double centerX, Paint paint, Paint fillPaint) {
    // Head
    final headRect = Rect.fromCenter(
      center: Offset(centerX, 30),
      width: 50,
      height: 50,
    );
    canvas.drawOval(headRect, paint);
    fillPaint.color =
        _getSegmentColor(composition.percentBodyFat ?? 20).withOpacity(0.3);
    canvas.drawOval(headRect, fillPaint);

    // Neck
    final neckPath = Path()
      ..moveTo(centerX - 12, 55)
      ..lineTo(centerX - 12, 70)
      ..lineTo(centerX + 12, 70)
      ..lineTo(centerX + 12, 55);
    canvas.drawPath(neckPath, paint);

    // Torso (broader shoulders for male)
    final torsoPath = Path()
      ..moveTo(centerX - 50, 70) // Left shoulder
      ..lineTo(centerX - 55, 90) // Left trap
      ..lineTo(centerX - 45, 180) // Left waist
      ..lineTo(centerX - 35, 200) // Left hip
      ..lineTo(centerX + 35, 200) // Right hip
      ..lineTo(centerX + 45, 180) // Right waist
      ..lineTo(centerX + 55, 90) // Right trap
      ..lineTo(centerX + 50, 70) // Right shoulder
      ..close();

    fillPaint.color =
        _getSegmentColor(composition.trunkFatPercent ?? 20).withOpacity(0.4);
    canvas.drawPath(torsoPath, fillPaint);
    canvas.drawPath(torsoPath, paint);

    // Left Arm
    final leftArmPath = Path()
      ..moveTo(centerX - 50, 75)
      ..quadraticBezierTo(centerX - 75, 90, centerX - 70, 160)
      ..quadraticBezierTo(centerX - 68, 175, centerX - 60, 175)
      ..quadraticBezierTo(centerX - 52, 175, centerX - 55, 160)
      ..quadraticBezierTo(centerX - 50, 100, centerX - 45, 80)
      ..close();

    fillPaint.color =
        _getSegmentColor(composition.leftArmFatPercent ?? 20).withOpacity(0.4);
    canvas.drawPath(leftArmPath, fillPaint);
    canvas.drawPath(leftArmPath, paint);

    // Right Arm
    final rightArmPath = Path()
      ..moveTo(centerX + 50, 75)
      ..quadraticBezierTo(centerX + 75, 90, centerX + 70, 160)
      ..quadraticBezierTo(centerX + 68, 175, centerX + 60, 175)
      ..quadraticBezierTo(centerX + 52, 175, centerX + 55, 160)
      ..quadraticBezierTo(centerX + 50, 100, centerX + 45, 80)
      ..close();

    fillPaint.color =
        _getSegmentColor(composition.rightArmFatPercent ?? 20).withOpacity(0.4);
    canvas.drawPath(rightArmPath, fillPaint);
    canvas.drawPath(rightArmPath, paint);

    // Left Leg
    final leftLegPath = Path()
      ..moveTo(centerX - 35, 200)
      ..lineTo(centerX - 40, 300)
      ..quadraticBezierTo(centerX - 42, 350, centerX - 35, 370)
      ..lineTo(centerX - 15, 370)
      ..quadraticBezierTo(centerX - 10, 350, centerX - 15, 300)
      ..lineTo(centerX - 5, 200)
      ..close();

    fillPaint.color =
        _getSegmentColor(composition.leftLegFatPercent ?? 20).withOpacity(0.4);
    canvas.drawPath(leftLegPath, fillPaint);
    canvas.drawPath(leftLegPath, paint);

    // Right Leg
    final rightLegPath = Path()
      ..moveTo(centerX + 35, 200)
      ..lineTo(centerX + 40, 300)
      ..quadraticBezierTo(centerX + 42, 350, centerX + 35, 370)
      ..lineTo(centerX + 15, 370)
      ..quadraticBezierTo(centerX + 10, 350, centerX + 15, 300)
      ..lineTo(centerX + 5, 200)
      ..close();

    fillPaint.color =
        _getSegmentColor(composition.rightLegFatPercent ?? 20).withOpacity(0.4);
    canvas.drawPath(rightLegPath, fillPaint);
    canvas.drawPath(rightLegPath, paint);
  }

  void _drawFemaleBody(
      Canvas canvas, Size size, double centerX, Paint paint, Paint fillPaint) {
    // Head
    final headRect = Rect.fromCenter(
      center: Offset(centerX, 30),
      width: 45,
      height: 50,
    );
    canvas.drawOval(headRect, paint);
    fillPaint.color =
        _getSegmentColor(composition.percentBodyFat ?? 25).withOpacity(0.3);
    canvas.drawOval(headRect, fillPaint);

    // Neck (slimmer)
    final neckPath = Path()
      ..moveTo(centerX - 10, 55)
      ..lineTo(centerX - 10, 68)
      ..lineTo(centerX + 10, 68)
      ..lineTo(centerX + 10, 55);
    canvas.drawPath(neckPath, paint);

    // Torso (narrower shoulders, wider hips for female)
    final torsoPath = Path()
      ..moveTo(centerX - 40, 70) // Left shoulder
      ..lineTo(centerX - 42, 85) // Left trap
      ..lineTo(centerX - 35, 140) // Narrower waist
      ..lineTo(centerX - 45, 190) // Wider hip
      ..lineTo(centerX - 40, 210) // Left hip
      ..lineTo(centerX + 40, 210) // Right hip
      ..lineTo(centerX + 45, 190) // Wider hip
      ..lineTo(centerX + 35, 140) // Narrower waist
      ..lineTo(centerX + 42, 85) // Right trap
      ..lineTo(centerX + 40, 70) // Right shoulder
      ..close();

    fillPaint.color =
        _getSegmentColor(composition.trunkFatPercent ?? 25).withOpacity(0.4);
    canvas.drawPath(torsoPath, fillPaint);
    canvas.drawPath(torsoPath, paint);

    // Left Arm (slimmer)
    final leftArmPath = Path()
      ..moveTo(centerX - 40, 73)
      ..quadraticBezierTo(centerX - 60, 85, centerX - 55, 155)
      ..quadraticBezierTo(centerX - 54, 168, centerX - 48, 168)
      ..quadraticBezierTo(centerX - 42, 168, centerX - 44, 155)
      ..quadraticBezierTo(centerX - 40, 95, centerX - 35, 78)
      ..close();

    fillPaint.color =
        _getSegmentColor(composition.leftArmFatPercent ?? 25).withOpacity(0.4);
    canvas.drawPath(leftArmPath, fillPaint);
    canvas.drawPath(leftArmPath, paint);

    // Right Arm (slimmer)
    final rightArmPath = Path()
      ..moveTo(centerX + 40, 73)
      ..quadraticBezierTo(centerX + 60, 85, centerX + 55, 155)
      ..quadraticBezierTo(centerX + 54, 168, centerX + 48, 168)
      ..quadraticBezierTo(centerX + 42, 168, centerX + 44, 155)
      ..quadraticBezierTo(centerX + 40, 95, centerX + 35, 78)
      ..close();

    fillPaint.color =
        _getSegmentColor(composition.rightArmFatPercent ?? 25).withOpacity(0.4);
    canvas.drawPath(rightArmPath, fillPaint);
    canvas.drawPath(rightArmPath, paint);

    // Left Leg (curvier)
    final leftLegPath = Path()
      ..moveTo(centerX - 40, 210)
      ..quadraticBezierTo(centerX - 48, 260, centerX - 38, 310)
      ..quadraticBezierTo(centerX - 35, 355, centerX - 30, 370)
      ..lineTo(centerX - 12, 370)
      ..quadraticBezierTo(centerX - 10, 355, centerX - 12, 310)
      ..quadraticBezierTo(centerX - 8, 260, centerX - 5, 210)
      ..close();

    fillPaint.color =
        _getSegmentColor(composition.leftLegFatPercent ?? 25).withOpacity(0.4);
    canvas.drawPath(leftLegPath, fillPaint);
    canvas.drawPath(leftLegPath, paint);

    // Right Leg (curvier)
    final rightLegPath = Path()
      ..moveTo(centerX + 40, 210)
      ..quadraticBezierTo(centerX + 48, 260, centerX + 38, 310)
      ..quadraticBezierTo(centerX + 35, 355, centerX + 30, 370)
      ..lineTo(centerX + 12, 370)
      ..quadraticBezierTo(centerX + 10, 355, centerX + 12, 310)
      ..quadraticBezierTo(centerX + 8, 260, centerX + 5, 210)
      ..close();

    fillPaint.color =
        _getSegmentColor(composition.rightLegFatPercent ?? 25).withOpacity(0.4);
    canvas.drawPath(rightLegPath, fillPaint);
    canvas.drawPath(rightLegPath, paint);
  }

  Color _getSegmentColor(double fatPercent) {
    // Color coding based on body fat percentage
    if (fatPercent < 15) return Colors.green;
    if (fatPercent < 25) return Colors.yellow[700]!;
    if (fatPercent < 35) return Colors.orange;
    return Colors.red;
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => true;
}
