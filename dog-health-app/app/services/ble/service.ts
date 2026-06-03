/**
 * BLE Service Layer - Main BLE service combining scanner, connection, and parser
 */

import { Device } from 'react-native-ble-plx';
import { bleScanner } from './scanner';
import { bleConnectionManager } from './connection';
import { blePacketParser } from './packetParser';
import { BLEDevice, BLEParsedData, BLEConnectionState } from '../../types';

export class BLEService {
  private static instance: BLEService;

  static getInstance(): BLEService {
    if (!BLEService.instance) {
      BLEService.instance = new BLEService(bleScanner, bleConnectionManager, blePacketParser);
    }
    return BLEService.instance;
  }

  constructor(
    private scanner: typeof bleScanner,
    private connection: typeof bleConnectionManager,
    private parser: typeof blePacketParser
  ) {}

  async startScanning(): Promise<void> {
    return this.scanner.startScan();
  }

  stopScanning(): void {
    this.scanner.stopScan();
  }

  getDiscoveredDevices(): BLEDevice[] {
    return this.scanner.getDiscoveredDevices();
  }

  async connect(deviceId: string): Promise<boolean> {
    return this.connection.connect(deviceId);
  }

  async disconnect(): Promise<void> {
    return this.connection.disconnect();
  }

  isConnected(): boolean {
    return this.connection.isDeviceConnected();
  }

  parsePacket(data: string, deviceId: string): BLEParsedData | null {
    return this.parser.parse(data, deviceId);
  }

  onConnectionChange(callback: (state: BLEConnectionState) => void): () => void {
    return this.connection.onConnectionStateChange(callback);
  }

  onDevicesDiscovered(callback: (devices: BLEDevice[]) => void): () => void {
    return this.scanner.onDevicesDiscovered(callback);
  }

  getConnectionState(): BLEConnectionState {
    return this.connection.getConnectionState();
  }
}