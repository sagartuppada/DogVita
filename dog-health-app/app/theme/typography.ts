/**
 * DogVita Typography System
 * Modern, clean hierarchy for pet wellness
 */

import { TextStyle, Platform } from 'react-native';
import { colors } from './colors';

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
  fontFamily,

  fontSize: {
    xs: 11,
    sm: 13,
    md: 15,
    lg: 17,
    xl: 19,
    xxl: 22,
    xxxl: 28,
    display: 34,
    hero: 42,
  },

  lineHeight: {
    tight: 1.2,
    snug: 1.3,
    normal: 1.5,
    relaxed: 1.65,
    loose: 1.8,
  },

  styles: {
    headingXL: {
      fontSize: 34,
      lineHeight: 41,
      fontWeight: '700',
      fontFamily: fontFamily.bold,
      color: colors.text.primary,
      letterSpacing: -0.5,
    } as TextStyle,

    headingLG: {
      fontSize: 28,
      lineHeight: 34,
      fontWeight: '700',
      fontFamily: fontFamily.bold,
      color: colors.text.primary,
      letterSpacing: -0.3,
    } as TextStyle,

    headingMD: {
      fontSize: 22,
      lineHeight: 28,
      fontWeight: '600',
      fontFamily: fontFamily.semibold,
      color: colors.text.primary,
    } as TextStyle,

    headingSM: {
      fontSize: 19,
      lineHeight: 24,
      fontWeight: '600',
      fontFamily: fontFamily.semibold,
      color: colors.text.primary,
    } as TextStyle,

    bodyLG: {
      fontSize: 17,
      lineHeight: 26,
      fontWeight: '400',
      fontFamily: fontFamily.regular,
      color: colors.text.primary,
    } as TextStyle,

    bodyMD: {
      fontSize: 15,
      lineHeight: 22,
      fontWeight: '400',
      fontFamily: fontFamily.regular,
      color: colors.text.primary,
    } as TextStyle,

    bodySM: {
      fontSize: 13,
      lineHeight: 18,
      fontWeight: '400',
      fontFamily: fontFamily.regular,
      color: colors.text.secondary,
    } as TextStyle,

    caption: {
      fontSize: 12,
      lineHeight: 16,
      fontWeight: '400',
      fontFamily: fontFamily.regular,
      color: colors.text.tertiary,
    } as TextStyle,

    label: {
      fontSize: 13,
      lineHeight: 18,
      fontWeight: '600',
      fontFamily: fontFamily.medium,
      color: colors.text.secondary,
      letterSpacing: 0.3,
    } as TextStyle,

    labelLG: {
      fontSize: 15,
      lineHeight: 20,
      fontWeight: '600',
      fontFamily: fontFamily.medium,
      color: colors.text.secondary,
      letterSpacing: 0.2,
    } as TextStyle,

    buttonLG: {
      fontSize: 17,
      lineHeight: 22,
      fontWeight: '700',
      fontFamily: fontFamily.bold,
      letterSpacing: 0.3,
    } as TextStyle,

    buttonMD: {
      fontSize: 15,
      lineHeight: 20,
      fontWeight: '700',
      fontFamily: fontFamily.bold,
      letterSpacing: 0.2,
    } as TextStyle,

    buttonSM: {
      fontSize: 13,
      lineHeight: 18,
      fontWeight: '600',
      fontFamily: fontFamily.semibold,
      letterSpacing: 0.2,
    } as TextStyle,

    overline: {
      fontSize: 11,
      lineHeight: 14,
      fontWeight: '600',
      fontFamily: fontFamily.medium,
      letterSpacing: 1.2,
      textTransform: 'uppercase',
    } as TextStyle,
  },
} as const;

export type Typography = typeof typography;
