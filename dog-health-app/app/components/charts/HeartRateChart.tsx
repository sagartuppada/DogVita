/**
 * HeartRateChart - Heart rate visualization card
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { colors, spacing, typography, borderRadius, shadows } from '../../theme';

interface HeartRateChartProps {
  data: number[];
  current: number | null;
  min: number | null;
  max: number | null;
}

export const HeartRateChart: React.FC<HeartRateChartProps> = ({
  data,
  current,
  min,
  max,
}) => {
  const chartData = data.map((value, index) => ({
    value,
    label: index % 5 === 0 ? `${index}s` : '',
    dataPointText: '',
    hideDataPoint: index % 5 !== 0 && index !== data.length - 1,
  }));

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <View style={styles.iconCircle}>
            <Ionicons name="heart" size={18} color={colors.health.heartRate} />
          </View>
          <View>
            <Text style={styles.title}>Heart Rate</Text>
            <Text style={styles.subtitle}>Last 60 seconds</Text>
          </View>
        </View>
        {current && (
          <View style={styles.currentBadge}>
            <Text style={styles.currentValue}>{current}</Text>
            <Text style={styles.currentUnit}>bpm</Text>
          </View>
        )}
      </View>

      <View style={styles.chartContainer}>
        {data.length > 0 ? (
          <LineChart
            data={chartData}
            width={280}
            height={120}
            color={colors.health.heartRate}
            thickness={2}
            dataPointsColor={colors.health.heartRate}
            dataPointsRadius={3}
            startFillColor={colors.health.heartRate + '30'}
            endFillColor={colors.health.heartRate + '05'}
            areaChart
            curved
            spacing={6}
            hideRules
            hideYAxisText
            yAxisColor="transparent"
            xAxisColor={colors.border.light}
            xAxisLabelTextStyle={styles.xAxisLabel}
            noOfSections={4}
            maxValue={Math.max(...(data.length > 0 ? data : [180])) + 20}
          />
        ) : (
          <View style={styles.noData}>
            <Ionicons name="heart-outline" size={24} color={colors.text.tertiary} />
            <Text style={styles.noDataText}>Waiting for data...</Text>
          </View>
        )}
      </View>

      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Min</Text>
          <Text style={[styles.statValue, { color: colors.status.info }]}>
            {min ?? '--'}
          </Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Avg</Text>
          <Text style={[styles.statValue, { color: colors.text.primary }]}>
            {data.length > 0 ? Math.round(data.reduce((a, b) => a + b, 0) / data.length) : '--'}
          </Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Max</Text>
          <Text style={[styles.statValue, { color: colors.status.error }]}>
            {max ?? '--'}
          </Text>
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
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.health.heartRate + '18',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  title: {
    ...typography.styles.bodyMD,
    color: colors.text.primary,
    fontWeight: '600',
  },
  subtitle: {
    ...typography.styles.caption,
    color: colors.text.tertiary,
  },
  currentBadge: {
    flexDirection: 'row',
    alignItems: 'baseline',
    backgroundColor: colors.health.heartRate + '15',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.pill,
  },
  currentValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.health.heartRate,
  },
  currentUnit: {
    ...typography.styles.caption,
    color: colors.health.heartRate,
    marginLeft: 3,
  },
  chartContainer: {
    height: 130,
    marginBottom: spacing.lg,
    marginLeft: -spacing.md,
  },
  noData: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noDataText: {
    ...typography.styles.caption,
    color: colors.text.tertiary,
    marginTop: spacing.xs,
  },
  xAxisLabel: {
    ...typography.styles.caption,
    color: colors.text.tertiary,
    fontSize: 10,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    ...typography.styles.caption,
    color: colors.text.tertiary,
    marginBottom: 2,
  },
  statValue: {
    fontSize: 17,
    fontWeight: '700',
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: colors.border.light,
    alignSelf: 'center',
  },
});

export default HeartRateChart;
