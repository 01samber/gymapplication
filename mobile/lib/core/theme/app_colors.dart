import 'package:flutter/material.dart';

/// SweatBox color scheme - Dark glass UI (aligned with Admin/Dietitian web)
/// Primary Green #00a651, Accent Red #c1272d, Dark surfaces
class AppColors {
  AppColors._();

  // SweatBox brand - dark glass theme
  static const Color white = Color(0xFFFFFFFF);
  static const Color black = Color(0xFF000000);
  static const Color darkCharcoal = Color(0xFF0A0A0B);
  static const Color primaryGreen = Color(0xFF00A651);
  static const Color accentRed = Color(0xFFC1272D);

  // Aliases for compatibility
  static const Color primary = primaryGreen;
  static const Color primaryLight = Color(0xFF00C853);
  static const Color primaryDark = Color(0xFF008C45);
  static const Color accentYellow = primaryGreen; // legacy alias

  static const Color secondary = darkCharcoal;
  static const Color secondaryLight = Color(0xFF1A1A1A);
  static const Color secondaryDark = black;

  static const Color success = Color(0xFF2ECC71);
  static const Color successLight = Color(0xFFD4EDDA);
  static const Color warning = accentYellow;
  static const Color warningLight = Color(0x3300A651);
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
    colors: [primaryGreen, primaryLight],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const LinearGradient secondaryGradient = LinearGradient(
    colors: [darkCharcoal, secondaryLight],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const Color bookingPending = primaryGreen;
  static const Color bookingConfirmed = info;
  static const Color bookingCompleted = success;
  static const Color bookingCancelled = Color(0xFF95A5A6);
  static const Color bookingNoShow = error;

  static const Color subscriptionActive = success;
  static const Color subscriptionExpired = error;
  static const Color subscriptionFrozen = info;
}
