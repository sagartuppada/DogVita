/**
 * DogVita Color Palette
 * Clean & minimal — white backgrounds, green primary, gray accents
 */

export const lightColors = {
  primary: {
    DEFAULT: '#16A34A',
    dark: '#15803D',
    light: '#22C55E',
    50: '#F0FDF4',
    100: '#DCFCE7',
    200: '#BBF7D0',
    300: '#86EFAC',
    400: '#4ADE80',
    500: '#22C55E',
    600: '#16A34A',
    700: '#15803D',
    800: '#166534',
    900: '#14532D',
  },

  secondary: {
    DEFAULT: '#6B7280',
    light: '#9CA3AF',
    dark: '#374151',
  },

  status: {
    success: '#22C55E',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
  },

  health: {
    heartRate: '#EF4444',
    temperature: '#F59E0B',
    activity: '#22C55E',
    sleep: '#8B5CF6',
    battery: '#22C55E',
    gps: '#3B82F6',
  },

  background: {
    primary: '#F9FAFB',
    secondary: '#F3F4F6',
    card: '#FFFFFF',
    elevated: '#FFFFFF',
    modal: '#FFFFFF',
    overlay: 'rgba(0, 0, 0, 0.5)',
  },

  text: {
    primary: '#111827',
    secondary: '#6B7280',
    tertiary: '#9CA3AF',
    inverse: '#FFFFFF',
    link: '#16A34A',
  },

  border: {
    DEFAULT: '#E5E7EB',
    light: '#F3F4F6',
    focused: '#16A34A',
    error: '#EF4444',
  },

  ble: {
    connected: '#22C55E',
    connecting: '#F59E0B',
    disconnected: '#9CA3AF',
    error: '#EF4444',
  },

  white: '#FFFFFF',
  black: '#111827',
} as const;

export const colors = lightColors as Colors;

export type Colors = {
  primary: Record<string, string>;
  secondary: Record<string, string>;
  status: Record<string, string>;
  health: Record<string, string>;
  background: Record<string, string>;
  text: Record<string, string>;
  border: Record<string, string>;
  ble: Record<string, string>;
  white: string;
  black: string;
};
