/**
 * BLE (Bluetooth Low Energy) type definitions
 */

export interface BLEDevice {
  id: string;
  name: string | null;
  rssi: number;
  isConnectable: boolean;
  manufacturerData?: string | null;
  localName?: string | null;
  txPowerLevel?: number | null;
  serviceUUIDs?: string[] | null;
  serviceData?: { [uuid: string]: string } | null;
  solicitedServiceUUIDs?: string[] | null;
  mtu?: number;
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
