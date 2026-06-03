export { supabase, isConfigured } from './supabase';

export const config = {
  app: {
    name: 'Dog Health App',
    version: '1.0.0',
  },
  ble: {
    serviceUUID: process.env.EXPO_PUBLIC_BLE_SERVICE_UUID || '12345678-1234-1234-1234-123456789abc',
    heartRateServiceUUID: process.env.EXPO_PUBLIC_BLE_HEART_RATE_UUID || '180d',
    gpsServiceUUID: process.env.EXPO_PUBLIC_BLE_GPS_UUID || '12345678-1234-1234-1234-123456789001',
    temperatureServiceUUID: process.env.EXPO_PUBLIC_BLE_TEMPERATURE_UUID || '12345678-1234-1234-1234-123456789002',
    batteryServiceUUID: process.env.EXPO_PUBLIC_BLE_BATTERY_UUID || '12345678-1234-1234-1234-123456789003',
    activityServiceUUID: process.env.EXPO_PUBLIC_BLE_ACTIVITY_UUID || '12345678-1234-1234-1234-123456789004',
  },
  alerts: {
    heartRateHighThreshold: parseInt(process.env.EXPO_PUBLIC_HEART_RATE_ALERT_THRESHOLD || '180'),
    lowBatteryThreshold: parseInt(process.env.EXPO_PUBLIC_LOW_BATTERY_THRESHOLD || '20'),
  },
  tracking: {
    gpsUpdateInterval: parseInt(process.env.EXPO_PUBLIC_GPS_UPDATE_INTERVAL_MS || '5000'),
    geofenceRadius: parseInt(process.env.EXPO_PUBLIC_GEOFENCE_RADIUS_METERS || '100'),
  },
};

export default config;