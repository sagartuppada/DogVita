/**
 * DogVita Shadow System
 * Subtle brown-tinted shadows for premium pet-wellness feel
 * Uses cocoa brown (#3D322A) tint instead of pure black
 */

import { ViewStyle } from 'react-native';

const shadowColor = '#3D322A';

export const shadows = {
  none: {},

  /** Subtle lift — cards at rest */
  sm: {
    shadowColor,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  } as ViewStyle,

  /** Card default — warm ivory shadow */
  card: {
    shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  } as ViewStyle,

  /** Elevated card — hover/active state */
  md: {
    shadowColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 12,
    elevation: 4,
  } as ViewStyle,

  /** Large elevation — modals, FABs */
  lg: {
    shadowColor,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 20,
    elevation: 8,
  } as ViewStyle,

  /** Maximum elevation — floating elements */
  xl: {
    shadowColor,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 28,
    elevation: 12,
  } as ViewStyle,

  /** Bottom tab bar — floating pill look */
  tabBar: {
    shadowColor,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.10,
    shadowRadius: 16,
    elevation: 8,
  } as ViewStyle,

  /** Button press */
  button: {
    shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  } as ViewStyle,

  /** FAB */
  fab: {
    shadowColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 6,
  } as ViewStyle,

  /** Input focus ring — honey-orange glow */
  inputFocus: {
    shadowColor: '#F3A93B',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.20,
    shadowRadius: 8,
    elevation: 2,
  } as ViewStyle,
} as const;

export type Shadows = typeof shadows;
