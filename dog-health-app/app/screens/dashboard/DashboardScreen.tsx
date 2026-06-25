/**
 * DashboardScreen - Main dashboard with health metrics cards
 */

import React, { useMemo, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useDogStore } from '../../store/dogStore';
import { useHealthStore } from '../../store/healthStore';
import { useBLEStore } from '../../store/bleStore';
import { useAlertStore } from '../../store/alertStore';
import { Card, StatusBadge, EmptyState } from '../../components/common';
import { colors, spacing, typography, borderRadius, shadows } from '../../theme';
import type { DashboardScreenProps } from '../../navigation/types';

const MetricCard: React.FC<{
  icon: string;
  iconColor: string;
  iconBg: string;
  label: string;
  value: string;
  unit: string;
  status?: 'normal' | 'warning' | 'critical';
}> = ({ icon, iconColor, iconBg, label, value, unit, status = 'normal' }) => (
  <Card variant="default" padding="md" style={styles.metricCard}>
    <View style={styles.metricHeader}>
      <View style={[styles.metricIcon, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={20} color={iconColor} />
      </View>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
    <View style={styles.metricValueRow}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricUnit}>{unit}</Text>
    </View>
    {status !== 'normal' && (
      <StatusBadge
        label={status === 'warning' ? 'Attention' : 'Critical'}
        variant={status === 'warning' ? 'warning' : 'error'}
        size="sm"
        dot
      />
    )}
  </Card>
);

const QuickStat: React.FC<{
  icon: string;
  label: string;
  value: string;
  color: string;
}> = ({ icon, label, value, color }) => (
  <View style={styles.quickStat}>
    <View style={[styles.quickStatIcon, { backgroundColor: color + '18' }]}>
      <Ionicons name={icon} size={16} color={color} />
    </View>
    <Text style={styles.quickStatValue}>{value}</Text>
    <Text style={styles.quickStatLabel}>{label}</Text>
  </View>
);

export default function DashboardScreen({ navigation }: DashboardScreenProps<'Dashboard'>) {
  const insets = useSafeAreaInsets();
  const dogs = useDogStore((s) => s.dogs);
  const activeDogId = useDogStore((s) => s.activeDogId);
  const heartRateHistory = useHealthStore((s) => s.heartRateHistory);
  const currentMetrics = useHealthStore((s) => s.currentMetrics);
  const isConnected = useBLEStore((s) => s.isConnected);
  const deviceName = useBLEStore((s) => s.connectedDeviceName);
  const signalStrength = useBLEStore((s) => s.signalStrength);
  const unacknowledgedCount = useAlertStore((s) => s.unacknowledgedCount);
  const fetchHeartRateHistory = useHealthStore((s) => s.fetchHeartRateHistory);
  const fetchTemperatureHistory = useHealthStore((s) => s.fetchTemperatureHistory);
  const fetchActivityHistory = useHealthStore((s) => s.fetchActivityHistory);
  const fetchLatestMetrics = useHealthStore((s) => s.fetchLatestMetrics);
  const fetchAlerts = useAlertStore((s) => s.fetchAlerts);

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

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  const metrics = activeDogId ? currentMetrics[activeDogId] : null;

  const latestHeartRate = useMemo(() => {
    if (heartRateHistory.length === 0) return null;
    return heartRateHistory[heartRateHistory.length - 1].bpm;
  }, [heartRateHistory]);

  const latestTemperature = metrics?.temperature?.celsius ?? null;
  const latestBattery = metrics?.battery?.level ?? null;
  const latestActivity = metrics?.activity ?? null;

  const heartRateStatus = useMemo(() => {
    if (!latestHeartRate) return 'normal' as const;
    if (latestHeartRate < 60 || latestHeartRate > 140) return 'critical' as const;
    if (latestHeartRate < 70 || latestHeartRate > 120) return 'warning' as const;
    return 'normal' as const;
  }, [latestHeartRate]);

  const [refreshing, setRefreshing] = React.useState(false);
  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchAllData().finally(() => setRefreshing(false));
  }, [fetchAllData]);

  if (!activeDog) {
    return (
      <EmptyState
        icon="paw-outline"
        title="No Dog Profile"
        message="Add your dog to get started"
        actionLabel="Get Started"
        onAction={() => {
          navigation.getParent()?.navigate('Settings');
        }}
      />
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 100 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary.DEFAULT} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Good morning</Text>
            <TouchableOpacity onPress={() => navigation.getParent()?.navigate('DogProfile', { dogId: activeDog.id })} activeOpacity={0.7}>
            <Text style={styles.dogName}>{activeDog.name}</Text>
          </TouchableOpacity>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity
              style={styles.accountButton}
              onPress={() => navigation.getParent()?.navigate('Settings')}
              activeOpacity={0.7}
            >
              <Ionicons name="person-circle-outline" size={32} color={colors.text.secondary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* All Dogs */}
        <Card variant="default" padding="md" style={styles.dogsCard}>
          <Text style={styles.sectionTitle}>Your Dogs ({dogs.length})</Text>
          {dogs.map((dog) => (
            <TouchableOpacity
              key={dog.id}
              style={[
                styles.dogRow,
                dog.id === activeDogId && styles.dogRowActive,
              ]}
              onPress={() => useDogStore.getState().setActiveDog(dog.id)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={dog.id === activeDogId ? 'paw' : 'paw-outline'}
                size={16}
                color={dog.id === activeDogId ? colors.primary.DEFAULT : colors.text.tertiary}
              />
              <Text
                style={[
                  styles.dogNameText,
                  dog.id === activeDogId && styles.dogNameTextActive,
                ]}
              >
                {dog.name}
              </Text>
              <Text style={styles.dogBreed}>{dog.breed}</Text>
            </TouchableOpacity>
          ))}
        </Card>

        {/* Primary Metrics Row */}
        <View style={styles.metricsRow}>
          <MetricCard
            icon="heart"
            iconColor={colors.health.heartRate}
            iconBg={colors.health.heartRate + '18'}
            label="Heart Rate"
            value={latestHeartRate ? String(latestHeartRate) : '--'}
            unit="bpm"
            status={heartRateStatus}
          />
          <MetricCard
            icon="thermometer"
            iconColor={colors.health.temperature}
            iconBg={colors.health.temperature + '18'}
            label="Temperature"
            value={latestTemperature !== null ? String(latestTemperature.toFixed(1)) : '--'}
            unit="°C"
          />
        </View>

        <View style={styles.metricsRow}>
          <MetricCard
            icon="footsteps"
            iconColor={colors.status.success}
            iconBg={colors.status.success + '18'}
            label="Activity"
            value={latestActivity ? String(latestActivity.steps) : '--'}
            unit="steps"
          />
          <MetricCard
            icon="flash"
            iconColor={colors.primary.dark}
            iconBg={colors.primary.DEFAULT + '18'}
            label="Battery"
            value={latestBattery !== null ? String(latestBattery) : '--'}
            unit="%"
          />
        </View>

        {/* Quick Stats */}
        <Card variant="default" padding="md" style={styles.quickStatsCard}>
          <Text style={styles.sectionTitle}>Today's Summary</Text>
          <View style={styles.quickStatsRow}>
            <QuickStat icon="footsteps" label="Steps" value={latestActivity ? String(latestActivity.steps).replace(/\B(?=(\d{3})+(?!\d))/g, ',') : '--'} color={colors.status.success} />
            <QuickStat icon="time" label="Active" value={latestActivity ? `${latestActivity.activeMinutes}m` : '--'} color={colors.primary.DEFAULT} />
            <QuickStat icon="flame" label="Calories" value={latestActivity ? String(latestActivity.calories) : '--'} color={colors.health.heartRate} />
          </View>
        </Card>

        {/* Device Status */}
        <Card variant="default" padding="md" style={styles.deviceCard}>
          <View style={styles.deviceRow}>
            <View style={styles.deviceInfo}>
              <Ionicons name="watch" size={20} color={colors.text.secondary} />
              <View style={styles.deviceText}>
                <Text style={styles.deviceName}>{deviceName || 'No device'}</Text>
                <Text style={styles.deviceStatus}>
                  {isConnected ? 'Connected' : 'Disconnected'}
                </Text>
              </View>
            </View>
            <StatusBadge
              label={isConnected ? 'Live' : 'Offline'}
              variant={isConnected ? 'success' : 'default'}
              size="sm"
            />
          </View>
        </Card>

        {/* Alerts Banner */}
        {unacknowledgedCount > 0 && (
          <Card
            variant="default"
            padding="md"
            onPress={() => navigation.navigate('Chatbot')}
            style={styles.alertBanner}
          >
            <View style={styles.alertRow}>
              <View style={styles.alertIcon}>
                <Ionicons name="warning" size={18} color={colors.status.warning} />
              </View>
              <Text style={styles.alertText}>
                {unacknowledgedCount} new alert{unacknowledgedCount > 1 ? 's' : ''}
              </Text>
              <Ionicons name="chevron-forward" size={18} color={colors.text.tertiary} />
            </View>
          </Card>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  scrollContent: {
    paddingHorizontal: spacing.page,
    paddingTop: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xxl,
  },
  greeting: {
    ...typography.styles.bodySM,
    color: colors.text.tertiary,
  },
  dogName: {
    ...typography.styles.headingLG,
    color: colors.text.primary,
    marginTop: 2,
  },
  headerRight: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountButton: {
    padding: 4,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  metricCard: {
    flex: 1,
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  metricIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  metricLabel: {
    ...typography.styles.caption,
    color: colors.text.tertiary,
    flex: 1,
  },
  metricValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: spacing.xs,
  },
  metricValue: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text.primary,
  },
  metricUnit: {
    ...typography.styles.caption,
    color: colors.text.tertiary,
    marginLeft: 4,
  },
  quickStatsCard: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.styles.label,
    color: colors.text.secondary,
    marginBottom: spacing.md,
  },
  quickStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  quickStat: {
    alignItems: 'center',
  },
  quickStatIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  quickStatValue: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text.primary,
  },
  quickStatLabel: {
    ...typography.styles.caption,
    color: colors.text.tertiary,
  },
  deviceCard: {
    marginBottom: spacing.md,
  },
  deviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  deviceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deviceText: {
    marginLeft: spacing.md,
  },
  deviceName: {
    ...typography.styles.bodyMD,
    color: colors.text.primary,
    fontWeight: '600',
  },
  deviceStatus: {
    ...typography.styles.caption,
    color: colors.text.tertiary,
  },
  alertBanner: {
    marginBottom: spacing.md,
    backgroundColor: colors.status.warning + '12',
  },
  alertRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  alertIcon: {
    marginRight: spacing.md,
  },
  alertText: {
    ...typography.styles.bodyMD,
    color: colors.text.primary,
    fontWeight: '500',
    flex: 1,
  },
  dogsCard: {
    marginBottom: spacing.md,
  },
  dogRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.xs,
  },
  dogRowActive: {
    backgroundColor: colors.primary.DEFAULT + '12',
  },
  dogNameText: {
    ...typography.styles.bodyMD,
    color: colors.text.primary,
    marginLeft: spacing.sm,
    flex: 1,
  },
  dogNameTextActive: {
    fontWeight: '600',
    color: colors.primary.DEFAULT,
  },
  dogBreed: {
    ...typography.styles.caption,
    color: colors.text.tertiary,
  },
});
