/**
 * BLE Scanner - Discovers nearby BLE devices
 */

import { BleManager, Device } from 'react-native-ble-plx';
import { Platform, PermissionsAndroid } from 'react-native';
import { BLEDevice } from '../../types';
// @ts-ignore - react-native-dotenv module
import { EXPO_PUBLIC_BLE_SERVICE_UUID } from '@env';

const SERVICE_UUIDS = [
  EXPO_PUBLIC_BLE_SERVICE_UUID || '12345678-1234-1234-1234-123456789abc',
];

const SCAN_TIMEOUT = 10000; // 10 seconds

class BLEScanner {
  private static instance: BLEScanner;
  private manager: BleManager;
  private isScanning: boolean = false;
  private listeners: Array<(devices: BLEDevice[]) => void> = [];
  private discoveredDevices: Map<string, BLEDevice> = new Map();

  private constructor() {
    this.manager = new BleManager();
  }

  public static getInstance(): BLEScanner {
    if (!BLEScanner.instance) {
      BLEScanner.instance = new BLEScanner();
    }
    return BLEScanner.instance;
  }

  async startScan(): Promise<void> {
    if (this.isScanning) {
      console.warn('BLE scan already in progress');
      return;
    }

    this.isScanning = true;
    this.discoveredDevices.clear();

    return new Promise((resolve, reject) => {
      this.manager.startDeviceScan(
        SERVICE_UUIDS,
        { allowDuplicates: false },
        (error, device) => {
          if (error) {
            this.isScanning = false;
            reject(error);
            return;
          }

          if (device) {
            const bleDevice = this.convertToBLEDevice(device);
            this.discoveredDevices.set(device.id, bleDevice);
            this.notifyListeners();
          }
        }
      );

      setTimeout(() => {
        this.stopScan();
        resolve();
      }, SCAN_TIMEOUT);
    });
  }

  stopScan(): void {
    if (this.isScanning) {
      this.manager.stopDeviceScan();
      this.isScanning = false;
    }
  }

  getDiscoveredDevices(): BLEDevice[] {
    return Array.from(this.discoveredDevices.values());
  }

  onDevicesDiscovered(callback: (devices: BLEDevice[]) => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== callback);
    };
  }

  private notifyListeners(): void {
    const devices = this.getDiscoveredDevices();
    this.listeners.forEach((listener) => listener(devices));
  }

  private convertToBLEDevice(device: Device): BLEDevice {
    return {
      id: device.id,
      name: device.name,
      rssi: device.rssi || -100,
      isConnectable: true,
      manufacturerData: undefined,
      localName: device.localName,
      txPowerLevel: device.txPowerLevel,
      serviceUUIDs: device.serviceUUIDs,
      serviceData: device.serviceData,
      solicitedServiceUUIDs: device.solicitedServiceUUIDs,
      mtu: device.mtu,
    };
  }

  async requestPermissions(): Promise<boolean> {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Bluetooth Permission',
          message: 'This app needs Bluetooth to connect to the dog collar.',
          buttonPositive: 'OK',
          buttonNegative: 'Cancel',
        }
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }
    return true;
  }

  async checkBluetoothState(): Promise<'PoweredOn' | 'PoweredOff' | 'Unauthorized' | 'Unsupported'> {
    const state = await this.manager.state();
    return state as 'PoweredOn' | 'PoweredOff' | 'Unauthorized' | 'Unsupported';
  }

  destroy(): void {
    this.stopScan();
    this.manager.destroy();
  }
}

export const bleScanner = BLEScanner.getInstance();
export default bleScanner;