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