/**
 * App constants - replaces expo-constants
 * Values come from .env via process.env.EXPO_PUBLIC_*
 */

export const Constants = {
  expoConfig: {
    extra: {
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL || '',
      supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '',
      apiUrl: process.env.EXPO_PUBLIC_API_URL || 'https://api.doghealthapp.com',
      bleServiceUUID: process.env.EXPO_PUBLIC_BLE_SERVICE_UUID || '12345678-1234-1234-1234-123456789abc',
      bleHeartRateUUID: process.env.EXPO_PUBLIC_BLE_HEART_RATE_UUID || '',
      bleGpsUUID: process.env.EXPO_PUBLIC_BLE_GPS_UUID || '',
      bleTemperatureUUID: process.env.EXPO_PUBLIC_BLE_TEMPERATURE_UUID || '',
      bleBatteryUUID: process.env.EXPO_PUBLIC_BLE_BATTERY_UUID || '',
      bleActivityUUID: process.env.EXPO_PUBLIC_BLE_ACTIVITY_UUID || '',
    },
  },
};

export default Constants;
