/**
 * HeartRateChart - Heart rate line chart
 */

import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import { colors, spacing, typography } from '../../theme';
import { HeartRateData } from '../../types';

interface HeartRateChartProps {
  data: HeartRateData[];
  showZone?: boolean;
}

export const HeartRateChart: React.FC<HeartRateChartProps> = ({ data, showZone = true }) => {
  const chartData = data.map((item, index) => ({
    value: item.bpm,
    label: index % 5 === 0 ? `${index}` : '',
    dataPointText: '',
  }));

  const avgBPM = data.length > 0 
    ? Math.round(data.reduce((sum, d) => sum + d.bpm, 0) / data.length)
    : 0;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Heart Rate</Text>
        <Text style={styles.avgValue}>{avgBPM} bpm avg</Text>
      </View>
      <LineChart
        data={chartData}
        width={Dimensions.get('window').width - 80}
        height={150}
        color={colors.health.heartRate}
        thickness={2}
        hideDataPoints
        hideRules
        hideYAxisText
        hideAxesAndRules
        curved
        areaChart
        startFillColor={colors.health.heartRate + '40'}
        endFillColor={colors.health.heartRate + '05'}
      />
      {showZone && (
        <View style={styles.zoneIndicator}>
          <Text style={styles.zoneText}>Current Zone: {data[data.length - 1]?.zone || 'N/A'}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background.card,
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: {
    ...typography.styles.titleMedium,
    color: colors.text.primary,
  },
  avgValue: {
    ...typography.styles.bodyMedium,
    color: colors.health.heartRate,
    fontWeight: '600',
  },
  zoneIndicator: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border.default,
  },
  zoneText: {
    ...typography.styles.caption,
    color: colors.text.secondary,
  },
});

export default HeartRateChart;