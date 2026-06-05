/**
 * DogVita Spacing System
 * Consistent spacing scale based on 4px grid
 */

export const spacing = {
  /** 4px */
  xs: 4,
  /** 8px */
  sm: 8,
  /** 12px */
  md: 12,
  /** 16px */
  lg: 16,
  /** 20px */
  xl: 20,
  /** 24px */
  xxl: 24,
  /** 32px */
  xxxl: 32,
  /** 40px */
  huge: 40,
  /** 48px */
  massive: 48,
  /** 64px */
  giant: 64,

  page: 20,
  card: 20,
  section: 24,
  screenPadding: 20,

  buttonPadding: {
    sm: 12,
    md: 16,
    lg: 20,
  },

  inputPadding: {
    horizontal: 16,
    vertical: 16,
  },

  gap: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
  },
} as const;

export type Spacing = typeof spacing;
