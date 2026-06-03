/**
 * DashboardScreen - Main dashboard with health overview
 */

import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Card, StatusBadge, DeviceCard } from '../../components/common';
import { HeartRateChart } from '../../components/charts';
import { colors, spacing, typography } from '../../theme';
import { useDogStore, useHealthStore, useBLEStore } from '../../store';
import { useHealthMetrics } from '../../hooks';

export const DashboardScreen: React.FC = () => {
  const activeDog = useDogStore((state) => state.getActiveDog());
  const { currentMetrics } = useHealthStore();
  const { isConnected, connectedDeviceName } = useBLEStore();

  const metrics = activeDog ? currentMetrics[activeDog.id] : null;
  const heartRateData = useHealthStore((state) => state.heartRateHistory.slice(-20));

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hello!</Text>
            <Text style={styles.title}>{activeDog?.name || 'Add your dog'}</Text>
          </View>
          <View style={styles.connectionBadge}>
            <StatusBadge
              label={isConnected ? 'Connected' : 'Disconnected'}
              variant={isConnected ? 'success' : 'default'}
              size="sm"
              dot
            />
          </View>
        </View>

        <DeviceCard
          deviceName={connectedDeviceName}
          isConnected={isConnected}
          batteryLevel={metrics?.battery?.level}
        />

        <View style={styles.metricsGrid}>
          <MetricCard
            icon="heart"
            iconColor={colors.health.heartRate}
            title="Heart Rate"
            value={metrics?.heartRate?.bpm ? `${metrics.heartRate.bpm}` : '--'}
            unit="bpm"
            subtitle={metrics?.heartRate?.zone || 'N/A'}
          />
          <MetricCard
            icon="thermometer"
            iconColor={colors.health.temperature}
            title="Temperature"
            value={metrics?.temperature?.celsius ? `${metrics.temperature.celsius.toFixed(1)}` : '--'}
            unit="°C"
            subtitle={metrics?.temperature?.isAbnormal ? 'Abnormal' : 'Normal'}
          />
          <MetricCard
            icon="fitness"
            iconColor={colors.health.activity}
            title="Steps"
            value={metrics?.activity?.steps ? `${metrics.activity.steps}` : '--'}
            unit="steps"
            subtitle="Today"
          />
          <MetricCard
            icon="moon"
            iconColor={colors.health.sleep}
            title="Sleep"
            value={metrics?.sleep?.duration ? `${Math.floor(metrics.sleep.duration / 60)}` : '--'}
            unit="hrs"
            subtitle="Last night"
          />
        </View>

        <Card style={styles.chartCard}>
          <Text style={styles.chartTitle}>Heart Rate Today</Text>
          <HeartRateChart data={heartRateData} showZone={false} />
        </Card>

        <Card style={styles.quickActions}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionRow}>
            <ActionButton icon="walk" label="Walk" color={colors.health.activity} />
            <ActionButton icon="medkit" label="Vet" color={colors.status.error} />
            <ActionButton icon="nutrition" label="Feed" color={colors.status.warning} />
            <ActionButton icon="play" label="Play" color={colors.accent[500]} />
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
};

const MetricCard = ({
  icon,
  iconColor,
  title,
  value,
  unit,
  subtitle,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  title: string;
  value: string;
  unit: string;
  subtitle: string;
}) => (
  <Card style={styles.metricCard}>
    <View style={[styles.metricIcon, { backgroundColor: iconColor + '20' }]}>
      <Ionicons name={icon} size={20} color={iconColor} />
    </View>
    <Text style={styles.metricTitle}>{title}</Text>
    <View style={styles.metricValueRow}>
      <Text style={[styles.metricValue, { color: iconColor }]}>{value}</Text>
      <Text style={styles.metricUnit}>{unit}</Text>
    </View>
    <Text style={styles.metricSubtitle}>{subtitle}</Text>
  </Card>
);

const ActionButton = ({
  icon,
  label,
  color,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  color: string;
}) => (
  <View style={styles.actionButton}>
    <View style={[styles.actionIcon, { backgroundColor: color + '20' }]}>
      <Ionicons name={icon} size={24} color={color} />
    </View>
    <Text style={styles.actionLabel}>{label}</Text>
  </View>
);

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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  greeting: {
    ...typography.styles.bodyMedium,
    color: colors.text.secondary,
  },
  title: {
    ...typography.styles.displaySmall,
    color: colors.text.primary,
  },
  connectionBadge: {
    alignItems: 'flex-end',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  metricCard: {
    width: '48%',
    padding: spacing.md,
  },
  metricIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  metricTitle: {
    ...typography.styles.caption,
    color: colors.text.secondary,
  },
  metricValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.xs,
  },
  metricValue: {
    ...typography.styles.headlineLarge,
    fontWeight: '700',
  },
  metricUnit: {
    ...typography.styles.caption,
    color: colors.text.tertiary,
  },
  metricSubtitle: {
    ...typography.styles.caption,
    color: colors.text.tertiary,
    marginTop: spacing.xxs,
  },
  chartCard: {
    padding: spacing.md,
  },
  chartTitle: {
    ...typography.styles.titleMedium,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  quickActions: {
    padding: spacing.md,
  },
  sectionTitle: {
    ...typography.styles.titleMedium,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  actionButton: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: {
    ...typography.styles.caption,
    color: colors.text.secondary,
  },
});

export default DashboardScreen;