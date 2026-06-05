/**
 * StatusBadge - Pill-shaped status indicator
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

const variantColors: Record<BadgeVariant, string> = {
  success: colors.status.success,
  warning: colors.status.warning,
  error: colors.status.error,
  info: colors.status.info,
  default: colors.text.tertiary,
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  label,
  variant = 'default',
  size = 'md',
  dot = false,
}) => {
  const color = variantColors[variant];

  const sizeConfig = {
    sm: { py: 3, px: 8, fontSize: 11, dotSize: 5 },
    md: { py: 4, px: 10, fontSize: 12, dotSize: 6 },
    lg: { py: 6, px: 14, fontSize: 13, dotSize: 7 },
  }[size];

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: color + '18',
          paddingVertical: sizeConfig.py,
          paddingHorizontal: sizeConfig.px,
        },
      ]}
    >
      {dot && (
        <View
          style={[
            styles.dot,
            {
              width: sizeConfig.dotSize,
              height: sizeConfig.dotSize,
              borderRadius: sizeConfig.dotSize / 2,
              backgroundColor: color,
            },
          ]}
        />
      )}
      <Text style={[styles.text, { color, fontSize: sizeConfig.fontSize }]}>
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.pill,
    alignSelf: 'flex-start',
  },
  dot: {
    marginRight: spacing.xs,
  },
  text: {
    fontWeight: '600',
  },
});

export default StatusBadge;
