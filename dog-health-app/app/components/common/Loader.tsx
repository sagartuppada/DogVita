/**
 * Loader - Loading indicator component
 */

import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { colors, spacing, typography } from '../../theme';

interface LoaderProps {
  size?: 'small' | 'large';
  color?: string;
  message?: string;
  fullScreen?: boolean;
}

export const Loader: React.FC<LoaderProps> = ({
  size = 'large',
  color = colors.primary[600],
  message,
  fullScreen = false,
}) => {
  const content = (
    <View style={styles.content}>
      <ActivityIndicator size={size} color={color} />
      {message && <Text style={styles.message}>{message}</Text>}
    </View>
  );

  if (fullScreen) {
    return <View style={styles.fullScreen}>{content}</View>;
  }

  return content;
};

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
  },
  content: {
    alignItems: 'center',
  },
  message: {
    ...typography.styles.bodyMedium,
    color: colors.text.secondary,
    marginTop: spacing.md,
  },
});

export default Loader;