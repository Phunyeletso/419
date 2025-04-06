/**
 * Colors used throughout the Ludo game application
 */
export const Colors = {
  // Player colors
  red: '#d5151d',
  green: '#00a049',
  blue: '#28aeff',
  yellow: '#ffde17',
  
  // UI theme colors
  primary: '#1E5162',
  secondary: '#4f6e82',
  accent: '#f0ce2c',
  background: '#121212',
  surface: '#1e1e1e',
  error: '#cf6679',

  // Text colors
  textPrimary: '#ffffff',
  textSecondary: '#b3b3b3',
  textDisabled: '#636363',

  // Border colors
  borderPrimary: '#4f6e82',
  borderSecondary: '#303030',
  
  // Status colors
  success: '#4caf50',
  warning: '#ff9800',
  info: '#2196f3',
  
  // Game-specific colors
  safeSpot: '#cce5ff',
  homeBase: '#3c3c3c',
};

/**
 * Theme object for consistent styling throughout the app
 */
export const Theme = {
  dark: {
    background: Colors.background,
    surface: Colors.surface,
    text: Colors.textPrimary,
    textSecondary: Colors.textSecondary,
    primary: Colors.primary,
    accent: Colors.accent,
  },
  light: {
    background: '#f5f5f5',
    surface: '#ffffff',
    text: '#212121',
    textSecondary: '#757575',
    primary: Colors.primary,
    accent: Colors.accent,
  },
  shadows: {
    small: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.18,
      shadowRadius: 1.0,
      elevation: 1,
    },
    medium: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 3,
    },
    large: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 4.65,
      elevation: 8,
    },
  },
  spacing: {
    xs: 4,
    s: 8,
    m: 16,
    l: 24,
    xl: 32,
    xxl: 48,
  },
  borderRadius: {
    small: 4,
    medium: 8,
    large: 16,
    round: 999,
  }
};
