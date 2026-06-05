/**
 * Button - Premium pill-shaped button
 */

import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  View,
} from 'react-native';
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
  fullWidth?: boolean;
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
  fullWidth = true,
}) => {
  const getContainerStyle = (): ViewStyle => {
    if (disabled) {
      return { backgroundColor: colors.border.light, opacity: 0.6 };
    }
    switch (variant) {
      case 'primary':
        return { backgroundColor: colors.primary.DEFAULT, ...shadows.button };
      case 'secondary':
        return { backgroundColor: colors.background.card, ...shadows.sm };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          borderWidth: 1.5,
          borderColor: colors.border.DEFAULT,
        };
      case 'ghost':
        return { backgroundColor: 'transparent' };
      default:
        return { backgroundColor: colors.primary.DEFAULT, ...shadows.button };
    }
  };

  const getTextColor = (): string => {
    if (disabled) return colors.text.tertiary;
    switch (variant) {
      case 'primary':
        return colors.white;
      case 'secondary':
        return colors.text.primary;
      case 'outline':
        return colors.text.primary;
      case 'ghost':
        return colors.primary.dark;
      default:
        return colors.white;
    }
  };

  const getPadding = (): ViewStyle => {
    switch (size) {
      case 'sm':
        return { paddingVertical: 10, paddingHorizontal: spacing.lg };
      case 'md':
        return { paddingVertical: 14, paddingHorizontal: spacing.xl };
      case 'lg':
        return { paddingVertical: 18, paddingHorizontal: spacing.xxl };
      default:
        return { paddingVertical: 14, paddingHorizontal: spacing.xl };
    }
  };

  const getTextStyle = (): TextStyle => {
    switch (size) {
      case 'sm':
        return typography.styles.buttonSM;
      case 'md':
        return typography.styles.buttonMD;
      case 'lg':
        return typography.styles.buttonLG;
      default:
        return typography.styles.buttonMD;
    }
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.75}
      style={[
        styles.container,
        getContainerStyle(),
        getPadding(),
        fullWidth && styles.fullWidth,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} size="small" />
      ) : (
        <View style={styles.content}>
          {icon && <View style={styles.iconWrapper}>{icon}</View>}
          <Text style={[styles.text, { color: getTextColor() }, getTextStyle(), textStyle]}>
            {title}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: borderRadius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  fullWidth: {
    width: '100%',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapper: {
    marginRight: spacing.sm,
  },
  text: {
    textAlign: 'center',
  },
});

export default Button;
