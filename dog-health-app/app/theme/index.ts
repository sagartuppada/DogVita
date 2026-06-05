/**
 * DogVita Theme
 * Central theme configuration
 */

import { colors } from './colors';
import { spacing } from './spacing';
import { typography } from './typography';
import { shadows } from './shadows';

export { colors } from './colors';
export { spacing } from './spacing';
export { typography } from './typography';
export { shadows } from './shadows';

export type { Colors } from './colors';
export type { Spacing } from './spacing';
export type { Typography } from './typography';
export type { Shadows } from './shadows';

export const borderRadius = {
  none: 0,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 28,
  pill: 999,
  full: 9999,
} as const;

export type BorderRadius = typeof borderRadius;

export const theme = {
  colors,
  spacing,
  typography,
  shadows,
  borderRadius,
} as const;

export type Theme = typeof theme;
