/**
 * HealthOverviewScreen - Health metrics overview
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Card, StatusBadge } from '../../components/common';
import { HeartRateChart } from '../../components/charts';
import { colors, spacing, typography } from '../../theme';
import { useDogStore, useHealthStore } from '../../store';

export const HealthOverviewScreen: React.FC = () => {
  const dogs = useDogStore((state) => state.dogs);
  const activeDogId = useDogStore((state) => state.activeDogId);
  const currentMetrics = useHealthStore((s) => s.currentMetrics);
  const heartRateHistory = useHealthStore((s) => s.heartRateHistory);
  const activeDog = useMemo(() => dogs.find((d) => d.id === activeDogId) ?? null, [dogs, activeDogId]);
  const metrics = activeDog ? currentMetrics[activeDog.id] : null;
  const recentHeartRate = useMemo(() => heartRateHistory.slice(-20), [heartRateHistory]);

  const getHealthScore = () => {
    if (!metrics) return 0;
    let score = 100;
    if (metrics.heartRate?.bpm && (metrics.heartRate.bpm < 50 || metrics.heartRate.bpm > 150)) score -= 30;
    if (metrics.temperature?.isAbnormal) score -= 30;
    return Math.max(0, score);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Health</Text>
          <Text style={styles.subtitle}>{activeDog?.name || 'No dog selected'}</Text>
        </View>

        <Card style={styles.scoreCard}>
          <View style={styles.scoreRow}>
            <View>
              <Text style={styles.scoreLabel}>Health Score</Text>
              <Text style={[styles.scoreValue, { color: getHealthScore() > 70 ? colors.status.success : colors.status.warning }]}>
                {getHealthScore()}
              </Text>
            </View>
            <View style={styles.scoreIcon}>
              <Ionicons
                name={getHealthScore() > 70 ? 'checkmark-circle' : 'warning'}
                size={48}
                color={getHealthScore() > 70 ? colors.status.success : colors.status.warning}
              />
            </View>
          </View>
        </Card>

        <Text style={styles.sectionTitle}>Heart Rate</Text>
        <Card style={styles.metricCard}>
          <View style={styles.metricHeader}>
            <View style={[styles.iconContainer, { backgroundColor: colors.health.heartRate + '20' }]}>
              <Ionicons name="heart" size={24} color={colors.health.heartRate} />
            </View>
            <View style={styles.metricInfo}>
              <Text style={styles.metricValue}>
                {metrics?.heartRate?.bpm || '--'}
                <Text style={styles.metricUnit}> bpm</Text>
              </Text>
              <StatusBadge
                label={metrics?.heartRate?.zone || 'N/A'}
                variant={metrics?.heartRate?.zone === 'rest' ? 'success' : 'info'}
                size="sm"
              />
            </View>
          </View>
          <HeartRateChart data={recentHeartRate} showZone />
        </Card>

        <Text style={styles.sectionTitle}>Temperature</Text>
        <Card style={styles.metricCard}>
          <View style={styles.metricHeader}>
            <View style={[styles.iconContainer, { backgroundColor: colors.health.temperature + '20' }]}>
              <Ionicons name="thermometer" size={24} color={colors.health.temperature} />
            </View>
            <View style={styles.metricInfo}>
              <Text style={styles.metricValue}>
                {metrics?.temperature?.celsius?.toFixed(1) || '--'}
                <Text style={styles.metricUnit}> °C</Text>
              </Text>
              <StatusBadge
                label={metrics?.temperature?.isAbnormal ? 'Abnormal' : 'Normal'}
                variant={metrics?.temperature?.isAbnormal ? 'warning' : 'success'}
                size="sm"
              />
            </View>
          </View>
        </Card>

        <Text style={styles.sectionTitle}>Activity</Text>
        <Card style={styles.metricCard}>
          <View style={styles.metricHeader}>
            <View style={[styles.iconContainer, { backgroundColor: colors.health.activity + '20' }]}>
              <Ionicons name="fitness" size={24} color={colors.health.activity} />
            </View>
            <View style={styles.metricInfo}>
              <Text style={styles.metricValue}>
                {metrics?.activity?.steps?.toLocaleString() || '--'}
                <Text style={styles.metricUnit}> steps</Text>
              </Text>
            </View>
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  },
  scrollContent: {
    padding: spacing.page,
    gap: spacing.md,
  },
  header: {
    marginBottom: spacing.sm,
  },
  title: {
    ...typography.styles.displaySmall,
    color: colors.text.primary,
  },
  subtitle: {
    ...typography.styles.bodyMedium,
    color: colors.text.secondary,
  },
  scoreCard: {
    backgroundColor: colors.background.card,
  },
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scoreLabel: {
    ...typography.styles.bodyMedium,
    color: colors.text.secondary,
  },
  scoreValue: {
    fontSize: 48,
    fontWeight: '700',
  },
  scoreIcon: {
    opacity: 0.8,
  },
  sectionTitle: {
    ...typography.styles.titleMedium,
    color: colors.text.primary,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  metricCard: {
    padding: spacing.md,
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metricValue: {
    ...typography.styles.headlineMedium,
    color: colors.text.primary,
  },
  metricUnit: {
    ...typography.styles.bodyMedium,
    color: colors.text.secondary,
  },
});

export default HealthOverviewScreen;