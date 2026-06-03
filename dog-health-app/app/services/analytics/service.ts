/**
 * Analytics Service - Processes and analyzes health data
 */

import { HeartRateData, TemperatureData, ActivityData, SleepData, HealthTrend } from '../../types';

class AnalyticsService {
  private static instance: AnalyticsService;

  private constructor() {}

  public static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService();
    }
    return AnalyticsService.instance;
  }

  calculateHeartRateZone(bpm: number, age: number): string {
    const maxHR = 220 - age;
    const percentage = (bpm / maxHR) * 100;

    if (percentage < 50) return 'rest';
    if (percentage < 60) return 'light';
    if (percentage < 70) return 'moderate';
    if (percentage < 85) return 'active';
    return 'peak';
  }

  calculateAverage(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((sum, v) => sum + v, 0) / values.length;
  }

  calculateTrend(values: number[]): 'increasing' | 'decreasing' | 'stable' {
    if (values.length < 2) return 'stable';

    const recentWindow = values.slice(-10);
    const olderWindow = values.slice(-20, -10);

    if (olderWindow.length === 0) return 'stable';

    const recentAvg = this.calculateAverage(recentWindow);
    const olderAvg = this.calculateAverage(olderWindow);
    const diff = recentAvg - olderAvg;
    const threshold = olderAvg * 0.05;

    if (diff > threshold) return 'increasing';
    if (diff < -threshold) return 'decreasing';
    return 'stable';
  }

  getHeartRateTrend(data: HeartRateData[]): HealthTrend {
    const values = data.map((d) => d.bpm);
    return {
      dogId: '',
      metric: 'heartRate',
      data: data.map((d) => ({ timestamp: d.timestamp, value: d.bpm })),
      average: this.calculateAverage(values),
      min: Math.min(...values),
      max: Math.max(...values),
      trend: this.calculateTrend(values),
    };
  }

  getTemperatureTrend(data: TemperatureData[]): HealthTrend {
    const values = data.map((d) => d.celsius);
    return {
      dogId: '',
      metric: 'temperature',
      data: data.map((d) => ({ timestamp: d.timestamp, value: d.celsius })),
      average: this.calculateAverage(values),
      min: Math.min(...values),
      max: Math.max(...values),
      trend: this.calculateTrend(values),
    };
  }

  calculateActivitySummary(activities: ActivityData[]): {
    totalSteps: number;
    totalDistance: number;
    totalActiveMinutes: number;
    totalCalories: number;
  } {
    return {
      totalSteps: activities.reduce((sum, a) => sum + a.steps, 0),
      totalDistance: activities.reduce((sum, a) => sum + a.distance, 0),
      totalActiveMinutes: activities.reduce((sum, a) => sum + a.activeMinutes, 0),
      totalCalories: activities.reduce((sum, a) => sum + a.calories, 0),
    };
  }

  calculateSleepQuality(sleep: SleepData): number {
    const idealDeepSleepRatio = 0.25;
    const actualDeepRatio = sleep.deepSleep / sleep.duration;
    const deviation = Math.abs(actualDeepRatio - idealDeepSleepRatio);
    const quality = Math.max(0, 100 - deviation * 200);
    return Math.round(quality);
  }

  isHeartRateAbnormal(bpm: number, restingHR: number): boolean {
    const deviation = Math.abs(bpm - restingHR) / restingHR;
    return deviation > 0.3 || bpm < 40 || bpm > 200;
  }

  isTemperatureAbnormal(celsius: number): boolean {
    return celsius < 37.5 || celsius > 39.5;
  }

  generateHealthScore(
    heartRateData: HeartRateData[],
    activityData: ActivityData[],
    sleepData: SleepData[]
  ): number {
    let score = 100;

    if (heartRateData.length > 0) {
      const lastHR = heartRateData[heartRateData.length - 1].bpm;
      if (lastHR < 50 || lastHR > 150) score -= 20;
    }

    const activityScore = Math.min(30, activityData.length * 3);
    score -= (30 - activityScore);

    if (sleepData.length > 0) {
      const lastSleep = sleepData[sleepData.length - 1];
      if (lastSleep.quality < 50) score -= 20;
    }

    return Math.max(0, Math.min(100, score));
  }
}

export const analyticsService = AnalyticsService.getInstance();
export default analyticsService;