/**
 * Loader - Branded loading indicator
 */

import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { colors, spacing, typography } from '../../theme';

interface LoaderProps {
  text?: string;
  fullScreen?: boolean;
  size?: 'small' | 'large';
}

export const Loader: React.FC<LoaderProps> = ({
  text,
  fullScreen = true,
  size = 'large',
}) => {
  if (fullScreen) {
    return (
      <View style={styles.fullScreen}>
        <View style={styles.content}>
          <ActivityIndicator size={size} color={colors.primary.DEFAULT} />
          {text && <Text style={styles.text}>{text}</Text>}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.inline}>
      <ActivityIndicator size={size} color={colors.primary.DEFAULT} />
      {text && <Text style={styles.text}>{text}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
    backgroundColor: colors.background.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  content: {
    alignItems: 'center',
  },
  text: {
    ...typography.styles.bodySM,
    color: colors.text.secondary,
    marginTop: spacing.md,
  },
});

export default Loader;
