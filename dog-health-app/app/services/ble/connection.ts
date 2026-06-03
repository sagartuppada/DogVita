/**
 * BLE Connection Manager - Handles device connections
 */

import { BleManager, Device, Characteristic, ConnectionOptions } from 'react-native-ble-plx';
import { BLEConnectionState, BLEConnectionStatus } from '../../types';

const CONNECTION_OPTIONS: ConnectionOptions = {
  autoConnect: true,
  requestMTU: 512,
};

class BLEConnectionManager {
  private static instance: BLEConnectionManager;
  private manager: BleManager;
  private connectedDevice: Device | null = null;
  private connectionListeners: Array<(state: BLEConnectionState) => void> = [];
  private currentState: BLEConnectionState = {
    status: 'disconnected',
    deviceId: null,
    deviceName: null,
    lastConnected: null,
    lastDisconnected: null,
    error: null,
  };

  private constructor() {
    this.manager = new BleManager();
  }

  public static getInstance(): BLEConnectionManager {
    if (!BLEConnectionManager.instance) {
      BLEConnectionManager.instance = new BLEConnectionManager();
    }
    return BLEConnectionManager.instance;
  }

  async connect(deviceId: string): Promise<boolean> {
    try {
      this.updateState({ status: 'connecting', error: null });

      const device = await this.manager.connectToDevice(deviceId, CONNECTION_OPTIONS);
      await device.discoverAllServicesAndCharacteristics();
      
      this.connectedDevice = device;
      
      this.updateState({
        status: 'connected',
        deviceId: device.id,
        deviceName: device.name || 'Unknown Device',
        lastConnected: new Date().toISOString(),
        error: null,
      });

      device.onDisconnected(() => {
        this.handleDisconnection();
      });

      return true;
    } catch (error) {
      const errorMessage = (error as Error).message;
      this.updateState({
        status: 'error',
        error: errorMessage,
      });
      return false;
    }
  }

  async disconnect(): Promise<void> {
    if (this.connectedDevice) {
      try {
        this.updateState({ status: 'disconnecting' });
        await this.connectedDevice.cancelConnection();
        this.handleDisconnection();
      } catch (error) {
        this.updateState({
          status: 'error',
          error: (error as Error).message,
        });
      }
    }
  }

  private handleDisconnection(): void {
    this.connectedDevice = null;
    this.updateState({
      status: 'disconnected',
      deviceId: null,
      deviceName: null,
      lastDisconnected: new Date().toISOString(),
    });
  }

  async readCharacteristic(serviceUUID: string, characteristicUUID: string): Promise<Characteristic | null> {
    if (!this.connectedDevice) {
      console.warn('No device connected');
      return null;
    }

    try {
      return await this.connectedDevice.readCharacteristicForService(
        serviceUUID,
        characteristicUUID
      );
    } catch (error) {
      console.error('Error reading characteristic:', error);
      return null;
    }
  }

  async writeCharacteristic(
    serviceUUID: string,
    characteristicUUID: string,
    data: string,
    encode: boolean = true
  ): Promise<boolean> {
    if (!this.connectedDevice) {
      console.warn('No device connected');
      return false;
    }

    try {
      const value = encode ? btoa(data) : data;
      await this.connectedDevice.writeCharacteristicWithResponseForService(
        serviceUUID,
        characteristicUUID,
        value
      );
      return true;
    } catch (error) {
      console.error('Error writing characteristic:', error);
      return false;
    }
  }

  async enableNotifications(serviceUUID: string, characteristicUUID: string): Promise<boolean> {
    if (!this.connectedDevice) {
      console.warn('No device connected');
      return false;
    }

    try {
      await this.connectedDevice.setNotifyValueForCharacteristic(
        serviceUUID,
        characteristicUUID,
        true
      );
      return true;
    } catch (error) {
      console.error('Error enabling notifications:', error);
      return false;
    }
  }

  async disableNotifications(serviceUUID: string, characteristicUUID: string): Promise<boolean> {
    if (!this.connectedDevice) {
      return false;
    }

    try {
      await this.connectedDevice.setNotifyValueForCharacteristic(
        serviceUUID,
        characteristicUUID,
        false
      );
      return true;
    } catch (error) {
      console.error('Error disabling notifications:', error);
      return false;
    }
  }

  onConnectionStateChange(callback: (state: BLEConnectionState) => void): () => void {
    this.connectionListeners.push(callback);
    return () => {
      this.connectionListeners = this.connectionListeners.filter((l) => l !== callback);
    };
  }

  private updateState(partial: Partial<BLEConnectionState>): void {
    this.currentState = { ...this.currentState, ...partial };
    this.connectionListeners.forEach((listener) => listener(this.currentState));
  }

  getConnectionState(): BLEConnectionState {
    return this.currentState;
  }

  getConnectedDevice(): Device | null {
    return this.connectedDevice;
  }

  isDeviceConnected(): boolean {
    return this.connectedDevice !== null && this.currentState.status === 'connected';
  }

  async reconnect(): Promise<boolean> {
    if (!this.currentState.deviceId) {
      return false;
    }
    return this.connect(this.currentState.deviceId);
  }

  destroy(): void {
    if (this.connectedDevice) {
      this.connectedDevice.cancelConnection();
    }
    this.manager.destroy();
  }
}

export const bleConnectionManager = BLEConnectionManager.getInstance();
export default bleConnectionManager;