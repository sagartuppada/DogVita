import { supabase, isSupabaseConfigured } from './supabase';
import type { LocationData, Geofence } from '../../types';

export const trackingService = {
  async getLocations(dogId: string, limit = 500): Promise<LocationData[]> {
    if (!isSupabaseConfigured()) return [];

    const { data, error } = await supabase
      .from('locations')
      .select('*')
      .eq('dog_id', dogId)
      .order('recorded_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[trackingService.getLocations]', error);
      return [];
    }

    return (data ?? []).map((row) => ({
      latitude: row.latitude as number,
      longitude: row.longitude as number,
      altitude: undefined,
      accuracy: (row.accuracy_meters as number) ?? 0,
      speed: row.speed_kmh as number | undefined,
      heading: undefined,
      timestamp: row.recorded_at as string,
    }));
  },

  async addLocation(dogId: string, location: LocationData): Promise<boolean> {
    if (!isSupabaseConfigured()) return false;

    const { error } = await supabase.from('locations').insert([
      {
        dog_id: dogId,
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy_meters: location.accuracy,
        speed_kmh: location.speed,
        recorded_at: location.timestamp,
      },
    ]);

    if (error) {
      console.error('[trackingService.addLocation]', error);
      return false;
    }
    return true;
  },

  async clearOldLocations(dogId: string, keepLast = 5000): Promise<boolean> {
    if (!isSupabaseConfigured()) return false;

    const { data, error } = await supabase
      .from('locations')
      .select('id')
      .eq('dog_id', dogId)
      .order('recorded_at', { ascending: false });

    if (error || !data) return false;
    if (data.length <= keepLast) return true;

    const idsToDelete = data.slice(keepLast).map((r) => r.id);

    const { error: deleteError } = await supabase
      .from('locations')
      .delete()
      .in('id', idsToDelete);

    if (deleteError) {
      console.error('[trackingService.clearOldLocations]', deleteError);
      return false;
    }
    return true;
  },

  async getGeofences(userId: string): Promise<Geofence[]> {
    if (!isSupabaseConfigured()) return [];

    const { data, error } = await supabase
      .from('geofences')
      .select('*')
      .eq('owner_id', userId)
      .eq('is_active', true);

    if (error) {
      console.error('[trackingService.getGeofences]', error);
      return [];
    }

    return (data ?? []).map(mapGeofenceRow);
  },

  async createGeofence(
    geofence: Omit<Geofence, 'id' | 'createdAt'>
  ): Promise<Geofence | null> {
    if (!isSupabaseConfigured()) return null;

    const { data, error } = await supabase
      .from('geofences')
      .insert([
        {
          dog_id: geofence.dogId,
          owner_id: geofence.ownerId,
          name: geofence.name,
          latitude: geofence.center.latitude,
          longitude: geofence.center.longitude,
          radius_meters: geofence.radius,
          is_active: true,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('[trackingService.createGeofence]', error);
      return null;
    }

    return mapGeofenceRow(data as Record<string, unknown>);
  },

  async deleteGeofence(geofenceId: string): Promise<boolean> {
    if (!isSupabaseConfigured()) return false;

    const { error } = await supabase
      .from('geofences')
      .delete()
      .eq('id', geofenceId);

    if (error) {
      console.error('[trackingService.deleteGeofence]', error);
      return false;
    }
    return true;
  },
};

function mapGeofenceRow(row: Record<string, unknown>): Geofence {
  return {
    id: row.id as string,
    dogId: row.dog_id as string,
    ownerId: row.owner_id as string,
    name: row.name as string,
    center: {
      latitude: row.latitude as number,
      longitude: row.longitude as number,
    },
    radius: row.radius_meters as number,
    isActive: row.is_active as boolean,
    alertsEnabled: true,
    createdAt: row.created_at as string,
  };
}

export default trackingService;