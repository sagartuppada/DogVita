/**
 * StatusBadge - Shows status indicator
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, typography, borderRadius } from '../../theme';

type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'default';
type BadgeSize = 'sm' | 'md' | 'lg';

interface StatusBadgeProps {
  label: string;
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  label,
  variant = 'default',
  size = 'md',
  dot = false,
}) => {
  const getVariantColor = () => {
    switch (variant) {
      case 'success': return colors.status.success;
      case 'warning': return colors.status.warning;
      case 'error': return colors.status.error;
      case 'info': return colors.status.info;
      default: return colors.neutral[500];
    }
  };

  const getSize = () => {
    switch (size) {
      case 'sm': return { paddingVertical: 2, paddingHorizontal: 6, fontSize: 10 };
      case 'md': return { paddingVertical: 4, paddingHorizontal: 8, fontSize: 12 };
      case 'lg': return { paddingVertical: 6, paddingHorizontal: 12, fontSize: 14 };
    }
  };

  const sizeStyle = getSize();
  const color = getVariantColor();

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: color + '20',
          paddingVertical: sizeStyle.paddingVertical,
          paddingHorizontal: sizeStyle.paddingHorizontal,
        },
      ]}
    >
      {dot && <View style={[styles.dot, { backgroundColor: color }]} />}
      <Text style={[styles.text, { color, fontSize: sizeStyle.fontSize }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.full,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: spacing.xs,
  },
  text: {
    fontWeight: '600',
  },
});

export default StatusBadge;