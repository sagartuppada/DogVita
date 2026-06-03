/**
 * Color palette for the Dog Health App
 * Organized by semantic usage
 */

export const colors = {
  // Primary colors
  primary: {
    50: '#ecfdf5',
    100: '#d1fae5',
    200: '#a7f3d0',
    300: '#6ee7b7',
    400: '#34d399',
    500: '#10b981',
    600: '#059669',
    700: '#047857',
    800: '#065f46',
    900: '#064e3b',
  },

  // Secondary colors
  secondary: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    200: '#bae6fd',
    300: '#7dd3fc',
    400: '#38bdf8',
    500: '#0ea5e9',
    600: '#0284c7',
    700: '#0369a1',
    800: '#075985',
    900: '#0c4a6e',
  },

  // Accent colors
  accent: {
    50: '#fdf4ff',
    100: '#fae8ff',
    200: '#f5d0fe',
    300: '#f0abfc',
    400: '#e879f9',
    500: '#d946ef',
    600: '#c026d3',
    700: '#a21caf',
    800: '#86198f',
    900: '#701a75',
  },

  // Status colors
  status: {
    success: '#22c55e',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
  },

  // Health metric colors
  health: {
    heartRate: '#ef4444',
    temperature: '#f97316',
    activity: '#22c55e',
    sleep: '#6366f1',
    battery: '#eab308',
    gps: '#3b82f6',
  },

  // Neutral colors
  neutral: {
    50: '#fafafa',
    100: '#f4f4f5',
    200: '#e4e4e7',
    300: '#d4d4d8',
    400: '#a1a1aa',
    500: '#71717a',
    600: '#52525b',
    700: '#3f3f46',
    800: '#27272a',
    900: '#18181b',
  },

  // Background colors
  background: {
    primary: '#ffffff',
    secondary: '#f4f4f5',
    card: '#ffffff',
    modal: '#ffffff',
  },

  // Text colors
  text: {
    primary: '#18181b',
    secondary: '#52525b',
    tertiary: '#a1a1aa',
    inverse: '#ffffff',
  },

  // Border colors
  border: {
    default: '#e4e4e7',
    focused: '#10b981',
    error: '#ef4444',
  },

  // BLE connection status colors
  ble: {
    connected: '#22c55e',
    connecting: '#f59e0b',
    disconnected: '#71717a',
    error: '#ef4444',
  },
} as const;

export type Colors = typeof colors;
export type PrimaryColor = keyof typeof colors.primary;
export type SecondaryColor = keyof typeof colors.secondary;
export type HealthColor = keyof typeof colors.health;