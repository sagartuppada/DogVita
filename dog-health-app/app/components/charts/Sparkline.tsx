/**
 * Sparkline - Compact inline chart for card summaries
 */

import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import { colors, spacing, typography } from '../../theme';

interface SparklineProps {
  data: number[];
  color: string;
  label: string;
  value: string;
  unit: string;
  style?: ViewStyle;
}

export const Sparkline: React.FC<SparklineProps> = ({
  data,
  color,
  label,
  value,
  unit,
  style,
}) => {
  const chartData = data.slice(-12).map((v) => ({ value: v }));

  return (
    <View style={[styles.container, style]}>
      <View style={styles.header}>
        <Text style={styles.label}>{label}</Text>
        <View style={styles.valueRow}>
          <Text style={[styles.value, { color }]}>{value}</Text>
          <Text style={styles.unit}>{unit}</Text>
        </View>
      </View>
      {data.length > 1 ? (
        <LineChart
          data={chartData}
          width={120}
          height={32}
          color={color}
          thickness={2}
          curved
          areaChart
          startFillColor={color + '30'}
          endFillColor={color + '05'}
          hideRules
          hideYAxisText
          hideAxesAndRules
          yAxisColor="transparent"
          xAxisColor="transparent"
          spacing={8}
          dataPointsColor={color}
          dataPointsRadius={0}
          maxValue={Math.max(...data) + 10}
        />
      ) : (
        <View style={styles.noData}>
          <Text style={styles.noDataText}>--</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  label: {
    ...typography.styles.caption,
    color: colors.text.tertiary,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  value: {
    fontSize: 17,
    fontWeight: '700',
  },
  unit: {
    ...typography.styles.caption,
    color: colors.text.tertiary,
    marginLeft: 2,
  },
  noData: {
    height: 32,
    justifyContent: 'center',
  },
  noDataText: {
    ...typography.styles.caption,
    color: colors.text.tertiary,
  },
});

export default Sparkline;