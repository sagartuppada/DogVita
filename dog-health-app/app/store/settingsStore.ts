/**
 * Settings store - manages app settings and preferences
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserSettings, Units, TemperatureUnit, DistanceUnit, WeightUnit, TimeFormat, DateFormat } from '../types';

interface SettingsState extends UserSettings {
  isLoading: boolean;
  isFirstLaunch: boolean;
  hasCompletedOnboarding: boolean;
  lastSyncTime: string | null;
  theme: 'light' | 'dark' | 'system';
  isBLEEnabled: boolean;
  isLocationEnabled: boolean;
  isNotificationsEnabled: boolean;
}

interface SettingsActions {
  setUnits: (units: Partial<Units>) => void;
  setTemperatureUnit: (unit: TemperatureUnit) => void;
  setDistanceUnit: (unit: DistanceUnit) => void;
  setWeightUnit: (unit: WeightUnit) => void;
  setTimeFormat: (format: TimeFormat) => void;
  setDateFormat: (format: DateFormat) => void;
  setNotifications: (enabled: boolean) => void;
  setDarkMode: (enabled: boolean) => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  setAutoSync: (enabled: boolean) => void;
  setGPSInterval: (interval: number) => void;
  setHeartRateThreshold: (threshold: number) => void;
  setLowBatteryThreshold: (threshold: number) => void;
  setFirstLaunch: (isFirst: boolean) => void;
  setOnboardingComplete: () => void;
  setBLEEnabled: (enabled: boolean) => void;
  setLocationEnabled: (enabled: boolean) => void;
  setNotificationsEnabled: (enabled: boolean) => void;
  updateLastSync: () => void;
  resetSettings: () => void;
}

type SettingsStore = SettingsState & SettingsActions;

const defaultUnits: Units = {
  temperature: 'celsius',
  distance: 'km',
  weight: 'kg',
  time: '24h',
  date: 'YYYY-MM-DD',
};

const initialState: SettingsState = {
  units: defaultUnits,
  notifications: true,
  darkMode: false,
  autoSync: true,
  gpsInterval: 5000,
  heartRateThreshold: 180,
  lowBatteryThreshold: 20,
  isLoading: false,
  isFirstLaunch: true,
  hasCompletedOnboarding: false,
  lastSyncTime: null,
  theme: 'light',
  isBLEEnabled: true,
  isLocationEnabled: true,
  isNotificationsEnabled: true,
};

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      ...initialState,

      setUnits: (units) =>
        set((state) => ({
          units: { ...state.units, ...units },
        })),

      setTemperatureUnit: (unit) =>
        set((state) => ({
          units: { ...state.units, temperature: unit },
        })),

      setDistanceUnit: (unit) =>
        set((state) => ({
          units: { ...state.units, distance: unit },
        })),

      setWeightUnit: (unit) =>
        set((state) => ({
          units: { ...state.units, weight: unit },
        })),

      setTimeFormat: (format) =>
        set((state) => ({
          units: { ...state.units, time: format },
        })),

      setDateFormat: (format) =>
        set((state) => ({
          units: { ...state.units, date: format },
        })),

      setNotifications: (notifications) => set({ notifications }),

      setDarkMode: (darkMode) => set({ darkMode }),

      setTheme: (theme) => set({ theme, darkMode: theme === 'dark' }),

      setAutoSync: (autoSync) => set({ autoSync }),

      setGPSInterval: (gpsInterval) => set({ gpsInterval }),

      setHeartRateThreshold: (heartRateThreshold) =>
        set({ heartRateThreshold }),

      setLowBatteryThreshold: (lowBatteryThreshold) =>
        set({ lowBatteryThreshold }),

      setFirstLaunch: (isFirstLaunch) => set({ isFirstLaunch }),

      setOnboardingComplete: () =>
        set({
          hasCompletedOnboarding: true,
          isFirstLaunch: false,
        }),

      setBLEEnabled: (isBLEEnabled) => set({ isBLEEnabled }),

      setLocationEnabled: (isLocationEnabled) => set({ isLocationEnabled }),

      setNotificationsEnabled: (isNotificationsEnabled) =>
        set({ isNotificationsEnabled }),

      updateLastSync: () =>
        set({ lastSyncTime: new Date().toISOString() }),

      resetSettings: () => set(initialState),
    }),
    {
      name: 'settings-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        units: state.units,
        notifications: state.notifications,
        darkMode: state.darkMode,
        autoSync: state.autoSync,
        gpsInterval: state.gpsInterval,
        heartRateThreshold: state.heartRateThreshold,
        lowBatteryThreshold: state.lowBatteryThreshold,
        hasCompletedOnboarding: state.hasCompletedOnboarding,
        theme: state.theme,
        isBLEEnabled: state.isBLEEnabled,
        isLocationEnabled: state.isLocationEnabled,
        isNotificationsEnabled: state.isNotificationsEnabled,
      }),
    }
  )
);

export const selectUnits = (state: SettingsStore) => state.units;
export const selectIsDarkMode = (state: SettingsStore) => state.darkMode;
export const selectHasCompletedOnboarding = (state: SettingsStore) =>
  state.hasCompletedOnboarding;