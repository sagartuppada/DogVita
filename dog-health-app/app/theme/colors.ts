/**
 * DogVita Color Palette
 * Warm, premium pet wellness aesthetic
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
    primary: '#F5EAD3',
    secondary: '#EDE3CC',
    card: '#FBF5E8',
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

export const darkColors = {
  primary: {
    DEFAULT: '#F3A93B',
    dark: '#E2941C',
    light: '#F5C46B',
    50: '#2D2009',
    100: '#3D2A0D',
    200: '#5C4215',
    300: '#7A581D',
    400: '#F3A93B',
    500: '#E2941C',
    600: '#C47E15',
    700: '#A06610',
    800: '#7D4E0C',
    900: '#5A3808',
  },

  secondary: {
    DEFAULT: '#8A7F75',
    light: '#A99F93',
    dark: '#4D4540',
  },

  status: {
    success: '#66BB6A',
    warning: '#FFA726',
    error: '#EF5350',
    info: '#64B5F6',
  },

  health: {
    heartRate: '#EF5350',
    temperature: '#FFA726',
    activity: '#66BB6A',
    sleep: '#9575CD',
    battery: '#66BB6A',
    gps: '#64B5F6',
  },

  background: {
    primary: '#121212',
    secondary: '#1E1E1E',
    card: '#252525',
    elevated: '#2D2D2D',
    modal: '#2D2D2D',
    overlay: 'rgba(0, 0, 0, 0.7)',
  },

  text: {
    primary: '#F0E8D8',
    secondary: '#A99F93',
    tertiary: '#6B625A',
    inverse: '#1F1A17',
    link: '#F3A93B',
  },

  border: {
    DEFAULT: '#3D3D3D',
    light: '#2D2D2D',
    focused: '#F3A93B',
    error: '#EF5350',
  },

  ble: {
    connected: '#66BB6A',
    connecting: '#FFA726',
    disconnected: '#6B625A',
    error: '#EF5350',
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
