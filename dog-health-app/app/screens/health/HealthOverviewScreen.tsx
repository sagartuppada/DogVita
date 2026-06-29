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
import { spacing, typography, borderRadius, shadows } from '../../theme';
import type { HealthTabScreenProps } from '../../navigation/types';

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 16 },
  header: { marginBottom: 24 },
  title: { ...typography.styles.headingXL, color: '#1F1A17' },
  dogName: { ...typography.styles.bodySM, color: '#A39888', marginTop: 2 },
  sectionTitle: { ...typography.styles.label, color: '#6B625A', marginBottom: 12, marginTop: 20 },
  chipsGrid: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  chip: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#FBF4E4', borderRadius: 20, padding: 16, ...shadows.sm },
  chipIcon: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  chipContent: { flex: 1 },
  chipLabel: { ...typography.styles.caption, color: '#A39888', marginBottom: 2 },
  chipValueRow: { flexDirection: 'row', alignItems: 'baseline' },
  chipValue: { fontSize: 17, fontWeight: '700', color: '#1F1A17' },
  chipUnit: { ...typography.styles.caption, color: '#A39888', marginLeft: 3 },
  activityCard: { marginBottom: 20 },
  activityRow: { flexDirection: 'row', justifyContent: 'space-around' },
  activityItem: { alignItems: 'center' },
  activityCircle: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  activityValue: { fontSize: 17, fontWeight: '700', color: '#1F1A17' },
  activityLabel: { ...typography.styles.caption, color: '#A39888', marginTop: 2 },
});

const MetricChip: React.FC<{
  icon: string;
  label: string;
  value: string;
  unit: string;
  color: string;
}> = ({ icon, label, value, unit, color }) => (
  <View style={styles.chip}>
    <View style={[styles.chipIcon, { backgroundColor: color + '18' }]}>
      <Ionicons name={icon} size={16} color={color} />
    </View>
    <View style={styles.chipContent}>
      <Text style={styles.chipLabel}>{label}</Text>
      <View style={styles.chipValueRow}>
        <Text style={styles.chipValue}>{value}</Text>
        <Text style={styles.chipUnit}>{unit}</Text>
      </View>
    </View>
  </View>
);

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
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#F3A93B" />}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Health</Text>
          <Text style={styles.dogName}>{activeDog.name}</Text>
        </View>

        <HeartRateChart data={last20Bpm} current={latestHR} min={hrMin} max={hrMax} />

        <Text style={styles.sectionTitle}>Current Vitals</Text>
        <View style={styles.chipsGrid}>
          <MetricChip icon="thermometer" label="Temperature" value={latestTemp ? latestTemp.celsius.toFixed(1) : '--'} unit="°C" color="#FF9800" />
          <MetricChip icon="flash" label="Battery" value={latestBattery !== null ? String(latestBattery) : '--'} unit="%" color="#E2941C" />
        </View>
        <View style={styles.chipsGrid}>
          <MetricChip icon="heart" label="Heart Rate" value={latestHR ? String(latestHR) : '--'} unit="bpm" color="#F44336" />
          <MetricChip icon="footsteps" label="Steps" value={latestActivity ? String(latestActivity.steps) : '--'} unit="today" color="#4CAF50" />
        </View>

        <Card variant="default" padding="md" style={styles.activityCard}>
          <Text style={styles.sectionTitle}>Activity Summary</Text>
          <View style={styles.activityRow}>
            <View style={styles.activityItem}>
              <View style={[styles.activityCircle, { backgroundColor: '#4CAF5018' }]}>
                <Ionicons name="walk" size={20} color="#4CAF50" />
              </View>
              <Text style={styles.activityValue}>{latestActivity ? `${latestActivity.activeMinutes}m` : '--'}</Text>
              <Text style={styles.activityLabel}>Active</Text>
            </View>
            <View style={styles.activityItem}>
              <View style={[styles.activityCircle, { backgroundColor: '#F3A93B18' }]}>
                <Ionicons name="flame" size={20} color="#F3A93B" />
              </View>
              <Text style={styles.activityValue}>{latestActivity ? String(latestActivity.calories) : '--'}</Text>
              <Text style={styles.activityLabel}>Calories</Text>
            </View>
            <View style={styles.activityItem}>
              <View style={[styles.activityCircle, { backgroundColor: '#7E57C218' }]}>
                <Ionicons name="moon" size={20} color="#7E57C2" />
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
