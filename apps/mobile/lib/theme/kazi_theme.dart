import 'package:flutter/material.dart';

class KaziTheme {
  static const primaryGreen = Color(0xFF006B3C);
  static const accentGold = Color(0xFFFFB81C);
  static const pageBackground = Color(0xFFFFFFFF);
  static const surface = Color(0xFFF6F7F4);
  static const text = Color(0xFF111111);

  static ThemeData light() {
    final base = ThemeData.light(useMaterial3: true);

    return base.copyWith(
      scaffoldBackgroundColor: pageBackground,
      colorScheme: const ColorScheme.light(
        primary: primaryGreen,
        secondary: accentGold,
        surface: surface,
        onPrimary: Colors.white,
        onSecondary: text,
        onSurface: text,
      ),
      appBarTheme: const AppBarTheme(
        backgroundColor: pageBackground,
        foregroundColor: text,
        elevation: 0,
      ),
      cardTheme: CardThemeData(
        color: surface,
        elevation: 0,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
      ),
    );
  }
}