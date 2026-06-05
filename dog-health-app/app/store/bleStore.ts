/**
 * BLE store - manages Bluetooth Low Energy connection and device state
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BLEDevice, BLEConnectionStatus, BLEParsedData } from '../types';

interface BLEState {
  isScanning: boolean;
  isConnected: boolean;
  connectionStatus: BLEConnectionStatus;
  connectedDeviceId: string | null;
  connectedDeviceName: string | null;
  discoveredDevices: BLEDevice[];
  lastConnected: string | null;
  lastError: string | null;
  recentData: BLEParsedData[];
  signalStrength: number | null;
}

interface BLEActions {
  setScanning: (isScanning: boolean) => void;
  addDiscoveredDevice: (device: BLEDevice) => void;
  clearDiscoveredDevices: () => void;
  setConnected: (deviceId: string, deviceName: string) => void;
  setDisconnected: () => void;
  setConnectionStatus: (status: BLEConnectionStatus) => void;
  addReceivedData: (data: BLEParsedData) => void;
  clearRecentData: () => void;
  setSignalStrength: (strength: number) => void;
  setError: (error: string | null) => void;
  reset: () => void;
  loadDemoData: () => void;
}

type BLEStore = BLEState & BLEActions;

const initialState: BLEState = {
  isScanning: false,
  isConnected: false,
  connectionStatus: 'disconnected',
  connectedDeviceId: null,
  connectedDeviceName: null,
  discoveredDevices: [],
  lastConnected: null,
  lastError: null,
  recentData: [],
  signalStrength: null,
};

export const useBLEStore = create<BLEStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      setScanning: (isScanning) => set({ isScanning }),

      addDiscoveredDevice: (device) =>
        set((state) => {
          const exists = state.discoveredDevices.some((d) => d.id === device.id);
          if (exists) {
            return {
              discoveredDevices: state.discoveredDevices.map((d) =>
                d.id === device.id ? device : d
              ),
            };
          }
          return {
            discoveredDevices: [...state.discoveredDevices, device],
          };
        }),

      clearDiscoveredDevices: () => set({ discoveredDevices: [] }),

      setConnected: (deviceId, deviceName) =>
        set({
          isConnected: true,
          connectionStatus: 'connected',
          connectedDeviceId: deviceId,
          connectedDeviceName: deviceName,
          lastConnected: new Date().toISOString(),
          lastError: null,
        }),

      setDisconnected: () =>
        set({
          isConnected: false,
          connectionStatus: 'disconnected',
          connectedDeviceId: null,
          connectedDeviceName: null,
          signalStrength: null,
        }),

      setConnectionStatus: (connectionStatus) => set({ connectionStatus }),

      addReceivedData: (data) =>
        set((state) => ({
          recentData: [...state.recentData.slice(-99), data],
        })),

      clearRecentData: () => set({ recentData: [] }),

      setSignalStrength: (signalStrength) => set({ signalStrength }),

      setError: (lastError) => set({ lastError, connectionStatus: 'error' }),

      reset: () => set(initialState),

      loadDemoData: () =>
        set({
          isConnected: true,
          connectionStatus: 'connected',
          connectedDeviceId: 'demo_collar_1',
          connectedDeviceName: 'DogVita Collar',
          signalStrength: -65,
          lastConnected: new Date().toISOString(),
        }),
    }),
    {
      name: 'ble-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        connectedDeviceId: state.connectedDeviceId,
        connectedDeviceName: state.connectedDeviceName,
      }),
    }
  )
);

export const selectIsConnected = (state: BLEStore) => state.isConnected;
export const selectConnectionStatus = (state: BLEStore) => state.connectionStatus;
export const selectDiscoveredDevices = (state: BLEStore) => state.discoveredDevices;