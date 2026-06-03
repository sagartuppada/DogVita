/**
 * Theme exports
 * Central theme configuration combining colors, spacing, typography, and shadows
 */

export { colors } from './colors';
export { spacing } from './spacing';
export { typography } from './typography';
export { shadows } from './shadows';

export type { Colors, PrimaryColor, SecondaryColor, HealthColor } from './colors';
export type { Spacing, SpacingKey } from './spacing';
export type { Typography, TextStyleKey } from './typography';
export type { Shadows, ShadowKey } from './shadows';

export const borderRadius = {
  none: 0,
  xs: 2,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 24,
  full: 9999,
} as const;

export type BorderRadius = typeof borderRadius;
export type BorderRadiusKey = keyof typeof borderRadius;

export const theme = {
  colors: require('./colors').colors,
  spacing: require('./spacing').spacing,
  typography: require('./typography').typography,
  shadows: require('./shadows').shadows,
  borderRadius,
} as const;

export type Theme = typeof theme;