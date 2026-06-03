/**
 * Typography system for consistent text styling
 */

import { TextStyle, Platform } from 'react-native';

const fontFamily = Platform.select({
  ios: {
    regular: 'System',
    medium: 'System',
    semibold: 'System',
    bold: 'System',
  },
  android: {
    regular: 'Roboto',
    medium: 'Roboto',
    semibold: 'Roboto',
    bold: 'Roboto',
  },
  default: {
    regular: 'System',
    medium: 'System',
    semibold: 'System',
    bold: 'System',
  },
});

export const typography = {
  // Font sizes
  fontSize: {
    xs: 10,
    sm: 12,
    md: 14,
    lg: 16,
    xl: 18,
    xxl: 20,
    xxxl: 24,
    display: 32,
    hero: 40,
  },

  // Line heights
  lineHeight: {
    tight: 1.1,
    normal: 1.4,
    relaxed: 1.6,
    loose: 1.8,
  },

  // Letter spacing
  letterSpacing: {
    tight: -0.5,
    normal: 0,
    wide: 0.5,
    wider: 1,
  },

  // Text styles
  styles: {
    // Display text
    displayLarge: {
      fontSize: 40,
      lineHeight: 48,
      fontWeight: '700',
      fontFamily: fontFamily.bold,
      letterSpacing: -0.5,
    } as TextStyle,

    displayMedium: {
      fontSize: 32,
      lineHeight: 40,
      fontWeight: '700',
      fontFamily: fontFamily.bold,
      letterSpacing: -0.25,
    } as TextStyle,

    displaySmall: {
      fontSize: 24,
      lineHeight: 32,
      fontWeight: '600',
      fontFamily: fontFamily.semibold,
    } as TextStyle,

    // Headlines
    headlineLarge: {
      fontSize: 24,
      lineHeight: 32,
      fontWeight: '600',
      fontFamily: fontFamily.semibold,
    } as TextStyle,

    headlineMedium: {
      fontSize: 20,
      lineHeight: 28,
      fontWeight: '600',
      fontFamily: fontFamily.semibold,
    } as TextStyle,

    headlineSmall: {
      fontSize: 18,
      lineHeight: 24,
      fontWeight: '600',
      fontFamily: fontFamily.semibold,
    } as TextStyle,

    // Title text
    titleLarge: {
      fontSize: 18,
      lineHeight: 24,
      fontWeight: '500',
      fontFamily: fontFamily.medium,
    } as TextStyle,

    titleMedium: {
      fontSize: 16,
      lineHeight: 22,
      fontWeight: '500',
      fontFamily: fontFamily.medium,
    } as TextStyle,

    titleSmall: {
      fontSize: 14,
      lineHeight: 20,
      fontWeight: '500',
      fontFamily: fontFamily.medium,
    } as TextStyle,

    // Body text
    bodyLarge: {
      fontSize: 16,
      lineHeight: 24,
      fontWeight: '400',
      fontFamily: fontFamily.regular,
    } as TextStyle,

    bodyMedium: {
      fontSize: 14,
      lineHeight: 20,
      fontWeight: '400',
      fontFamily: fontFamily.regular,
    } as TextStyle,

    bodySmall: {
      fontSize: 12,
      lineHeight: 16,
      fontWeight: '400',
      fontFamily: fontFamily.regular,
    } as TextStyle,

    // Label text
    labelLarge: {
      fontSize: 14,
      lineHeight: 20,
      fontWeight: '500',
      fontFamily: fontFamily.medium,
      letterSpacing: 0.1,
    } as TextStyle,

    labelMedium: {
      fontSize: 12,
      lineHeight: 16,
      fontWeight: '500',
      fontFamily: fontFamily.medium,
      letterSpacing: 0.5,
    } as TextStyle,

    labelSmall: {
      fontSize: 10,
      lineHeight: 14,
      fontWeight: '500',
      fontFamily: fontFamily.medium,
      letterSpacing: 0.5,
    } as TextStyle,

    // Caption text
    caption: {
      fontSize: 12,
      lineHeight: 16,
      fontWeight: '400',
      fontFamily: fontFamily.regular,
      letterSpacing: 0.4,
    } as TextStyle,

    overline: {
      fontSize: 10,
      lineHeight: 14,
      fontWeight: '500',
      fontFamily: fontFamily.medium,
      letterSpacing: 1.5,
      textTransform: 'uppercase',
    } as TextStyle,
  },
} as const;

export type Typography = typeof typography;
export type TextStyleKey = keyof typeof typography.styles;