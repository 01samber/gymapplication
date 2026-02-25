import 'package:flutter/material.dart';

/// SweatBox color scheme
/// White #FFFFFF, Black #000000, Dark Charcoal #0E0E0E, Accent Yellow #695910
class AppColors {
  AppColors._();

  // SweatBox brand
  static const Color white = Color(0xFFFFFFFF);      // Main lettering
  static const Color black = Color(0xFF000000);      // Background, bold text
  static const Color darkCharcoal = Color(0xFF0E0E0E); // Anti-alias, text smoothing
  static const Color accentYellow = Color(0xFF695910); // Accent (e.g. "X")

  // Aliases for compatibility
  static const Color primary = accentYellow;
  static const Color primaryLight = Color(0xFF8B7510);
  static const Color primaryDark = Color(0xFF4A3D0C);

  static const Color secondary = darkCharcoal;
  static const Color secondaryLight = Color(0xFF1A1A1A);
  static const Color secondaryDark = black;

  static const Color success = Color(0xFF2ECC71);
  static const Color successLight = Color(0xFFD4EDDA);
  static const Color warning = accentYellow;
  static const Color warningLight = Color(0x33695910);
  static const Color error = Color(0xFFE74C3C);
  static const Color errorLight = Color(0xFFF8D7DA);
  static const Color info = Color(0xFF3498DB);
  static const Color infoLight = Color(0xFFD1ECF1);

  static const Color background = black;
  static const Color surface = darkCharcoal;
  static const Color surfaceVariant = Color(0xFF141414);

  static const Color textPrimary = white;
  static const Color textSecondary = Color(0xFFB0B0B0);
  static const Color textHint = Color(0xFF808080);
  static const Color textDisabled = Color(0xFF606060);
  static const Color textOnPrimary = black;

  static const Color divider = Color(0xFF2A2A2A);
  static const Color cardBorder = Color(0xFF333333);
  static const Color inputBackground = darkCharcoal;

  static const List<Color> chartColors = [
    accentYellow,
    Color(0xFF457B9D),
    success,
    warning,
    Color(0xFF9B59B6),
    Color(0xFF1ABC9C),
  ];

  static const LinearGradient primaryGradient = LinearGradient(
    colors: [accentYellow, primaryLight],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const LinearGradient secondaryGradient = LinearGradient(
    colors: [darkCharcoal, secondaryLight],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const Color bookingPending = accentYellow;
  static const Color bookingConfirmed = info;
  static const Color bookingCompleted = success;
  static const Color bookingCancelled = Color(0xFF95A5A6);
  static const Color bookingNoShow = error;

  static const Color subscriptionActive = success;
  static const Color subscriptionExpired = error;
  static const Color subscriptionFrozen = info;
}
