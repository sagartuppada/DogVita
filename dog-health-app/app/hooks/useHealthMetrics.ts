/**
 * useHealthMetrics - Hook for health data monitoring
 */

import { useState, useCallback } from 'react';
import { useHealthStore } from '../store';
import { HealthMetrics, HeartRateData, TemperatureData } from '../types';

export const useHealthMetrics = (dogId: string) => {
  const [isLoading] = useState(false);

  const {
    currentMetrics,
    heartRateHistory,
    temperatureHistory,
    isMonitoring,
    addHeartRateReading,
    addTemperatureReading,
    setBatteryLevel,
    updateLocation,
    setMonitoring,
    getLatestHeartRate,
    getLatestTemperature,
  } = useHealthStore();

  const currentMetric = currentMetrics[dogId];
  const latestHeartRate = getLatestHeartRate(dogId);
  const latestTemperature = getLatestTemperature(dogId);

  const getHealthScore = useCallback(() => {
    let score = 100;
    if (latestHeartRate) {
      if (latestHeartRate.bpm < 50 || latestHeartRate.bpm > 150) score -= 30;
    }
    if (latestTemperature) {
      if (latestTemperature.isAbnormal) score -= 30;
    }
    return Math.max(0, Math.min(100, score));
  }, [latestHeartRate, latestTemperature]);

  return {
    currentMetric,
    heartRateHistory,
    temperatureHistory,
    isMonitoring,
    latestHeartRate,
    latestTemperature,
    addHeartRateReading,
    addTemperatureReading,
    setBatteryLevel,
    updateLocation,
    setMonitoring,
    getHealthScore,
    isLoading,
  };
};

export default useHealthMetrics;