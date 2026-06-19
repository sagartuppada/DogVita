import { supabase, isSupabaseConfigured } from './supabase';

interface DeviceRow {
  id: string;
  dog_id: string;
  device_name: string;
  ble_mac_address: string;
  firmware_version: string;
  is_connected: boolean;
  last_seen_at: string | null;
  created_at: string;
}

export interface Device {
  id: string;
  dogId: string;
  deviceName: string;
  bleMacAddress: string;
  firmwareVersion: string;
  isConnected: boolean;
  lastSeenAt: string | null;
  createdAt: string;
}

export const devicesService = {
  async getDevicesForDog(dogId: string): Promise<Device[]> {
    if (!isSupabaseConfigured()) return [];

    const { data, error } = await supabase
      .from('devices')
      .select('*')
      .eq('dog_id', dogId);

    if (error) {
      console.error('[devicesService.getDevicesForDog]', error);
      return [];
    }

    return (data ?? []).map(mapDeviceRow);
  },

  async createDevice(device: Omit<Device, 'id' | 'createdAt'>): Promise<Device | null> {
    if (!isSupabaseConfigured()) return null;

    const { data, error } = await supabase
      .from('devices')
      .insert([
        {
          dog_id: device.dogId,
          device_name: device.deviceName,
          ble_mac_address: device.bleMacAddress,
          firmware_version: device.firmwareVersion,
          is_connected: device.isConnected,
          last_seen_at: device.lastSeenAt,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('[devicesService.createDevice]', error);
      return null;
    }

    return mapDeviceRow(data);
  },

  async updateConnectionStatus(
    deviceId: string,
    isConnected: boolean
  ): Promise<boolean> {
    if (!isSupabaseConfigured()) return false;

    const { error } = await supabase
      .from('devices')
      .update({
        is_connected: isConnected,
        last_seen_at: new Date().toISOString(),
      })
      .eq('id', deviceId);

    if (error) {
      console.error('[devicesService.updateConnectionStatus]', error);
      return false;
    }

    return true;
  },
};

function mapDeviceRow(row: DeviceRow): Device {
  return {
    id: row.id,
    dogId: row.dog_id,
    deviceName: row.device_name,
    bleMacAddress: row.ble_mac_address,
    firmwareVersion: row.firmware_version,
    isConnected: row.is_connected,
    lastSeenAt: row.last_seen_at,
    createdAt: row.created_at,
  };
}

export default devicesService;