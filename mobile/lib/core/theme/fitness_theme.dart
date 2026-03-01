import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

/// SweatBox fitness theme: Black, Yellow, Green
/// Premium gym aesthetic with bold accents
class FitnessColors {
  FitnessColors._();

  static const Color black = Color(0xFF0A0A0B);
  static const Color blackSoft = Color(0xFF141414);
  static const Color blackCard = Color(0xFF1A1A1A);

  static const Color yellow = Color(0xFFF5C518);
  static const Color yellowLight = Color(0xFFFFE066);
  static const Color yellowDark = Color(0xFFE6B000);

  static const Color green = Color(0xFF00A651);
  static const Color greenLight = Color(0xFF00C853);
  static const Color greenDark = Color(0xFF008C45);

  static const Color white = Color(0xFFFFFFFF);
  static const Color gray = Color(0xFF9E9E9E);
  static const Color grayLight = Color(0xFFB0B0B0);

  static const List<Color> primaryG = [greenLight, green];
  static const List<Color> accentG = [yellowLight, yellow];

  static const LinearGradient primaryGradient = LinearGradient(
    colors: [greenLight, green],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const LinearGradient accentGradient = LinearGradient(
    colors: [yellowLight, yellow],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  // Aliases for compatibility
  static const Color primaryColor1 = green;
  static const Color primaryColor2 = greenLight;
  static const Color secondaryColor1 = yellow;
  static const Color secondaryColor2 = yellowLight;
  static const List<Color> secondaryG = accentG;
  static const Color lightGray = blackCard;
}

/// Fitness app dark theme (Black / Yellow / Green)
class FitnessTheme {
  FitnessTheme._();

  static ThemeData get darkTheme {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      colorScheme: ColorScheme.dark(
        primary: FitnessColors.green,
        secondary: FitnessColors.yellow,
        surface: FitnessColors.blackCard,
        error: const Color(0xFFE74C3C),
        onPrimary: FitnessColors.black,
        onSecondary: FitnessColors.black,
        onSurface: FitnessColors.white,
        onError: FitnessColors.white,
      ),
      scaffoldBackgroundColor: FitnessColors.black,
      textTheme: GoogleFonts.poppinsTextTheme(ThemeData.dark().textTheme).copyWith(
        displayLarge: GoogleFonts.poppins(
          fontSize: 32,
          fontWeight: FontWeight.bold,
          color: FitnessColors.white,
        ),
        headlineMedium: GoogleFonts.poppins(
          fontSize: 20,
          fontWeight: FontWeight.w600,
          color: FitnessColors.white,
        ),
        titleLarge: GoogleFonts.poppins(
          fontSize: 16,
          fontWeight: FontWeight.w600,
          color: FitnessColors.white,
        ),
        bodyLarge: GoogleFonts.poppins(
          fontSize: 16,
          color: FitnessColors.white,
        ),
        bodyMedium: GoogleFonts.poppins(
          fontSize: 14,
          color: FitnessColors.grayLight,
        ),
        bodySmall: GoogleFonts.poppins(
          fontSize: 12,
          color: FitnessColors.gray,
        ),
      ),
      appBarTheme: AppBarTheme(
        elevation: 0,
        backgroundColor: FitnessColors.black,
        foregroundColor: FitnessColors.white,
        titleTextStyle: GoogleFonts.poppins(
          fontSize: 18,
          fontWeight: FontWeight.w600,
          color: FitnessColors.white,
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          elevation: 0,
          backgroundColor: FitnessColors.green,
          foregroundColor: FitnessColors.white,
          minimumSize: const Size(double.infinity, 52),
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
          textStyle: GoogleFonts.poppins(
            fontSize: 16,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
    );
  }
}
