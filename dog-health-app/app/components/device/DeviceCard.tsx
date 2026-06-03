/**
 * DeviceCard - Shows connected device status
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Card, StatusBadge } from '../../components/common';
import { colors, spacing, typography } from '../../theme';

interface DeviceCardProps {
  deviceName: string | null;
  isConnected: boolean;
  batteryLevel?: number;
  signalStrength?: number;
  onPress?: () => void;
}

export const DeviceCard: React.FC<DeviceCardProps> = ({
  deviceName,
  isConnected,
  batteryLevel,
  signalStrength,
  onPress,
}) => {
  const getBatteryIcon = () => {
    if (batteryLevel === undefined) return 'battery-full';
    if (batteryLevel < 20) return 'battery-dead';
    if (batteryLevel < 50) return 'battery-half';
    return 'battery-full';
  };

  const getBatteryColor = () => {
    if (batteryLevel === undefined) return colors.text.secondary;
    if (batteryLevel < 20) return colors.status.error;
    if (batteryLevel < 50) return colors.status.warning;
    return colors.status.success;
  };

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <Card variant="elevated">
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Ionicons name="bluetooth" size={24} color={isConnected ? colors.ble.connected : colors.ble.disconnected} />
          </View>
          <View style={styles.info}>
            <Text style={styles.title}>{deviceName || 'No Device'}</Text>
            <StatusBadge
              label={isConnected ? 'Connected' : 'Disconnected'}
              variant={isConnected ? 'success' : 'default'}
              size="sm"
              dot
            />
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.text.tertiary} />
        </View>
        {isConnected && (
          <View style={styles.stats}>
            {batteryLevel !== undefined && (
              <View style={styles.stat}>
                <Ionicons name={getBatteryIcon()} size={20} color={getBatteryColor()} />
                <Text style={[styles.statText, { color: getBatteryColor() }]}>{batteryLevel}%</Text>
              </View>
            )}
            {signalStrength !== undefined && (
              <View style={styles.stat}>
                <Ionicons name="wifi" size={20} color={colors.text.secondary} />
                <Text style={styles.statText}>{signalStrength}%</Text>
              </View>
            )}
          </View>
        )}
      </Card>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.background.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  info: {
    flex: 1,
  },
  title: {
    ...typography.styles.titleMedium,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  stats: {
    flexDirection: 'row',
    gap: spacing.xl,
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border.default,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  statText: {
    ...typography.styles.bodyMedium,
    color: colors.text.secondary,
  },
});

export default DeviceCard;