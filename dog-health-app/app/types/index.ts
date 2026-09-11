export * from './dog';
export { type HealthMetrics, type HeartRateData, type HeartRateZone, type TemperatureData, type ActivityData, type SleepData, type BatteryData, type LocationData, type Geofence, type GeofenceAlert, type HealthAlert, type AlertType, type AlertSeverity, type Route } from './health';
export * from './ble';
export { type AuthUser, type AuthSession, type Database } from './api';

// ponytail: only types actually imported by other files
export type TemperatureUnit = 'celsius' | 'fahrenheit';
export type DistanceUnit = 'km' | 'mi';
export type WeightUnit = 'kg' | 'lb';
export type TimeFormat = '12h' | '24h';
export type DateFormat = 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD';

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
  autoSync: boolean;
  gpsInterval: number;
  heartRateThreshold: number;
  lowBatteryThreshold: number;
}
