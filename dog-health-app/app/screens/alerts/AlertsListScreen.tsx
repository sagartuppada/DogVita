/**
 * AlertsListScreen - List of health alerts
 */

import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Card, StatusBadge } from '../../components/common';
import { colors, spacing, typography } from '../../theme';
import { useAlerts } from '../../hooks';
import { HealthAlert } from '../../types';

export const AlertsListScreen: React.FC = () => {
  const { alerts, acknowledgeAlert, unacknowledgedCount } = useAlerts();

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'heart_rate_high':
      case 'heart_rate_low':
        return 'heart';
      case 'temperature_high':
      case 'temperature_low':
        return 'thermometer';
      case 'battery_low':
        return 'battery';
      case 'geofence_enter':
      case 'geofence_exit':
        return 'location';
      default:
        return 'warning';
    }
  };

  const getAlertColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return colors.status.error;
      case 'warning':
        return colors.status.warning;
      default:
        return colors.status.info;
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const renderAlert = ({ item }: { item: HealthAlert }) => (
    <TouchableOpacity onPress={() => !item.acknowledged && acknowledgeAlert(item.id)}>
      <Card style={[styles.alertCard, !item.acknowledged && styles.unreadAlert]}>
        <View style={styles.alertRow}>
          <View style={[styles.alertIcon, { backgroundColor: getAlertColor(item.severity) + '20' }]}>
            <Ionicons
              name={getAlertIcon(item.type) as keyof typeof Ionicons.glyphMap}
              size={20}
              color={getAlertColor(item.severity)}
            />
          </View>
          <View style={styles.alertContent}>
            <View style={styles.alertHeader}>
              <Text style={styles.alertMessage}>{item.message}</Text>
              {!item.acknowledged && <View style={styles.unreadDot} />}
            </View>
            <View style={styles.alertMeta}>
              <Text style={styles.alertTime}>{formatDate(item.timestamp)} {formatTime(item.timestamp)}</Text>
              <StatusBadge
                label={item.severity}
                variant={item.severity === 'critical' ? 'error' : item.severity === 'warning' ? 'warning' : 'info'}
                size="sm"
              />
            </View>
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Alerts</Text>
        {unacknowledgedCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{unacknowledgedCount}</Text>
          </View>
        )}
      </View>
      <FlatList
        data={alerts}
        keyExtractor={(item) => item.id}
        renderItem={renderAlert}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="checkmark-circle" size={64} color={colors.status.success} />
            <Text style={styles.emptyTitle}>All Clear!</Text>
            <Text style={styles.emptySubtitle}>No alerts at the moment</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.page,
    backgroundColor: colors.background.primary,
  },
  title: {
    ...typography.styles.displaySmall,
    color: colors.text.primary,
  },
  badge: {
    backgroundColor: colors.status.error,
    borderRadius: 12,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  badgeText: {
    ...typography.styles.labelSmall,
    color: colors.text.inverse,
  },
  list: {
    padding: spacing.page,
    gap: spacing.sm,
  },
  alertCard: {
    padding: spacing.md,
  },
  unreadAlert: {
    borderLeftWidth: 4,
    borderLeftColor: colors.status.error,
  },
  alertRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  alertIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertContent: {
    flex: 1,
    gap: spacing.xs,
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  alertMessage: {
    ...typography.styles.bodyMedium,
    color: colors.text.primary,
    flex: 1,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.status.error,
    marginLeft: spacing.sm,
  },
  alertMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  alertTime: {
    ...typography.styles.caption,
    color: colors.text.tertiary,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xxxl * 2,
    gap: spacing.md,
  },
  emptyTitle: {
    ...typography.styles.titleLarge,
    color: colors.text.primary,
  },
  emptySubtitle: {
    ...typography.styles.bodyMedium,
    color: colors.text.secondary,
  },
});

export default AlertsListScreen;