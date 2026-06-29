/**
 * DashboardScreen - Functional pet wellness dashboard
 * Shows snapshot alerts, quick log actions, upcoming events, device status
 */

import React, { useMemo, useEffect, useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useDogStore } from '../../store/dogStore';
import { useHealthStore } from '../../store/healthStore';
import { useBLEStore } from '../../store/bleStore';
import { useAlertStore } from '../../store/alertStore';
import { useTrackingStore } from '../../store/trackingStore';
import { StatusBadge, EmptyState } from '../../components/common';
import { spacing, typography, borderRadius, shadows, colors } from '../../theme';
import type { DashboardScreenProps } from '../../navigation/types';
import type { HealthAlert } from '../../types';

const QUICK_ACTIONS = [
  { id: 'walk', icon: 'footsteps', label: 'Walk', color: '#F3A93B' },
  { id: 'feeding', icon: 'restaurant', label: 'Feeding', color: '#F3A93B' },
  { id: 'remind', icon: 'notifications', label: 'Remind', color: '#F3A93B' },
  { id: 'vet', icon: 'medkit', label: 'Vet', color: '#F3A93B' },
] as const;

const ALERT_TYPE_LABELS: Record<string, string> = {
  heart_rate_high: 'Heart Rate Alert',
  heart_rate_low: 'Heart Rate Low',
  temperature_high: 'Temperature High',
  temperature_low: 'Temperature Low',
  battery_low: 'Battery Low',
  geofence_enter: 'Geofence Enter',
  geofence_exit: 'Geofence Exit',
  activity_abnormal: 'Abnormal Activity',
  sleep_disruption: 'Sleep Disruption',
  device_disconnect: 'Device Disconnected',
};

const ALERT_TYPE_ICONS: Record<string, string> = {
  heart_rate_high: 'heart',
  heart_rate_low: 'heart',
  temperature_high: 'thermometer',
  temperature_low: 'thermometer',
  battery_low: 'battery-half',
  geofence_enter: 'location',
  geofence_exit: 'location',
  activity_abnormal: 'footsteps',
  sleep_disruption: 'moon',
  device_disconnect: 'bluetooth',
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.primary },
  scrollContent: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 120 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  greeting: { ...typography.styles.bodySM, color: colors.text.secondary },
  headerName: { ...typography.styles.headingXL, color: colors.text.primary, marginTop: 2 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  notifButton: { padding: 8 },
  notifBadge: { position: 'absolute', top: 4, right: 4, width: 10, height: 10, borderRadius: 5, backgroundColor: colors.status.error },
  dogsRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 16, marginBottom: 24 },
  dogAvatar: { alignItems: 'center', width: 72 },
  avatarCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.background.card, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', ...shadows.sm },
  avatarImage: { width: 64, height: 64, borderRadius: 32 },
  avatarPlaceholder: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.background.card, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderStyle: 'dashed', borderColor: colors.border.DEFAULT },
  dogNameLabel: { ...typography.styles.caption, color: colors.text.primary, marginTop: 6, fontWeight: '500', textAlign: 'center' },
  addDogBtn: { alignItems: 'center', width: 72 },
  addIconCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.background.card, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderStyle: 'dashed', borderColor: colors.primary.DEFAULT },
  snapshotCard: { backgroundColor: colors.primary.DEFAULT, borderRadius: borderRadius.xxl, padding: 20, marginBottom: 24, ...shadows.md },
  snapshotLabel: { ...typography.styles.overline, color: '#FFFFFFCC', marginBottom: 8, letterSpacing: 1.5 },
  snapshotTitle: { fontSize: 22, fontWeight: '700', color: '#FFFFFF', marginBottom: 4 },
  snapshotDesc: { fontSize: 14, color: '#FFFFFFCC', marginBottom: 16, lineHeight: 20 },
  snapshotActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  markDoneBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: borderRadius.pill, paddingVertical: 10, paddingHorizontal: 20, gap: 8 },
  markDoneText: { fontSize: 15, fontWeight: '600', color: colors.primary.DEFAULT },
  allBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF22', borderRadius: borderRadius.pill, paddingVertical: 10, paddingHorizontal: 16, gap: 4 },
  allBtnText: { fontSize: 15, fontWeight: '600', color: '#FFFFFF' },
  noAlertCard: { backgroundColor: colors.background.card, borderRadius: borderRadius.xxl, padding: 20, marginBottom: 24, alignItems: 'center', ...shadows.sm },
  noAlertIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#4CAF5018', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  noAlertTitle: { fontSize: 16, fontWeight: '600', color: colors.text.primary, marginBottom: 4 },
  noAlertDesc: { fontSize: 13, color: colors.text.tertiary, textAlign: 'center' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.text.primary },
  seeAllLink: { fontSize: 14, fontWeight: '600', color: colors.primary.DEFAULT },
  quickLogRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 28 },
  quickLogItem: { alignItems: 'center', gap: 8 },
  quickLogIcon: { width: 56, height: 56, borderRadius: borderRadius.lg, backgroundColor: colors.background.card, alignItems: 'center', justifyContent: 'center', ...shadows.sm },
  quickLogLabel: { fontSize: 12, fontWeight: '500', color: colors.text.primary },
  upcomingItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.background.card, borderRadius: borderRadius.xl, padding: 16, marginBottom: 12, ...shadows.sm },
  upcomingIconWrap: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#F3A93B18', alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  upcomingInfo: { flex: 1 },
  upcomingTitle: { fontSize: 15, fontWeight: '600', color: colors.text.primary },
  upcomingSub: { fontSize: 13, color: colors.text.tertiary, marginTop: 2 },
  upcomingTag: { backgroundColor: '#F3A93B18', borderRadius: borderRadius.pill, paddingVertical: 4, paddingHorizontal: 10 },
  upcomingTagText: { fontSize: 12, fontWeight: '600', color: colors.primary.DEFAULT },
  deviceRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.background.card, borderRadius: borderRadius.xl, padding: 16, marginBottom: 12, ...shadows.sm },
  deviceInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  deviceIconWrap: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.background.secondary, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  deviceText: {},
  deviceName: { fontSize: 15, fontWeight: '600', color: colors.text.primary },
  deviceStatus: { fontSize: 13, color: colors.text.tertiary, marginTop: 2 },
  emptyUpcoming: { backgroundColor: colors.background.card, borderRadius: borderRadius.xl, padding: 24, alignItems: 'center', marginBottom: 12, ...shadows.sm },
  emptyUpcomingText: { fontSize: 14, color: colors.text.tertiary, marginTop: 8 },
});

function formatTimeAgo(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'just now';
}

export default function DashboardScreen({ navigation }: DashboardScreenProps<'Dashboard'>) {
  const insets = useSafeAreaInsets();
  const dogs = useDogStore((s) => s.dogs);
  const activeDogId = useDogStore((s) => s.activeDogId);
  const currentMetrics = useHealthStore((s) => s.currentMetrics);
  const isConnected = useBLEStore((s) => s.isConnected);
  const deviceName = useBLEStore((s) => s.connectedDeviceName);
  const alerts = useAlertStore((s) => s.alerts);
  const unacknowledgedCount = useAlertStore((s) => s.unacknowledgedCount);
  const acknowledgeAlert = useAlertStore((s) => s.acknowledgeAlert);
  const acknowledgeAll = useAlertStore((s) => s.acknowledgeAll);
  const fetchAlerts = useAlertStore((s) => s.fetchAlerts);
  const fetchHeartRateHistory = useHealthStore((s) => s.fetchHeartRateHistory);
  const fetchTemperatureHistory = useHealthStore((s) => s.fetchTemperatureHistory);
  const fetchActivityHistory = useHealthStore((s) => s.fetchActivityHistory);
  const fetchLatestMetrics = useHealthStore((s) => s.fetchLatestMetrics);
  const isTracking = useTrackingStore((s) => s.isTracking);
  const activeRoute = useTrackingStore((s) => s.activeRoute);
  const startRoute = useTrackingStore((s) => s.startRoute);

  const activeDog = useMemo(
    () => dogs.find((d) => d.id === activeDogId) ?? null,
    [dogs, activeDogId],
  );

  const fetchAllData = useCallback(async () => {
    if (!activeDogId) return;
    await Promise.all([
      fetchHeartRateHistory(activeDogId),
      fetchTemperatureHistory(activeDogId),
      fetchActivityHistory(activeDogId),
      fetchLatestMetrics(activeDogId),
      fetchAlerts(),
    ]);
  }, [activeDogId, fetchHeartRateHistory, fetchTemperatureHistory, fetchActivityHistory, fetchLatestMetrics, fetchAlerts]);

  useEffect(() => { fetchAllData(); }, [fetchAllData]);

  // Get the most recent unacknowledged alert for the snapshot
  const topAlert: HealthAlert | null = useMemo(() => {
    const unacked = alerts.filter((a) => !a.acknowledged && a.dogId === activeDogId);
    if (unacked.length === 0) return null;
    return unacked.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
  }, [alerts, activeDogId]);

  // Get upcoming alerts (unacknowledged, sorted by time)
  const upcomingAlerts: HealthAlert[] = useMemo(() => {
    return alerts
      .filter((a) => !a.acknowledged && a.dogId === activeDogId && a.id !== topAlert?.id)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 3);
  }, [alerts, activeDogId, topAlert]);

  // Get recent routes for upcoming section
  const recentRoutes = useTrackingStore((s) => s.routes);
  const upcomingRoutes = useMemo(() => {
    return recentRoutes
      .filter((r) => r.dogId === activeDogId && !r.endTime)
      .slice(0, 2);
  }, [recentRoutes, activeDogId]);

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchAllData().finally(() => setRefreshing(false));
  }, [fetchAllData]);

  const handleQuickAction = useCallback((actionId: string) => {
    if (!activeDog) return;

    switch (actionId) {
      case 'walk':
        if (isTracking) {
          Alert.alert('Walk in Progress', 'A walk is already active. Check the Tracking tab.', [{ text: 'OK' }]);
        } else {
          startRoute(activeDog.id, 'Quick Walk');
          Alert.alert('Walk Started', 'Tracking has begun. Head to the Tracking tab to see your route.', [{ text: 'OK' }]);
        }
        break;
      case 'feeding':
        Alert.alert('Log Feeding', `Log a feeding for ${activeDog.name}?`, [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Log', onPress: () => {
            useAlertStore.getState().addAlert({
              dogId: activeDog.id,
              type: 'activity_abnormal',
              severity: 'info',
              message: `Feeding logged for ${activeDog.name}`,
            });
            Alert.alert('Logged', 'Feeding has been recorded.');
          }},
        ]);
        break;
      case 'remind':
        Alert.alert('Create Reminder', 'Set up a health reminder for your dog?', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Vet Appointment', onPress: () => navigation.getParent()?.navigate('DogProfile', { dogId: activeDog.id }) },
          { text: 'Medication', onPress: () => navigation.getParent()?.navigate('DogProfile', { dogId: activeDog.id }) },
        ]);
        break;
      case 'vet':
        navigation.getParent()?.navigate('DogProfile', { dogId: activeDog.id });
        break;
    }
  }, [activeDog, isTracking, startRoute, navigation]);

  const handleMarkDone = useCallback(() => {
    if (!topAlert) return;
    Alert.alert('Mark as Done', 'Acknowledge this alert?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Done', onPress: () => acknowledgeAlert(topAlert.id) },
    ]);
  }, [topAlert, acknowledgeAlert]);

  const handleMarkAllDone = useCallback(() => {
    if (unacknowledgedCount === 0) return;
    Alert.alert('Acknowledge All', `Mark all ${unacknowledgedCount} alerts as done?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'All Done', onPress: () => acknowledgeAll() },
    ]);
  }, [unacknowledgedCount, acknowledgeAll]);

  if (!activeDog) {
    return (
      <EmptyState
        icon="paw-outline"
        title="No Dog Profile"
        message="Add your dog to get started"
        actionLabel="Get Started"
        onAction={() => { navigation.getParent()?.navigate('Settings'); }}
      />
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary.DEFAULT} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Good morning 👋</Text>
            <Text style={styles.headerName}>Hey there</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity
              style={styles.notifButton}
              activeOpacity={0.7}
              onPress={() => navigation.getParent()?.navigate('Settings')}
            >
              <Ionicons name="notifications-outline" size={26} color={colors.text.primary} />
              {unacknowledgedCount > 0 && <View style={styles.notifBadge} />}
            </TouchableOpacity>
          </View>
        </View>

        {/* Dog Avatars */}
        <View style={styles.dogsRow}>
          {dogs.map((dog) => (
            <TouchableOpacity
              key={dog.id}
              style={styles.dogAvatar}
              onPress={() => useDogStore.getState().setActiveDog(dog.id)}
              activeOpacity={0.7}
            >
              <View style={[styles.avatarCircle, dog.id === activeDogId && { borderWidth: 2, borderColor: colors.primary.DEFAULT }]}>
                {dog.imageUrl ? (
                  <Image source={{ uri: dog.imageUrl }} style={styles.avatarImage} />
                ) : (
                  <Ionicons name="paw" size={28} color={colors.primary.DEFAULT} />
                )}
              </View>
              <Text style={[styles.dogNameLabel, dog.id === activeDogId && { color: colors.primary.DEFAULT, fontWeight: '700' }]} numberOfLines={1}>
                {dog.name}
              </Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={styles.addDogBtn} activeOpacity={0.7} onPress={() => navigation.getParent()?.navigate('Settings')}>
            <View style={styles.addIconCircle}>
              <Ionicons name="add" size={28} color={colors.primary.DEFAULT} />
            </View>
            <Text style={[styles.dogNameLabel, { color: colors.primary.DEFAULT }]}>Add</Text>
          </TouchableOpacity>
        </View>

        {/* Today's Snapshot - shows top alert or healthy status */}
        {topAlert ? (
          <View style={styles.snapshotCard}>
            <Text style={styles.snapshotLabel}>TODAY'S SNAPSHOT</Text>
            <Text style={styles.snapshotTitle}>
              {ALERT_TYPE_LABELS[topAlert.type] || 'Health Alert'}
            </Text>
            <Text style={styles.snapshotDesc}>
              {activeDog.name} · {topAlert.severity === 'critical' ? 'Critical' : topAlert.severity === 'warning' ? 'Warning' : 'Info'} · {topAlert.message}
            </Text>
            <View style={styles.snapshotActions}>
              <TouchableOpacity style={styles.markDoneBtn} activeOpacity={0.7} onPress={handleMarkDone}>
                <Ionicons name="checkmark" size={18} color={colors.primary.DEFAULT} />
                <Text style={styles.markDoneText}>Mark done</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.allBtn} activeOpacity={0.7} onPress={handleMarkAllDone}>
                <Text style={styles.allBtnText}>All</Text>
                <Ionicons name="chevron-forward" size={16} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.noAlertCard}>
            <View style={styles.noAlertIcon}>
              <Ionicons name="checkmark-circle" size={28} color="#4CAF50" />
            </View>
            <Text style={styles.noAlertTitle}>All Clear!</Text>
            <Text style={styles.noAlertDesc}>{activeDog.name} is doing great. No alerts to worry about.</Text>
          </View>
        )}

        {/* Quick Log */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Quick log</Text>
        </View>
        <View style={styles.quickLogRow}>
          {QUICK_ACTIONS.map((action) => (
            <TouchableOpacity
              key={action.id}
              style={styles.quickLogItem}
              activeOpacity={0.7}
              onPress={() => handleQuickAction(action.id)}
            >
              <View style={styles.quickLogIcon}>
                <Ionicons name={action.icon} size={24} color={action.color} />
              </View>
              <Text style={styles.quickLogLabel}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Upcoming */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Upcoming</Text>
          {upcomingAlerts.length > 0 && (
            <TouchableOpacity activeOpacity={0.7} onPress={() => navigation.getParent()?.navigate('Settings')}>
              <Text style={styles.seeAllLink}>See all</Text>
            </TouchableOpacity>
          )}
        </View>

        {upcomingAlerts.length > 0 ? (
          upcomingAlerts.map((alert) => (
            <TouchableOpacity
              key={alert.id}
              style={styles.upcomingItem}
              activeOpacity={0.7}
              onPress={() => acknowledgeAlert(alert.id)}
            >
              <View style={[styles.upcomingIconWrap, { backgroundColor: alert.severity === 'critical' ? '#F4433618' : alert.severity === 'warning' ? '#FF980018' : '#5B9BD518' }]}>
                <Ionicons
                  name={ALERT_TYPE_ICONS[alert.type] || 'alert-circle'}
                  size={20}
                  color={alert.severity === 'critical' ? '#F44336' : alert.severity === 'warning' ? '#FF9800' : '#5B9BD5'}
                />
              </View>
              <View style={styles.upcomingInfo}>
                <Text style={styles.upcomingTitle}>{ALERT_TYPE_LABELS[alert.type] || 'Alert'}</Text>
                <Text style={styles.upcomingSub}>{formatTimeAgo(alert.timestamp)}</Text>
              </View>
              <View style={[styles.upcomingTag, { backgroundColor: alert.severity === 'critical' ? '#F4433618' : alert.severity === 'warning' ? '#FF980018' : '#5B9BD518' }]}>
                <Text style={[styles.upcomingTagText, { color: alert.severity === 'critical' ? '#F44336' : alert.severity === 'warning' ? '#FF9800' : '#5B9BD5' }]}>
                  {alert.severity === 'critical' ? 'Critical' : alert.severity === 'warning' ? 'Warning' : 'Info'}
                </Text>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyUpcoming}>
            <Ionicons name="checkmark-circle-outline" size={32} color={colors.text.tertiary} />
            <Text style={styles.emptyUpcomingText}>No upcoming alerts</Text>
          </View>
        )}

        {/* Active Walk */}
        {activeRoute && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Active Walk</Text>
            </View>
            <TouchableOpacity
              style={styles.upcomingItem}
              activeOpacity={0.7}
              onPress={() => navigation.navigate('Tracking')}
            >
              <View style={[styles.upcomingIconWrap, { backgroundColor: '#4CAF5018' }]}>
                <Ionicons name="walk" size={20} color="#4CAF50" />
              </View>
              <View style={styles.upcomingInfo}>
                <Text style={styles.upcomingTitle}>{activeRoute.name || 'Walking'}</Text>
                <Text style={styles.upcomingSub}>Started {formatTimeAgo(activeRoute.startTime)}</Text>
              </View>
              <View style={[styles.upcomingTag, { backgroundColor: '#4CAF5018' }]}>
                <Text style={[styles.upcomingTagText, { color: '#4CAF50' }]}>Active</Text>
              </View>
            </TouchableOpacity>
          </>
        )}

        {/* Device Status */}
        <View style={styles.deviceRow}>
          <View style={styles.deviceInfo}>
            <View style={styles.deviceIconWrap}>
              <Ionicons name="watch" size={20} color={colors.text.secondary} />
            </View>
            <View style={styles.deviceText}>
              <Text style={styles.deviceName}>{deviceName || 'No device'}</Text>
              <Text style={styles.deviceStatus}>{isConnected ? 'Connected' : 'Disconnected'}</Text>
            </View>
          </View>
          <StatusBadge label={isConnected ? 'Live' : 'Offline'} variant={isConnected ? 'success' : 'default'} size="sm" />
        </View>
      </ScrollView>
    </View>
  );
}
