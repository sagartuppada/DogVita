/**
 * DeviceCard - BLE connection status card
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { colors, spacing, typography, borderRadius, shadows } from '../../theme';
import { StatusBadge } from '../common/StatusBadge';

interface DeviceCardProps {
  isConnected: boolean;
  deviceName: string | null;
  batteryLevel: number | null;
  signalStrength: number | null;
}

export const DeviceCard: React.FC<DeviceCardProps> = ({
  isConnected,
  deviceName,
  batteryLevel,
  signalStrength,
}) => {
  const getBatteryColor = () => {
    if (batteryLevel === null) return colors.text.tertiary;
    if (batteryLevel > 60) return colors.status.success;
    if (batteryLevel > 20) return colors.status.warning;
    return colors.status.error;
  };

  const getBatteryIcon = () => {
    if (batteryLevel === null) return 'battery-unknown';
    if (batteryLevel > 80) return 'battery-full';
    if (batteryLevel > 60) return 'battery-three-quarters';
    if (batteryLevel > 40) return 'battery-half';
    if (batteryLevel > 20) return 'battery-quarter';
    return 'battery-dead';
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.statusRow}>
          <View style={styles.statusDot}>
            <View
              style={[
                styles.dot,
                { backgroundColor: isConnected ? colors.status.success : colors.text.tertiary },
              ]}
            />
          </View>
          <Text style={styles.deviceName}>{deviceName || 'No device'}</Text>
        </View>
        <StatusBadge
          label={isConnected ? 'Connected' : 'Disconnected'}
          variant={isConnected ? 'success' : 'default'}
          size="sm"
          dot
        />
      </View>

      <View style={styles.metricsRow}>
        <View style={styles.metric}>
          <Ionicons
            name={getBatteryIcon()}
            size={18}
            color={getBatteryColor()}
          />
          <Text style={styles.metricValue}>{batteryLevel ?? '--'}%</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.metric}>
          <Ionicons name="cellular" size={16} color={colors.text.secondary} />
          <Text style={styles.metricValue}>{signalStrength ?? '--'} dBm</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.xxl,
    padding: spacing.xl,
    ...shadows.card,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    marginRight: spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  deviceName: {
    ...typography.styles.bodyMD,
    color: colors.text.primary,
    fontWeight: '600',
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  metric: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  metricValue: {
    ...typography.styles.bodySM,
    color: colors.text.secondary,
    marginLeft: spacing.xs,
    fontWeight: '500',
  },
  divider: {
    width: 1,
    height: 20,
    backgroundColor: colors.border.light,
    marginHorizontal: spacing.md,
  },
});

export default DeviceCard;
