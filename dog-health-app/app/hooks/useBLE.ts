/**
 * useBLE - Hook for BLE operations
 */

import { useState, useEffect, useCallback } from 'react';
import { useBLEStore } from '../store';
import { bleService } from '../services/ble';
import { BLEDevice, BLEConnectionState } from '../types';

export const useBLE = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [devices, setDevices] = useState<BLEDevice[]>([]);

  const isConnected = useBLEStore((s) => s.isConnected);
  const connectionStatus = useBLEStore((s) => s.connectionStatus);
  const connectedDeviceId = useBLEStore((s) => s.connectedDeviceId);
  const connectedDeviceName = useBLEStore((s) => s.connectedDeviceName);
  const lastError = useBLEStore((s) => s.lastError);

  const startScan = useCallback(async () => {
    setIsScanning(true);
    setDevices([]);
    try {
      await bleService.startScanning();
    } finally {
      setIsScanning(false);
    }
  }, []);

  const stopScan = useCallback(() => {
    bleService.stopScanning();
    setIsScanning(false);
  }, []);

  const connect = useCallback(async (deviceId: string) => {
    return await bleService.connect(deviceId);
  }, []);

  const disconnect = useCallback(async () => {
    return await bleService.disconnect();
  }, []);

  useEffect(() => {
    const unsubscribe = bleService.onDevicesDiscovered((discoveredDevices) => {
      setDevices(discoveredDevices);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    const unsubscribe = bleService.onConnectionChange((state: BLEConnectionState) => {
      useBLEStore.setState({
        isConnected: state.status === 'connected',
        connectionStatus: state.status,
        connectedDeviceId: state.deviceId,
        connectedDeviceName: state.deviceName,
        lastError: state.error,
      });
    });
    return unsubscribe;
  }, []);

  return {
    isScanning,
    devices,
    isConnected,
    connectionStatus,
    connectedDeviceId,
    connectedDeviceName,
    lastError,
    startScan,
    stopScan,
    connect,
    disconnect,
  };
};

export default useBLE;