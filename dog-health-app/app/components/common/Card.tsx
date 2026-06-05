/**
 * Card - Premium card with soft shadow
 */

import React from 'react';
import { View, StyleSheet, ViewStyle, TouchableOpacity } from 'react-native';
import { colors, spacing, borderRadius, shadows } from '../../theme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'default' | 'elevated' | 'outlined' | 'filled';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  onPress?: () => void;
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  variant = 'default',
  padding = 'md',
  onPress,
}) => {
  const getPadding = (): number => {
    switch (padding) {
      case 'none':
        return 0;
      case 'sm':
        return spacing.md;
      case 'md':
        return spacing.xl;
      case 'lg':
        return spacing.xxl;
      default:
        return spacing.xl;
    }
  };

  const getVariantStyle = (): ViewStyle => {
    switch (variant) {
      case 'elevated':
        return { ...styles.elevated, padding: getPadding() };
      case 'outlined':
        return { ...styles.outlined, padding: getPadding() };
      case 'filled':
        return { ...styles.filled, padding: getPadding() };
      default:
        return { ...styles.default, padding: getPadding() };
    }
  };

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.75}
        style={[styles.card, getVariantStyle(), style]}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={[styles.card, getVariantStyle(), style]}>{children}</View>;
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.xxl,
  },
  default: {
    ...shadows.card,
  },
  elevated: {
    ...shadows.lg,
  },
  outlined: {
    borderWidth: 1,
    borderColor: colors.border.light,
    backgroundColor: colors.white,
  },
  filled: {
    backgroundColor: colors.background.secondary,
  },
});

export default Card;
