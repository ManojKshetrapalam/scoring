import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class SportsTheme {
  // Brand HSL translations to Hex
  static const Color bgPrimary = Color(0xFF070C1B);       // Space Navy Black
  static const Color bgSecondary = Color(0xFF0F162A);     // Stadium Card Navy
  static const Color accentNeon = Color(0xFF39FF0C);      // vibrant Neon Green
  static const Color accentNeonHover = Color(0xFF2EDB0A); // Slightly darker green
  static const Color borderNavy = Color(0xFF1B243B);      // Border color
  static const Color textPrimary = Color(0xFFFCFCFC);     // Off white
  static const Color textSecondary = Color(0xFF9EAAB9);   // Cool grey
  static const Color accentOrange = Color(0xFFFF9800);    // Orange Cap highlight
  static const Color accentPurple = Color(0xFF9C27B0);    // Purple Cap highlight

  static ThemeData get darkTheme {
    return ThemeData.dark().copyWith(
      scaffoldBackgroundColor: bgPrimary,
      primaryColor: bgSecondary,
      colorScheme: const ColorScheme.dark(
        primary: bgSecondary,
        secondary: accentNeon,
        surface: bgSecondary,
        background: bgPrimary,
        error: Colors.redAccent,
      ),
      dividerColor: borderNavy,
      cardColor: bgSecondary,
      textTheme: GoogleFonts.interTextTheme(ThemeData.dark().textTheme).copyWith(
        titleLarge: GoogleFonts.orbitron(
          fontSize: 22,
          fontWeight: FontWeight.black,
          color: textPrimary,
          letterSpacing: 0.5,
        ),
        titleMedium: GoogleFonts.orbitron(
          fontSize: 16,
          fontWeight: FontWeight.bold,
          color: textPrimary,
          letterSpacing: 0.5,
        ),
        bodyLarge: GoogleFonts.inter(
          fontSize: 16,
          fontWeight: FontWeight.w500,
          color: textPrimary,
        ),
        bodyMedium: GoogleFonts.inter(
          fontSize: 14,
          fontWeight: FontWeight.normal,
          color: textSecondary,
        ),
        labelLarge: GoogleFonts.inter(
          fontSize: 12,
          fontWeight: FontWeight.bold,
          color: textPrimary,
          letterSpacing: 1.0,
        ),
      ),
      appBarTheme: const AppBarTheme(
        backgroundColor: bgSecondary,
        elevation: 0,
        centerTitle: false,
        iconTheme: IconThemeData(color: textPrimary),
        titleTextStyle: TextStyle(
          color: textPrimary,
          fontSize: 18,
          fontWeight: FontWeight.bold,
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: accentNeon,
          foregroundColor: Colors.black,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(8.0),
          ),
          padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 24),
          textStyle: GoogleFonts.inter(
            fontSize: 14,
            fontWeight: FontWeight.bold,
            letterSpacing: 0.5,
          ),
        ),
      ),
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: accentNeon,
          textStyle: const TextStyle(fontWeight: FontWeight.bold),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: bgSecondary,
        labelStyle: const TextStyle(color: textSecondary, fontSize: 13),
        hintStyle: const TextStyle(color: Colors.white24, fontSize: 13),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8.0),
          borderSide: const BorderSide(color: borderNavy, width: 1.0),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8.0),
          borderSide: const BorderSide(color: borderNavy, width: 1.0),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8.0),
          borderSide: const BorderSide(color: accentNeon, width: 1.5),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8.0),
          borderSide: const BorderSide(color: Colors.redAccent, width: 1.0),
        ),
      ),
    );
  }
}
