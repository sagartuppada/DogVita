/**
 * Type exports
 */

export * from './dog';
export { type HealthMetrics, type HeartRateData, type HeartRateZone, type TemperatureData, type ActivityData, type SleepData, type BatteryData, type LocationData, type Geofence, type GeofenceAlert, type HealthAlert, type AlertType, type AlertSeverity, type HealthTrend, type Route } from './health';
export * from './ble';
export * from './navigation';
export * from './api';

// Common utility types
export type LoadingState = 'idle' | 'loading' | 'succeeded' | 'failed';

export interface SelectOption<T = string> {
  label: string;
  value: T;
}

export interface KeyValuePair<K = string, V = unknown> {
  key: K;
  value: V;
}

export type Nullable<T> = T | null;
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export interface DateRange {
  start: string;
  end: string;
}

export interface TimeSlot {
  start: string;
  end: string;
}

export interface Duration {
  hours: number;
  minutes: number;
  seconds: number;
}

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface Region {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

export interface MapBounds {
  northEast: Coordinates;
  southWest: Coordinates;
}

export type TimeFormat = '12h' | '24h';
export type DateFormat = 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD';
export type TemperatureUnit = 'celsius' | 'fahrenheit';
export type DistanceUnit = 'km' | 'mi';
export type WeightUnit = 'kg' | 'lb';

export interface Units {
  temperature: TemperatureUnit;
  distance: DistanceUnit;
  weight: WeightUnit;
  time: TimeFormat;
  date: DateFormat;
}

export interface UserSettings {
  units: Units;
  notifications: boolean;
  darkMode: boolean;
  autoSync: boolean;
  gpsInterval: number;
  heartRateThreshold: number;
  lowBatteryThreshold: number;
}

export interface AppInfo {
  version: string;
  build: string;
  name: string;
}