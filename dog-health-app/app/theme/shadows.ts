/**
 * DogVita Shadow System
 * Soft, warm shadows for premium feel
 */

import { ViewStyle } from 'react-native';

const shadowColor = '#1F1A17';

export const shadows = {
  none: {},

  /** Subtle lift — cards at rest */
  sm: {
    shadowColor,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  } as ViewStyle,

  /** Card default — soft warm shadow */
  card: {
    shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  } as ViewStyle,

  /** Elevated card — hover/active state */
  md: {
    shadowColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  } as ViewStyle,

  /** Large elevation — modals, FABs */
  lg: {
    shadowColor,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 8,
  } as ViewStyle,

  /** Maximum elevation — floating elements */
  xl: {
    shadowColor,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 28,
    elevation: 12,
  } as ViewStyle,

  /** Bottom tab bar — floating look */
  tabBar: {
    shadowColor,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 8,
  } as ViewStyle,

  /** Button press */
  button: {
    shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  } as ViewStyle,

  /** FAB */
  fab: {
    shadowColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  } as ViewStyle,

  /** Input focus ring */
  inputFocus: {
    shadowColor: '#F3A93B',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 2,
  } as ViewStyle,
} as const;

export type Shadows = typeof shadows;
