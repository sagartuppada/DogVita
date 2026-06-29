/**
 * Tracking store - manages GPS tracking, geofencing, and route history
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LocationData, Geofence, GeofenceAlert, Route } from '../types';
import { trackingService } from '../services/api/tracking';
import { supabase, isSupabaseConfigured } from '../services/api/supabase';
import { useDogStore } from './dogStore';

interface TrackingState {
  currentLocation: LocationData | null;
  locationHistory: LocationData[];
  geofences: Geofence[];
  activeGeofenceAlerts: GeofenceAlert[];
  isTracking: boolean;
  trackingInterval: number;
  totalDistance: number;
  lastLocationUpdate: string | null;
  // Route tracking
  routes: Route[];
  activeRoute: Route | null;
}

interface TrackingActions {
  setCurrentLocation: (location: LocationData) => void;
  addLocationToHistory: (location: LocationData) => void;
  clearLocationHistory: () => void;
  addGeofence: (geofence: Geofence) => Promise<Geofence>;
  updateGeofence: (geofence: Geofence) => void;
  removeGeofence: (geofenceId: string) => void;
  addGeofenceAlert: (alert: GeofenceAlert) => void;
  acknowledgeGeofenceAlert: (alertId: string) => void;
  setTracking: (isTracking: boolean) => void;
  setTrackingInterval: (interval: number) => void;
  updateTotalDistance: (distance: number) => void;
  isInsideGeofence: (location: LocationData, geofence: Geofence) => boolean;
  checkGeofences: (location: LocationData) => Geofence[];
  fetchLocations: (dogId: string) => Promise<void>;
  fetchGeofences: (dogId: string) => Promise<void>;
  // Route tracking
  startRoute: (dogId: string, name?: string) => Route;
  endRoute: () => Route | null;
  addLocationToRoute: (location: LocationData) => void;
  deleteRoute: (routeId: string) => void;
  clearRoutes: () => void;
  fetchRoutes: (dogId: string) => Promise<void>;
  loadDemoData: () => void;
}

type TrackingStore = TrackingState & TrackingActions;

const MAX_LOCATION_HISTORY = 5000;

const initialState: TrackingState = {
  currentLocation: null,
  locationHistory: [],
  geofences: [],
  activeGeofenceAlerts: [],
  isTracking: false,
  trackingInterval: 5000,
  totalDistance: 0,
  lastLocationUpdate: null,
  routes: [],
  activeRoute: null,
};

export const useTrackingStore = create<TrackingStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      setCurrentLocation: (location) =>
        set((state) => ({
          currentLocation: location,
          lastLocationUpdate: new Date().toISOString(),
        })),

      addLocationToHistory: (location) => {
        const previousLocation = get().currentLocation;
        set((state) => ({
          locationHistory: [
            ...state.locationHistory.slice(-MAX_LOCATION_HISTORY + 1),
            location,
          ],
        }));
        if (isSupabaseConfigured()) {
          const activeDogId = useDogStore.getState().activeDogId;
          if (activeDogId) {
            trackingService.addLocation(activeDogId, location).catch((err) =>
              console.warn('[trackingStore] Failed to persist location:', err)
            );
          }
        }

        // Check geofence enter/exit transitions (ISSUE 19)
        const { geofences, isInsideGeofence, addGeofenceAlert } = get();
        for (const geofence of geofences) {
          if (!geofence.isActive || !geofence.alertsEnabled) continue;
          const nowInside = isInsideGeofence(location, geofence);
          const wasInside = previousLocation
            ? isInsideGeofence(previousLocation, geofence)
            : false;
          if (nowInside && !wasInside) {
            addGeofenceAlert({
              id: `gf_alert_${Date.now()}_${geofence.id}`,
              dogId: useDogStore.getState().activeDogId ?? '',
              geofenceId: geofence.id,
              type: 'enter',
              location,
              timestamp: new Date().toISOString(),
              acknowledged: false,
            });
          } else if (!nowInside && wasInside) {
            addGeofenceAlert({
              id: `gf_alert_${Date.now()}_${geofence.id}`,
              dogId: useDogStore.getState().activeDogId ?? '',
              geofenceId: geofence.id,
              type: 'exit',
              location,
              timestamp: new Date().toISOString(),
              acknowledged: false,
            });
          }
        }
      },

      clearLocationHistory: () => set({ locationHistory: [], totalDistance: 0 }),

      addGeofence: async (geofence) => {
        if (isSupabaseConfigured()) {
          try {
            const created = await trackingService.createGeofence(geofence);
            if (created) {
              set((state) => ({
                geofences: [...state.geofences, created],
              }));
              return created;
            }
          } catch (err) {
            console.warn('[trackingStore] Failed to persist geofence:', err);
          }
        }
        set((state) => ({
          geofences: [...state.geofences, geofence],
        }));
        return geofence;
      },

      updateGeofence: (geofence) => {
        set((state) => ({
          geofences: state.geofences.map((g) =>
            g.id === geofence.id ? geofence : g
          ),
        }));
        if (isSupabaseConfigured()) {
          trackingService.updateGeofence(geofence).catch((err) =>
            console.warn('[trackingStore] Failed to update geofence:', err)
          );
        }
      },

      removeGeofence: (geofenceId) => {
        set((state) => ({
          geofences: state.geofences.filter((g) => g.id !== geofenceId),
        }));
        if (isSupabaseConfigured()) {
          trackingService.deleteGeofence(geofenceId).catch((err) =>
            console.warn('[trackingStore] Failed to delete geofence:', err)
          );
        }
      },

      addGeofenceAlert: (alert) => {
        set((state) => ({
          activeGeofenceAlerts: [...state.activeGeofenceAlerts, alert],
        }));
        // Send push notification (fire-and-forget)
        try {
          const { notificationsService } = require('../services/notifications');
          notificationsService.initialize().then(() => {
            notificationsService.scheduleGeofenceAlert(alert);
          }).catch((err: unknown) => console.warn('[trackingStore] Geofence notification failed:', err));
        } catch (err) { console.warn('[trackingStore] Geofence notification failed:', err); }
      },

      acknowledgeGeofenceAlert: (alertId) =>
        set((state) => ({
          activeGeofenceAlerts: state.activeGeofenceAlerts.map((a) =>
            a.id === alertId ? { ...a, acknowledged: true } : a
          ),
        })),

      setTracking: (isTracking) => set({ isTracking }),

      setTrackingInterval: (trackingInterval) => set({ trackingInterval }),

      updateTotalDistance: (distance) =>
        set((state) => ({
          totalDistance: state.totalDistance + distance,
        })),

      isInsideGeofence: (location, geofence) => {
        const R = 6371e3;
        const lat1 = (geofence.center.latitude * Math.PI) / 180;
        const lat2 = (location.latitude * Math.PI) / 180;
        const deltaLat =
          ((location.latitude - geofence.center.latitude) * Math.PI) / 180;
        const deltaLon =
          ((location.longitude - geofence.center.longitude) * Math.PI) / 180;

        const a =
          Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
          Math.cos(lat1) *
            Math.cos(lat2) *
            Math.sin(deltaLon / 2) *
            Math.sin(deltaLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;

        return distance <= geofence.radius;
      },

      checkGeofences: (location) => {
        const { geofences, isInsideGeofence } = get();
        return geofences.filter(
          (g) => g.isActive && isInsideGeofence(location, g)
        );
      },

      fetchLocations: async (dogId) => {
        if (!isSupabaseConfigured()) return;
        try {
          const locations = await trackingService.getLocations(dogId);
          // Success from server = source of truth. Replace local history.
          set({
            locationHistory: locations,
            currentLocation: locations[0] ?? null,
            lastLocationUpdate: locations[0]?.timestamp ?? null,
          });
        } catch (error) {
          console.warn('[trackingStore.fetchLocations] Supabase fetch failed:', (error as Error).message);
        }
      },

      fetchGeofences: async (_dogId) => {
        if (!isSupabaseConfigured()) return;
        try {
          // Geofences are owner-scoped (owner_id), not dog-scoped. Resolve the
          // current authenticated user and query by owner_id. The dogId param
          // is kept for API parity but the query is owner-wide.
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;
          const geofences = await trackingService.getGeofences(user.id);
          set({ geofences });
        } catch (error) {
          console.warn('[trackingStore.fetchGeofences] Supabase fetch failed:', (error as Error).message);
        }
      },

      // Route tracking
      startRoute: (dogId, name) => {
        const now = new Date().toISOString();
        const route: Route = {
          id: `route_${Date.now()}`,
          dogId,
          name: name || `Walk ${new Date().toLocaleDateString()}`,
          startTime: now,
          endTime: undefined,
          locations: [],
          totalDistance: 0,
          duration: 0,
        };
        set({ activeRoute: route, isTracking: true });
        return route;
      },

      endRoute: () => {
        const { activeRoute, routes } = get();
        if (!activeRoute) return null;

        const endTime = new Date().toISOString();
        const duration = Math.floor(
          (new Date(endTime).getTime() - new Date(activeRoute.startTime).getTime()) / 1000
        );

        const completedRoute: Route = {
          ...activeRoute,
          endTime,
          duration,
        };

        set({
          activeRoute: null,
          routes: [completedRoute, ...routes].slice(0, 200),
          isTracking: false,
        });

        if (isSupabaseConfigured()) {
          trackingService.createRoute(completedRoute).catch((err) =>
            console.warn('[trackingStore] Failed to persist route:', err)
          );
        }

        return completedRoute;
      },

      addLocationToRoute: (location) => {
        set((state) => {
          if (!state.activeRoute) return state;

          const prevLocation = state.activeRoute.locations[state.activeRoute.locations.length - 1];
          let addedDistance = 0;
          if (prevLocation) {
            const R = 6371e3;
            const lat1 = (prevLocation.latitude * Math.PI) / 180;
            const lat2 = (location.latitude * Math.PI) / 180;
            const dLat = ((location.latitude - prevLocation.latitude) * Math.PI) / 180;
            const dLon = ((location.longitude - prevLocation.longitude) * Math.PI) / 180;
            const a =
              Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            addedDistance = R * c;
          }

          const updatedRoute: Route = {
            ...state.activeRoute,
            locations: [...state.activeRoute.locations, location],
            totalDistance: state.activeRoute.totalDistance + addedDistance,
          };

          return { activeRoute: updatedRoute };
        });
      },

      deleteRoute: (routeId) => {
        set((state) => ({
          routes: state.routes.filter((r) => r.id !== routeId),
        }));
        if (isSupabaseConfigured()) {
          trackingService.deleteRoute(routeId).catch((err) =>
            console.warn('[trackingStore] Failed to delete route:', err)
          );
        }
      },

      clearRoutes: () => set({ routes: [], activeRoute: null }),

      fetchRoutes: async (dogId) => {
        if (!isSupabaseConfigured()) return;
        try {
          const routes = await trackingService.getRoutes(dogId);
          // Success from server = source of truth. Replace local routes, but
          // preserve the in-progress activeRoute (not yet saved to server).
          set((state) => {
            const activeRoute = state.activeRoute;
            const merged = activeRoute
              ? [activeRoute, ...routes.filter((r) => r.id !== activeRoute.id)]
              : routes;
            return { routes: merged.slice(0, 200) };
          });
        } catch (error) {
          console.warn('[trackingStore.fetchRoutes] Supabase fetch failed:', (error as Error).message);
        }
      },

      loadDemoData: () => {
        const timestamp = new Date().toISOString();
        const uniqueSuffix = Date.now().toString(36);
        const baseLat = 37.7749;
        const baseLng = -122.4194;
        const demoLocations: LocationData[] = [];
        for (let i = 0; i < 50; i++) {
          const angle = (i / 50) * Math.PI * 2;
          const radius = 0.002 + (i / 50) * 0.003;
          demoLocations.push({
            latitude: baseLat + Math.cos(angle) * radius,
            longitude: baseLng + Math.sin(angle) * radius,
            accuracy: 5,
            speed: 1.5 + Math.random() * 2,
            heading: (angle * 180) / Math.PI,
            timestamp: new Date(Date.now() - (50 - i) * 30000).toISOString(),
          });
        }

        const demoRoute: Route = {
          id: `demo_route_${uniqueSuffix}`,
          dogId: 'demo_dog_1',
          name: 'Morning Walk (Demo)',
          startTime: new Date(Date.now() - 50 * 30000).toISOString(),
          endTime: timestamp,
          locations: demoLocations,
          totalDistance: 2450,
          duration: 1500,
        };

        set({
          currentLocation: {
            latitude: baseLat,
            longitude: baseLng,
            accuracy: 5,
            speed: 0.5,
            heading: 180,
            timestamp,
          },
          locationHistory: demoLocations,
          isTracking: true,
          lastLocationUpdate: timestamp,
          routes: [demoRoute],
          activeRoute: null,
        });
      },
    }),
    {
      name: 'tracking-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        geofences: state.geofences,
        trackingInterval: state.trackingInterval,
        routes: state.routes,
      }),
    }
  )
);

export const selectCurrentLocation = (state: TrackingStore) => state.currentLocation;
export const selectIsTracking = (state: TrackingStore) => state.isTracking;
export const selectGeofences = (state: TrackingStore) => state.geofences;
export const selectRoutes = (state: TrackingStore) => state.routes;
export const selectActiveRoute = (state: TrackingStore) => state.activeRoute;
