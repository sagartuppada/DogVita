/**
 * Button - Reusable button component
 */

import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle, View } from 'react-native';
import { colors, spacing, typography, borderRadius, shadows } from '../../theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon,
  style,
  textStyle,
}) => {
  const getBackgroundColor = () => {
    if (disabled) return colors.neutral[300];
    switch (variant) {
      case 'primary': return colors.primary[600];
      case 'secondary': return colors.secondary[600];
      case 'outline': return 'transparent';
      case 'ghost': return 'transparent';
      default: return colors.primary[600];
    }
  };

  const getTextColor = () => {
    if (disabled) return colors.neutral[500];
    switch (variant) {
      case 'primary': return colors.text.inverse;
      case 'secondary': return colors.text.inverse;
      case 'outline': return colors.primary[600];
      case 'ghost': return colors.primary[600];
      default: return colors.text.inverse;
    }
  };

  const getPadding = () => {
    switch (size) {
      case 'sm': return { paddingVertical: spacing.sm, paddingHorizontal: spacing.md };
      case 'md': return { paddingVertical: spacing.md, paddingHorizontal: spacing.lg };
      case 'lg': return { paddingVertical: spacing.lg, paddingHorizontal: spacing.xxl };
      default: return { paddingVertical: spacing.md, paddingHorizontal: spacing.lg };
    }
  };

  const getFontSize = () => {
    switch (size) {
      case 'sm': return typography.fontSize.sm;
      case 'md': return typography.fontSize.md;
      case 'lg': return typography.fontSize.lg;
      default: return typography.fontSize.md;
    }
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      style={[
        styles.button,
        { backgroundColor: getBackgroundColor() },
        getPadding(),
        variant === 'outline' && styles.outline,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} size="small" />
      ) : (
        <View style={styles.content}>
          {icon && <View style={styles.icon}>{icon}</View>}
          <Text style={[styles.text, { color: getTextColor(), fontSize: getFontSize() }, textStyle]}>
            {title}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    ...shadows.button,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: spacing.sm,
  },
  text: {
    fontWeight: '600',
    textAlign: 'center',
  },
  outline: {
    borderWidth: 2,
    borderColor: colors.primary[600],
    ...shadows.none,
  },
});

export default Button;