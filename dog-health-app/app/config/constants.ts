/**
 * App constants - replaces expo-constants
 * Values come from .env via @env (react-native-dotenv)
 */
// @ts-ignore - react-native-dotenv module
import {
  EXPO_PUBLIC_SUPABASE_URL,
  EXPO_PUBLIC_SUPABASE_ANON_KEY,
  EXPO_PUBLIC_API_URL,
  EXPO_PUBLIC_BLE_SERVICE_UUID,
  EXPO_PUBLIC_BLE_HEART_RATE_UUID,
  EXPO_PUBLIC_BLE_GPS_UUID,
  EXPO_PUBLIC_BLE_TEMPERATURE_UUID,
  EXPO_PUBLIC_BLE_BATTERY_UUID,
  EXPO_PUBLIC_BLE_ACTIVITY_UUID,
} from '@env';

export const Constants = {
  expoConfig: {
    extra: {
      supabaseUrl: EXPO_PUBLIC_SUPABASE_URL || '',
      supabaseAnonKey: EXPO_PUBLIC_SUPABASE_ANON_KEY || '',
      apiUrl: EXPO_PUBLIC_API_URL || 'https://api.doghealthapp.com',
      bleServiceUUID: EXPO_PUBLIC_BLE_SERVICE_UUID || '12345678-1234-1234-1234-123456789abc',
      bleHeartRateUUID: EXPO_PUBLIC_BLE_HEART_RATE_UUID || '',
      bleGpsUUID: EXPO_PUBLIC_BLE_GPS_UUID || '',
      bleTemperatureUUID: EXPO_PUBLIC_BLE_TEMPERATURE_UUID || '',
      bleBatteryUUID: EXPO_PUBLIC_BLE_BATTERY_UUID || '',
      bleActivityUUID: EXPO_PUBLIC_BLE_ACTIVITY_UUID || '',
    },
  },
};

export default Constants;
