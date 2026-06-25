import { supabase, isSupabaseConfigured } from './supabase';
import type { LocationData, Geofence, Route } from '../../types';

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

  async updateGeofence(geofence: Geofence): Promise<boolean> {
    if (!isSupabaseConfigured()) return false;

    const { error } = await supabase
      .from('geofences')
      .update({
        name: geofence.name,
        latitude: geofence.center.latitude,
        longitude: geofence.center.longitude,
        radius_meters: geofence.radius,
        is_active: geofence.isActive,
      })
      .eq('id', geofence.id);

    if (error) {
      console.error('[trackingService.updateGeofence]', error);
      return false;
    }
    return true;
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

  // ── Routes ──

  async getRoutes(dogId: string): Promise<Route[]> {
    if (!isSupabaseConfigured()) return [];

    const { data, error } = await supabase
      .from('routes')
      .select('*')
      .eq('dog_id', dogId)
      .order('start_time', { ascending: false });

    if (error) {
      console.error('[trackingService.getRoutes]', error);
      return [];
    }

    return (data ?? []).map(mapRouteRow);
  },

  async createRoute(route: Omit<Route, 'id'>): Promise<Route | null> {
    if (!isSupabaseConfigured()) return null;

    const { data, error } = await supabase
      .from('routes')
      .insert([
        {
          dog_id: route.dogId,
          name: route.name,
          start_time: route.startTime,
          end_time: route.endTime ?? null,
          total_distance: route.totalDistance,
          duration: route.duration,
          locations_json: JSON.stringify(route.locations),
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('[trackingService.createRoute]', error);
      return null;
    }

    return mapRouteRow(data as Record<string, unknown>);
  },

  async updateRoute(route: Route): Promise<boolean> {
    if (!isSupabaseConfigured()) return false;

    const { error } = await supabase
      .from('routes')
      .update({
        end_time: route.endTime ?? null,
        total_distance: route.totalDistance,
        duration: route.duration,
        locations_json: JSON.stringify(route.locations),
      })
      .eq('id', route.id);

    if (error) {
      console.error('[trackingService.updateRoute]', error);
      return false;
    }
    return true;
  },

  async deleteRoute(routeId: string): Promise<boolean> {
    if (!isSupabaseConfigured()) return false;

    const { error } = await supabase
      .from('routes')
      .delete()
      .eq('id', routeId);

    if (error) {
      console.error('[trackingService.deleteRoute]', error);
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

function mapRouteRow(row: Record<string, unknown>): Route {
  let locations: LocationData[] = [];
  try {
    const raw = row.locations_json as string;
    if (raw) locations = JSON.parse(raw) as LocationData[];
  } catch {
    locations = [];
  }

  return {
    id: row.id as string,
    dogId: row.dog_id as string,
    name: row.name as string,
    startTime: row.start_time as string,
    endTime: (row.end_time as string) ?? undefined,
    locations,
    totalDistance: (row.total_distance as number) ?? 0,
    duration: (row.duration as number) ?? 0,
  };
}

export default trackingService;