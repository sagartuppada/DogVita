/**
 * HealthOverviewScreen - Health metrics with chart cards and metric chips
 */

import React, { useMemo, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useDogStore } from '../../store/dogStore';
import { useHealthStore } from '../../store/healthStore';
import { Card, EmptyState } from '../../components/common';
import HeartRateChart from '../../components/charts/HeartRateChart';
import Sparkline from '../../components/charts/Sparkline';
import { spacing, typography, borderRadius, shadows, colors } from '../../theme';
import type { HealthTabScreenProps } from '../../navigation/types';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.primary },
  scrollContent: { paddingHorizontal: 20, paddingTop: 16 },
  header: { marginBottom: 24 },
  title: { ...typography.styles.headingXL, color: colors.text.primary },
  dogName: { ...typography.styles.bodySM, color: colors.text.tertiary, marginTop: 2 },
  sectionTitle: { ...typography.styles.label, color: colors.text.secondary, marginBottom: 12, marginTop: 20 },
  metricCards: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  metricCard: {
    flex: 1,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
  },
  activityCard: { marginBottom: 20 },
  activityRow: { flexDirection: 'row', justifyContent: 'space-around' },
  activityItem: { alignItems: 'center' },
  activityCircle: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  activityValue: { fontSize: 17, fontWeight: '700', color: colors.text.primary },
  activityLabel: { ...typography.styles.caption, color: colors.text.tertiary, marginTop: 2 },
});

export default function HealthOverviewScreen({}: HealthTabScreenProps<'Health'>) {
  const insets = useSafeAreaInsets();
  const dogs = useDogStore((s) => s.dogs);
  const activeDogId = useDogStore((s) => s.activeDogId);
  const heartRateHistory = useHealthStore((s) => s.heartRateHistory);
  const currentMetrics = useHealthStore((s) => s.currentMetrics);
  const temperatureHistory = useHealthStore((s) => s.temperatureHistory);
  const activityHistory = useHealthStore((s) => s.activityHistory);
  const fetchHeartRateHistory = useHealthStore((s) => s.fetchHeartRateHistory);
  const fetchTemperatureHistory = useHealthStore((s) => s.fetchTemperatureHistory);
  const fetchActivityHistory = useHealthStore((s) => s.fetchActivityHistory);
  const fetchLatestMetrics = useHealthStore((s) => s.fetchLatestMetrics);

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
    ]);
  }, [activeDogId, fetchHeartRateHistory, fetchTemperatureHistory, fetchActivityHistory, fetchLatestMetrics]);

  useEffect(() => { fetchAllData(); }, [fetchAllData]);

  const [refreshing, setRefreshing] = React.useState(false);
  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchAllData().finally(() => setRefreshing(false));
  }, [fetchAllData]);

  const last20 = useMemo(() => heartRateHistory.slice(-20), [heartRateHistory]);
  const last20Bpm = useMemo(() => last20.map((d) => d.bpm), [last20]);
  const hrMin = useMemo(() => (last20Bpm.length > 0 ? Math.min(...last20Bpm) : null), [last20Bpm]);
  const hrMax = useMemo(() => (last20Bpm.length > 0 ? Math.max(...last20Bpm) : null), [last20Bpm]);
  const latestHR = useMemo(() => (last20Bpm.length > 0 ? last20Bpm[last20Bpm.length - 1] : null), [last20Bpm]);

  const metrics = activeDogId ? currentMetrics[activeDogId] : null;
  const latestTemp = useMemo(() => {
    if (temperatureHistory.length === 0) return null;
    return temperatureHistory[temperatureHistory.length - 1];
  }, [temperatureHistory]);
  const latestActivity = metrics?.activity ?? null;
  const latestBattery = metrics?.battery?.level ?? null;

  if (!activeDog) {
    return (
      <EmptyState
        icon="paw-outline"
        title="No Dog Selected"
        message="Add a dog profile to view health data"
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
        <View style={styles.header}>
          <Text style={styles.title}>Health</Text>
          <Text style={styles.dogName}>{activeDog.name}</Text>
        </View>

        <HeartRateChart data={last20Bpm} current={latestHR} min={hrMin} max={hrMax} />

        <Text style={styles.sectionTitle}>Current Vitals</Text>
        {/* Metric Cards with Sparklines */}
        <View style={styles.metricCards}>
          <View style={[styles.metricCard, { backgroundColor: '#FFEBEE', ...shadows.glowRed }]}>
            <Sparkline
              data={heartRateHistory.slice(-20).map((d) => d.bpm)}
              color={colors.health.heartRate}
              label="Heart Rate"
              value={latestHR ? String(latestHR) : '--'}
              unit="bpm"
            />
          </View>
          <View style={[styles.metricCard, { backgroundColor: '#FFF3E0', ...shadows.glowOrange }]}>
            <Sparkline
              data={temperatureHistory.slice(-20).map((d) => d.celsius)}
              color={colors.health.temperature}
              label="Temperature"
              value={latestTemp ? latestTemp.celsius.toFixed(1) : '--'}
              unit="°C"
            />
          </View>
        </View>
        <View style={styles.metricCards}>
          <View style={[styles.metricCard, { backgroundColor: '#E8F5E9', ...shadows.glowGreen }]}>
            <Sparkline
              data={activityHistory.slice(-20).map((d) => d.steps)}
              color={colors.health.activity}
              label="Steps"
              value={latestActivity ? String(latestActivity.steps) : '--'}
              unit="today"
            />
          </View>
          <View style={[styles.metricCard, { backgroundColor: '#E3F2FD', ...shadows.glowBlue }]}>
            <Sparkline
              data={[]}
              color={colors.status.info}
              label="Battery"
              value={latestBattery !== null ? String(latestBattery) : '--'}
              unit="%"
            />
          </View>
        </View>

        <Card variant="default" padding="md" style={styles.activityCard}>
          <Text style={styles.sectionTitle}>Activity Summary</Text>
          <View style={styles.activityRow}>
            <View style={styles.activityItem}>
              <View style={[styles.activityCircle, { backgroundColor: '#E8F5E9', ...shadows.glowGreen }]}>
                <Ionicons name="walk" size={20} color={colors.health.activity} />
              </View>
              <Text style={styles.activityValue}>{latestActivity ? `${latestActivity.activeMinutes}m` : '--'}</Text>
              <Text style={styles.activityLabel}>Active</Text>
            </View>
            <View style={styles.activityItem}>
              <View style={[styles.activityCircle, { backgroundColor: '#FFF3E0', ...shadows.glowOrange }]}>
                <Ionicons name="flame" size={20} color={colors.primary.DEFAULT} />
              </View>
              <Text style={styles.activityValue}>{latestActivity ? String(latestActivity.calories) : '--'}</Text>
              <Text style={styles.activityLabel}>Calories</Text>
            </View>
            <View style={styles.activityItem}>
              <View style={[styles.activityCircle, { backgroundColor: '#EDE7F6', ...shadows.glowPurple }]}>
                <Ionicons name="moon" size={20} color={colors.health.sleep} />
              </View>
              <Text style={styles.activityValue}>--</Text>
              <Text style={styles.activityLabel}>Sleep</Text>
            </View>
          </View>
        </Card>
      </ScrollView>
    </View>
  );
}
