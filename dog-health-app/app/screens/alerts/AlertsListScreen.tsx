/**
 * AlertsListScreen - Alert history list
 */

import React, { useMemo, useEffect, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useAlertStore } from '../../store/alertStore';
import { Card, EmptyState } from '../../components/common';
import { spacing, typography, borderRadius, shadows } from '../../theme';
import type { ChatScreenProps } from '../../navigation/types';

const getAlertIcon = (type: string) => {
  switch (type) {
    case 'heart_rate':
    case 'heart_rate_high':
    case 'heart_rate_low':
      return 'heart';
    case 'temperature':
    case 'temperature_high':
    case 'temperature_low':
      return 'thermometer';
    case 'battery':
    case 'battery_low':
      return 'battery-half';
    case 'connection':
    case 'device_disconnect':
      return 'bluetooth';
    case 'geofence_enter':
    case 'geofence_exit':
      return 'location';
    case 'activity_abnormal':
      return 'walk';
    case 'sleep_disruption':
      return 'moon';
    default:
      return 'warning';
  }
};

const getAlertTitle = (type: string) => {
  switch (type) {
    case 'heart_rate_high': return 'High Heart Rate';
    case 'heart_rate_low': return 'Low Heart Rate';
    case 'temperature_high': return 'High Temperature';
    case 'temperature_low': return 'Low Temperature';
    case 'battery_low': return 'Low Battery';
    case 'device_disconnect': return 'Device Disconnected';
    case 'geofence_enter': return 'Geofence Entered';
    case 'geofence_exit': return 'Geofence Exited';
    case 'activity_abnormal': return 'Unusual Activity';
    case 'sleep_disruption': return 'Sleep Disruption';
    default: return 'Alert';
  }
};

const getAlertColor = (severity: string) => {
  switch (severity) {
    case 'critical': return '#F44336';
    case 'warning': return '#FF9800';
    default: return '#5B9BD5';
  }
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5E9CD' },
  header: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 20 },
  title: { ...typography.styles.headingXL, color: '#1F1A17' },
  subtitle: { ...typography.styles.bodySM, color: '#A39888', marginTop: 2 },
  list: { paddingHorizontal: 16 },
  alertCard: { marginBottom: 12 },
  alertRow: { flexDirection: 'row', alignItems: 'flex-start' },
  alertIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  alertContent: { flex: 1 },
  alertTitle: { ...typography.styles.bodyMD, color: '#1F1A17', fontWeight: '600', marginBottom: 2 },
  alertMessage: { ...typography.styles.bodySM, color: '#6B625A', marginBottom: 4 },
  alertTime: { ...typography.styles.caption, color: '#A39888' },
  unreadDot: { width: 8, height: 8, borderRadius: 4, marginTop: 8, marginLeft: 8 },
});

export default function AlertsListScreen({}: ChatScreenProps) {
  const insets = useSafeAreaInsets();
  const alerts = useAlertStore((s) => s.alerts);
  const fetchAlerts = useAlertStore((s) => s.fetchAlerts);

  useEffect(() => { fetchAlerts(); }, [fetchAlerts]);

  const [refreshing, setRefreshing] = React.useState(false);
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchAlerts().finally(() => setRefreshing(false));
  }, [fetchAlerts]);

  const sortedAlerts = useMemo(
    () => [...alerts].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
    [alerts],
  );

  const renderAlert = ({ item }: { item: any }) => {
    const color = getAlertColor(item.severity);
    return (
      <Card variant="default" padding="md" style={styles.alertCard}>
        <View style={styles.alertRow}>
          <View style={[styles.alertIcon, { backgroundColor: color + '18' }]}>
            <Ionicons name={getAlertIcon(item.type)} size={18} color={color} />
          </View>
          <View style={styles.alertContent}>
            <Text style={styles.alertTitle}>{getAlertTitle(item.type)}</Text>
            <Text style={styles.alertMessage}>{item.message}</Text>
            <Text style={styles.alertTime}>
              {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
          {!item.acknowledged && (
            <View style={[styles.unreadDot, { backgroundColor: color }]} />
          )}
        </View>
      </Card>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Alerts</Text>
        <Text style={styles.subtitle}>{alerts.length} total</Text>
      </View>

      <FlatList
        data={sortedAlerts}
        keyExtractor={(item) => item.id}
        renderItem={renderAlert}
        contentContainerStyle={[styles.list, { paddingBottom: 100 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#F3A93B" />}
        ListEmptyComponent={
          <EmptyState
            icon="notifications-off-outline"
            title="No Alerts"
            message="You're all caught up! Alerts will appear here."
          />
        }
      />
    </View>
  );
}
