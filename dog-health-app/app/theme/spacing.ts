/**
 * Spacing system for consistent layout
 * Based on a 4px grid system
 */

export const spacing = {
  // Base spacing values (4px grid)
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,

  // Specific spacing for common use cases
  page: 16,
  card: 16,
  section: 24,
  screenPadding: 16,

  // Component-specific spacing
  buttonPadding: {
    sm: 8,
    md: 12,
    lg: 16,
  },
  inputPadding: {
    horizontal: 16,
    vertical: 12,
  },
  listItemPadding: {
    horizontal: 16,
    vertical: 12,
  },

  // Gap values for flex/grid
  gap: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
  },
} as const;

export type Spacing = typeof spacing;
export type SpacingKey = keyof typeof spacing;