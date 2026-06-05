/**
 * HealthOverviewScreen - Health metrics with chart cards and metric chips
 */

import React, { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useDogStore } from '../../store/dogStore';
import { useHealthStore } from '../../store/healthStore';
import { Card, EmptyState } from '../../components/common';
import HeartRateChart from '../../components/charts/HeartRateChart';
import { colors, spacing, typography, borderRadius, shadows } from '../../theme';
import type { HealthTabScreenProps } from '../../navigation/types';

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

  const activeDog = useMemo(
    () => dogs.find((d) => d.id === activeDogId) ?? null,
    [dogs, activeDogId],
  );

  const last20 = useMemo(() => heartRateHistory.slice(-20), [heartRateHistory]);
  const last20Bpm = useMemo(() => last20.map((d) => d.bpm), [last20]);

  const hrMin = useMemo(
    () => (last20Bpm.length > 0 ? Math.min(...last20Bpm) : null),
    [last20Bpm],
  );
  const hrMax = useMemo(
    () => (last20Bpm.length > 0 ? Math.max(...last20Bpm) : null),
    [last20Bpm],
  );
  const latestHR = useMemo(
    () => (last20Bpm.length > 0 ? last20Bpm[last20Bpm.length - 1] : null),
    [last20Bpm],
  );

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
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Health</Text>
          <Text style={styles.dogName}>{activeDog.name}</Text>
        </View>

        {/* Heart Rate Chart */}
        <HeartRateChart
          data={last20Bpm}
          current={latestHR}
          min={hrMin}
          max={hrMax}
        />

        {/* Metric Chips */}
        <Text style={styles.sectionTitle}>Current Vitals</Text>
        <View style={styles.chipsGrid}>
          <MetricChip
            icon="thermometer"
            label="Temperature"
            value={latestTemp ? latestTemp.celsius.toFixed(1) : '--'}
            unit="°C"
            color={colors.health.temperature}
          />
          <MetricChip
            icon="flash"
            label="Battery"
            value={latestBattery !== null ? String(latestBattery) : '--'}
            unit="%"
            color={colors.primary.dark}
          />
        </View>

        <View style={styles.chipsGrid}>
          <MetricChip
            icon="heart"
            label="Heart Rate"
            value={latestHR ? String(latestHR) : '--'}
            unit="bpm"
            color={colors.health.heartRate}
          />
          <MetricChip
            icon="footsteps"
            label="Steps"
            value={latestActivity ? String(latestActivity.steps) : '--'}
            unit="today"
            color={colors.status.success}
          />
        </View>

        {/* Activity Summary */}
        <Card variant="default" padding="md" style={styles.activityCard}>
          <Text style={styles.sectionTitle}>Activity Summary</Text>
          <View style={styles.activityRow}>
            <View style={styles.activityItem}>
              <View style={[styles.activityCircle, { backgroundColor: colors.status.success + '18' }]}>
                <Ionicons name="walk" size={20} color={colors.status.success} />
              </View>
              <Text style={styles.activityValue}>{latestActivity ? `${latestActivity.activeMinutes}m` : '--'}</Text>
              <Text style={styles.activityLabel}>Active</Text>
            </View>
            <View style={styles.activityItem}>
              <View style={[styles.activityCircle, { backgroundColor: colors.primary.DEFAULT + '18' }]}>
                <Ionicons name="flame" size={20} color={colors.primary.DEFAULT} />
              </View>
              <Text style={styles.activityValue}>{latestActivity ? String(latestActivity.calories) : '--'}</Text>
              <Text style={styles.activityLabel}>Calories</Text>
            </View>
            <View style={styles.activityItem}>
              <View style={[styles.activityCircle, { backgroundColor: colors.health.sleep + '18' }]}>
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
    marginBottom: spacing.xxl,
  },
  title: {
    ...typography.styles.headingXL,
    color: colors.text.primary,
  },
  dogName: {
    ...typography.styles.bodySM,
    color: colors.text.tertiary,
    marginTop: 2,
  },
  sectionTitle: {
    ...typography.styles.label,
    color: colors.text.secondary,
    marginBottom: spacing.md,
    marginTop: spacing.xl,
  },
  chipsGrid: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  chip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    ...shadows.sm,
  },
  chipIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  chipContent: {
    flex: 1,
  },
  chipLabel: {
    ...typography.styles.caption,
    color: colors.text.tertiary,
    marginBottom: 2,
  },
  chipValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  chipValue: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text.primary,
  },
  chipUnit: {
    ...typography.styles.caption,
    color: colors.text.tertiary,
    marginLeft: 3,
  },
  activityCard: {
    marginBottom: spacing.xl,
  },
  activityRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  activityItem: {
    alignItems: 'center',
  },
  activityCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  activityValue: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text.primary,
  },
  activityLabel: {
    ...typography.styles.caption,
    color: colors.text.tertiary,
    marginTop: 2,
  },
});
