/**
 * Health store - manages health metrics and monitoring data
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  HealthMetrics,
  HeartRateData,
  TemperatureData,
  ActivityData,
  SleepData,
  BatteryData,
  LocationData,
} from '../types';

interface HealthState {
  currentMetrics: Record<string, HealthMetrics>;
  heartRateHistory: HeartRateData[];
  temperatureHistory: TemperatureData[];
  activityHistory: ActivityData[];
  sleepHistory: SleepData[];
  isMonitoring: boolean;
  lastUpdated: string | null;
}

interface HealthActions {
  setCurrentMetrics: (dogId: string, metrics: HealthMetrics) => void;
  addHeartRateReading: (dogId: string, data: HeartRateData) => void;
  addTemperatureReading: (dogId: string, data: TemperatureData) => void;
  addActivityReading: (dogId: string, data: ActivityData) => void;
  addSleepReading: (dogId: string, data: SleepData) => void;
  setBatteryLevel: (dogId: string, data: BatteryData) => void;
  updateLocation: (dogId: string, data: LocationData) => void;
  setMonitoring: (isMonitoring: boolean) => void;
  clearHistory: (dogId: string) => void;
  getLatestHeartRate: (dogId: string) => HeartRateData | null;
  getLatestTemperature: (dogId: string) => TemperatureData | null;
  loadDemoData: () => void;
}

type HealthStore = HealthState & HealthActions;

const MAX_HISTORY_LENGTH = 1000;

const initialState: HealthState = {
  currentMetrics: {},
  heartRateHistory: [],
  temperatureHistory: [],
  activityHistory: [],
  sleepHistory: [],
  isMonitoring: false,
  lastUpdated: null,
};

export const useHealthStore = create<HealthStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      setCurrentMetrics: (dogId, metrics) =>
        set((state) => ({
          currentMetrics: {
            ...state.currentMetrics,
            [dogId]: {
              ...state.currentMetrics[dogId],
              ...metrics,
              timestamp: new Date().toISOString(),
            },
          },
          lastUpdated: new Date().toISOString(),
        })),

      addHeartRateReading: (dogId, data) =>
        set((state) => ({
          heartRateHistory: [
            ...state.heartRateHistory.slice(-MAX_HISTORY_LENGTH + 1),
            data,
          ],
        })),

      addTemperatureReading: (dogId, data) =>
        set((state) => ({
          temperatureHistory: [
            ...state.temperatureHistory.slice(-MAX_HISTORY_LENGTH + 1),
            data,
          ],
        })),

      addActivityReading: (dogId, data) =>
        set((state) => ({
          activityHistory: [
            ...state.activityHistory.slice(-MAX_HISTORY_LENGTH + 1),
            data,
          ],
        })),

      addSleepReading: (dogId, data) =>
        set((state) => ({
          sleepHistory: [
            ...state.sleepHistory.slice(-MAX_HISTORY_LENGTH + 1),
            data,
          ],
        })),

      setBatteryLevel: (dogId, data) =>
        set((state) => ({
          currentMetrics: {
            ...state.currentMetrics,
            [dogId]: {
              ...state.currentMetrics[dogId],
              battery: data,
              timestamp: new Date().toISOString(),
            },
          },
        })),

      updateLocation: (dogId, data) =>
        set((state) => ({
          currentMetrics: {
            ...state.currentMetrics,
            [dogId]: {
              ...state.currentMetrics[dogId],
              location: data,
              timestamp: new Date().toISOString(),
            },
          },
        })),

      setMonitoring: (isMonitoring) => set({ isMonitoring }),

      clearHistory: (dogId) =>
        set((state) => ({
          heartRateHistory: [],
          temperatureHistory: [],
          activityHistory: [],
          sleepHistory: [],
          currentMetrics: {},
        })),

      getLatestHeartRate: (dogId) => {
        const { heartRateHistory } = get();
        return heartRateHistory[heartRateHistory.length - 1] || null;
      },

      getLatestTemperature: (dogId) => {
        const { temperatureHistory } = get();
        return temperatureHistory[temperatureHistory.length - 1] || null;
      },

      loadDemoData: () => {
        const now = Date.now();
        const heartRateData = [];
        const temperatureData = [];
        const activityData = [];

        for (let i = 0; i < 30; i++) {
          const timestamp = new Date(now - (30 - i) * 60000).toISOString();
          heartRateData.push({
            bpm: 70 + Math.floor(Math.random() * 40),
            variability: Math.floor(Math.random() * 20),
            zone: 'moderate' as const,
            timestamp,
            dogId: 'demo_dog_1',
          });
          temperatureData.push({
            celsius: 38 + Math.random() * 0.8,
            fahrenheit: 100.4 + Math.random() * 1.5,
            isAbnormal: false,
            timestamp,
            dogId: 'demo_dog_1',
          });
          activityData.push({
            steps: Math.floor(Math.random() * 500),
            distance: Math.random() * 0.5,
            activeMinutes: Math.floor(Math.random() * 30),
            calories: Math.floor(Math.random() * 50),
            type: 'walking' as const,
            timestamp,
            dogId: 'demo_dog_1',
          });
        }

        const lastHR = heartRateData[heartRateData.length - 1];
        const lastTemp = temperatureData[temperatureData.length - 1];
        const lastActivity = activityData[activityData.length - 1];
        const timestamp = new Date().toISOString();

        set({
          heartRateHistory: heartRateData,
          temperatureHistory: temperatureData,
          activityHistory: activityData,
          currentMetrics: {
            demo_dog_1: {
              dogId: 'demo_dog_1',
              timestamp,
              heartRate: lastHR,
              temperature: lastTemp,
              activity: lastActivity,
              battery: { level: 85, isCharging: false, estimatedHours: 8, timestamp },
            },
          },
          isMonitoring: true,
          lastUpdated: timestamp,
        });
      },
    }),
    {
      name: 'health-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

export const selectCurrentHeartRate = (dogId: string) => (state: HealthStore) =>
  state.currentMetrics[dogId]?.heartRate || null;

export const selectIsMonitoring = (state: HealthStore) => state.isMonitoring;