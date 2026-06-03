/**
 * BLE (Bluetooth Low Energy) type definitions
 */

import { Device, Characteristic, Service } from 'react-native-ble-plx';

export interface BLEDevice extends Device {
  rssi: number;
  isConnectable: boolean;
  manufacturerData?: string;
}

export interface BLEService extends Service {
  characteristics?: BLECharacteristic[];
}

export interface BLECharacteristic extends Characteristic {
  isReadable: boolean;
  isWritable: boolean;
  isNotifiable: boolean;
}

export type BLEConnectionStatus = 
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'disconnecting'
  | 'error';

export interface BLEConnectionState {
  status: BLEConnectionStatus;
  deviceId: string | null;
  deviceName: string | null;
  lastConnected: string | null;
  lastDisconnected: string | null;
  error: string | null;
}

export interface BLEScanState {
  isScanning: boolean;
  devices: BLEDevice[];
  lastScan: string | null;
  error: string | null;
}

export interface BLEPacket {
  type: PacketType;
  timestamp: number;
  data: Uint8Array;
  deviceId: string;
}

export type PacketType = 
  | 'heart_rate'
  | 'gps'
  | 'temperature'
  | 'battery'
  | 'activity'
  | 'config'
  | 'command';

export interface HeartRatePacket {
  type: 'heart_rate';
  bpm: number;
  sequence: number;
}

export interface GPSPacket {
  type: 'gps';
  latitude: number;
  longitude: number;
  altitude: number;
  accuracy: number;
  speed: number;
  heading: number;
  satellites: number;
}

export interface TemperaturePacket {
  type: 'temperature';
  celsius: number;
  humidity: number;
}

export interface BatteryPacket {
  type: 'battery';
  level: number;
  voltage: number;
  isCharging: boolean;
}

export interface ActivityPacket {
  type: 'activity';
  steps: number;
  activeMinutes: number;
  distance: number;
}

export type BLEDataPacket = 
  | HeartRatePacket
  | GPSPacket
  | TemperaturePacket
  | BatteryPacket
  | ActivityPacket;

export interface BLEServiceConfig {
  serviceUUID: string;
  characteristicUUIDs: {
    [key: string]: string;
  };
}

export interface BLECommand {
  type: 'start_monitoring' | 'stop_monitoring' | 'set_interval' | 'calibrate' | 'reset';
  payload?: unknown;
}

export interface BLEAdvertisingData {
  name: string;
  txPowerLevel: number;
  manufacturerId: string;
  serviceUUIDs: string[];
  rawData?: ArrayBuffer;
}

export interface BLEParsedData {
  deviceId: string;
  timestamp: number;
  metrics: {
    heartRate?: number;
    temperature?: number;
    humidity?: number;
    battery?: number;
    gps?: {
      latitude: number;
      longitude: number;
      altitude: number;
    };
    activity?: {
      steps: number;
      activeMinutes: number;
      distance: number;
    };
  };
}

export const DEFAULT_BLE_SERVICE_UUID = '12345678-1234-1234-1234-123456789abc';
export const DEFAULT_BLE_HEART_RATE_SERVICE = '180d';
export const DEFAULT_BLE_GPS_SERVICE = '12345678-1234-1234-1234-123456789001';
export const DEFAULT_BLE_TEMPERATURE_SERVICE = '12345678-1234-1234-1234-123456789002';
export const DEFAULT_BLE_BATTERY_SERVICE = '12345678-1234-1234-1234-123456789003';
export const DEFAULT_BLE_ACTIVITY_SERVICE = '12345678-1234-1234-1234-123456789004';