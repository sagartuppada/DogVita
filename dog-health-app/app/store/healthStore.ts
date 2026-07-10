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
import { healthService } from '../services/api/health';
import { isSupabaseConfigured } from '../services/api/supabase';

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
  fetchHeartRateHistory: (dogId: string) => Promise<void>;
  fetchTemperatureHistory: (dogId: string) => Promise<void>;
  fetchActivityHistory: (dogId: string) => Promise<void>;
  fetchLatestMetrics: (dogId: string) => Promise<void>;
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

      setBatteryLevel: (dogId, data) => {
        set((state) => ({
          currentMetrics: {
            ...state.currentMetrics,
            [dogId]: {
              ...state.currentMetrics[dogId],
              battery: data,
              timestamp: new Date().toISOString(),
            },
          },
        }));
        // Fire low-battery notification (fire-and-forget)
        if (data.level <= 20) {
          try {
            const { notificationsService } = require('../services/notifications');
            notificationsService.initialize().then(() => {
              notificationsService.scheduleLowBatteryAlert(dogId, data.level);
            }).catch((err: unknown) => console.warn('[healthStore] Low battery notification failed:', err));
          } catch (err) { console.warn('[healthStore] Low battery notification failed:', err); }
        }
      },

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
          heartRateHistory: state.heartRateHistory.filter((d) => d.dogId !== dogId),
          temperatureHistory: state.temperatureHistory.filter((d) => d.dogId !== dogId),
          activityHistory: state.activityHistory.filter((d) => d.dogId !== dogId),
          sleepHistory: state.sleepHistory.filter((d) => d.dogId !== dogId),
          currentMetrics: Object.fromEntries(
            Object.entries(state.currentMetrics).filter(([key]) => key !== dogId)
          ),
        })),

      getLatestHeartRate: (dogId) => {
        const { heartRateHistory } = get();
        const filtered = heartRateHistory.filter((d) => d.dogId === dogId);
        return filtered[filtered.length - 1] || null;
      },

      getLatestTemperature: (dogId) => {
        const { temperatureHistory } = get();
        const filtered = temperatureHistory.filter((d) => d.dogId === dogId);
        return filtered[filtered.length - 1] || null;
      },

      fetchHeartRateHistory: async (dogId) => {
        if (!isSupabaseConfigured()) return;
        try {
          const history = await healthService.getHeartRateHistory(dogId);
          // Success from server = source of truth. Replace local history.
          set({ heartRateHistory: history });
        } catch (error) {
          console.warn('[healthStore.fetchHeartRateHistory] Supabase fetch failed:', (error as Error).message);
        }
      },

      fetchTemperatureHistory: async (dogId) => {
        if (!isSupabaseConfigured()) return;
        try {
          const history = await healthService.getTemperatureHistory(dogId);
          // Success from server = source of truth. Replace local history.
          set({ temperatureHistory: history });
        } catch (error) {
          console.warn('[healthStore.fetchTemperatureHistory] Supabase fetch failed:', (error as Error).message);
        }
      },

      fetchActivityHistory: async (dogId) => {
        if (!isSupabaseConfigured()) return;
        try {
          const history = await healthService.getActivityHistory(dogId);
          // Success from server = source of truth. Replace local history.
          set({ activityHistory: history });
        } catch (error) {
          console.warn('[healthStore.fetchActivityHistory] Supabase fetch failed:', (error as Error).message);
        }
      },

      fetchLatestMetrics: async (dogId) => {
        if (!isSupabaseConfigured()) return;
        try {
          const latest = await healthService.getLatestMetrics(dogId);
          if (latest) {
            set((state) => ({
              currentMetrics: {
                ...state.currentMetrics,
                [dogId]: {
                  dogId,
                  timestamp: latest.timestamp ?? new Date().toISOString(),
                  ...latest,
                },
              },
              lastUpdated: new Date().toISOString(),
            }));
          }
        } catch (error) {
          console.warn('[healthStore.fetchLatestMetrics] Supabase fetch failed:', (error as Error).message);
        }
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

export const selectCurrentMetrics = (state: HealthStore) => state.currentMetrics;
export const selectIsMonitoring = (state: HealthStore) => state.isMonitoring;