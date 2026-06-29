/**
 * Health metrics type definitions
 */

export interface HealthMetrics {
  dogId: string;
  timestamp: string;
  heartRate?: HeartRateData;
  temperature?: TemperatureData;
  activity?: ActivityData;
  sleep?: SleepData;
  battery?: BatteryData;
  location?: LocationData;
}

export interface HeartRateData {
  dogId?: string;
  bpm: number;
  variability?: number;
  zone: HeartRateZone;
  timestamp: string;
}

export type HeartRateZone = 'rest' | 'light' | 'moderate' | 'active' | 'peak';

export interface TemperatureData {
  dogId?: string;
  celsius: number;
  fahrenheit: number;
  isAbnormal: boolean;
  timestamp: string;
}

export interface ActivityData {
  dogId?: string;
  steps: number;
  distance: number;
  activeMinutes: number;
  calories: number;
  type: ActivityType;
  timestamp: string;
}

export type ActivityType = 'resting' | 'walking' | 'running' | 'playing' | 'eating' | 'other';

export interface SleepData {
  dogId?: string;
  duration: number;
  quality: number;
  deepSleep: number;
  lightSleep: number;
  awake: number;
  startTime: string;
  endTime?: string;
}

export interface BatteryData {
  level: number;
  isCharging: boolean;
  estimatedHours: number;
  timestamp: string;
}

export interface LocationData {
  latitude: number;
  longitude: number;
  altitude?: number;
  accuracy: number;
  speed?: number;
  heading?: number;
  timestamp: string;
}

export interface Geofence {
  id: string;
  dogId: string;
  ownerId: string;
  name: string;
  center: {
    latitude: number;
    longitude: number;
  };
  radius: number;
  isActive: boolean;
  alertsEnabled: boolean;
  createdAt?: string;
  timestamp?: string;
}

export interface GeofenceAlert {
  id: string;
  dogId: string;
  geofenceId: string;
  type: 'enter' | 'exit';
  location: LocationData;
  timestamp: string;
  acknowledged: boolean;
}

export interface HealthAlert {
  id: string;
  dogId: string;
  ownerId?: string;
  type: AlertType;
  severity: AlertSeverity;
  message: string;
  metricValue?: number;
  threshold?: number;
  timestamp: string;
  acknowledged: boolean;
  resolvedAt?: string;
}

export type AlertType = 
  | 'heart_rate_high'
  | 'heart_rate_low'
  | 'temperature_high'
  | 'temperature_low'
  | 'battery_low'
  | 'geofence_enter'
  | 'geofence_exit'
  | 'activity_abnormal'
  | 'sleep_disruption'
  | 'device_disconnect';

export type AlertSeverity = 'info' | 'warning' | 'critical';

export interface HealthTrend {
  dogId: string;
  metric: string;
  data: Array<{
    timestamp: string;
    value: number;
  }>;
  average: number;
  min: number;
  max: number;
  trend: 'increasing' | 'decreasing' | 'stable';
}

export interface Route {
  id: string;
  dogId: string;
  name: string;
  startTime: string;
  endTime?: string;
  locations: LocationData[];
  totalDistance: number;
  duration: number;
}