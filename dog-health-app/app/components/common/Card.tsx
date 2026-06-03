/**
 * Card - Reusable card component
 */

import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { colors, spacing, borderRadius, shadows } from '../../theme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'default' | 'elevated' | 'outlined';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  variant = 'default',
  padding = 'md',
}) => {
  const getPadding = () => {
    switch (padding) {
      case 'none': return 0;
      case 'sm': return spacing.sm;
      case 'md': return spacing.md;
      case 'lg': return spacing.lg;
      default: return spacing.md;
    }
  };

  const getVariantStyle = () => {
    switch (variant) {
      case 'elevated': return { ...styles.elevated, padding: getPadding() };
      case 'outlined': return { ...styles.outlined, padding: getPadding() };
      default: return { ...styles.default, padding: getPadding() };
    }
  };

  return <View style={[styles.card, getVariantStyle(), style]}>{children}</View>;
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.lg,
  },
  default: {
    ...shadows.card,
  },
  elevated: {
    ...shadows.lg,
  },
  outlined: {
    borderWidth: 1,
    borderColor: colors.border.default,
  },
});

export default Card;