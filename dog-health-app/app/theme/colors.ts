/**
 * DogVita Color Palette
 * Premium pet-wellness aesthetic
 * Warm cream backgrounds, soft ivory cards, honey-orange accents, cocoa text
 */

export const lightColors = {
  primary: {
    DEFAULT: '#F3A93B',
    dark: '#E2941C',
    light: '#F5C46B',
    50: '#FDF6E8',
    100: '#FAECC8',
    200: '#F5D88E',
    300: '#F3C45A',
    400: '#F3A93B',
    500: '#E2941C',
    600: '#C47E15',
    700: '#A06610',
    800: '#7D4E0C',
    900: '#5A3808',
  },

  secondary: {
    DEFAULT: '#6B625A',
    light: '#8A7F75',
    dark: '#4D4540',
  },

  status: {
    success: '#4CAF50',
    warning: '#FF9800',
    error: '#F44336',
    info: '#5B9BD5',
  },

  health: {
    heartRate: '#F44336',
    temperature: '#FF9800',
    activity: '#4CAF50',
    sleep: '#7E57C2',
    battery: '#4CAF50',
    gps: '#5B9BD5',
  },

  background: {
    primary: '#F5E9CD',
    secondary: '#EDE2C6',
    card: '#FBF4E4',
    elevated: '#FFFFFF',
    modal: '#FFFFFF',
    overlay: 'rgba(31, 26, 23, 0.5)',
  },

  text: {
    primary: '#1F1A17',
    secondary: '#6B625A',
    tertiary: '#A39888',
    inverse: '#FFFFFF',
    link: '#E2941C',
  },

  border: {
    DEFAULT: '#E9DDC9',
    light: '#F0E8D8',
    focused: '#F3A93B',
    error: '#F44336',
  },

  ble: {
    connected: '#4CAF50',
    connecting: '#FF9800',
    disconnected: '#A39888',
    error: '#F44336',
  },

  white: '#FFFFFF',
  black: '#1F1A17',
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
