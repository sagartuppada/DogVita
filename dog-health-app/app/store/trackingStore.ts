/**
 * Tracking store - manages GPS tracking and geofencing
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LocationData, Geofence, GeofenceAlert } from '../types';

interface TrackingState {
  currentLocation: LocationData | null;
  locationHistory: LocationData[];
  geofences: Geofence[];
  activeGeofenceAlerts: GeofenceAlert[];
  isTracking: boolean;
  trackingInterval: number;
  totalDistance: number;
  lastLocationUpdate: string | null;
}

interface TrackingActions {
  setCurrentLocation: (location: LocationData) => void;
  addLocationToHistory: (location: LocationData) => void;
  clearLocationHistory: () => void;
  addGeofence: (geofence: Geofence) => void;
  updateGeofence: (geofence: Geofence) => void;
  removeGeofence: (geofenceId: string) => void;
  addGeofenceAlert: (alert: GeofenceAlert) => void;
  acknowledgeGeofenceAlert: (alertId: string) => void;
  setTracking: (isTracking: boolean) => void;
  setTrackingInterval: (interval: number) => void;
  updateTotalDistance: (distance: number) => void;
  isInsideGeofence: (location: LocationData, geofence: Geofence) => boolean;
  checkGeofences: (location: LocationData) => Geofence[];
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

      addLocationToHistory: (location) =>
        set((state) => ({
          locationHistory: [
            ...state.locationHistory.slice(-MAX_LOCATION_HISTORY + 1),
            location,
          ],
        })),

      clearLocationHistory: () => set({ locationHistory: [], totalDistance: 0 }),

      addGeofence: (geofence) =>
        set((state) => ({
          geofences: [...state.geofences, geofence],
        })),

      updateGeofence: (geofence) =>
        set((state) => ({
          geofences: state.geofences.map((g) =>
            g.id === geofence.id ? geofence : g
          ),
        })),

      removeGeofence: (geofenceId) =>
        set((state) => ({
          geofences: state.geofences.filter((g) => g.id !== geofenceId),
        })),

      addGeofenceAlert: (alert) =>
        set((state) => ({
          activeGeofenceAlerts: [...state.activeGeofenceAlerts, alert],
        })),

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
    }),
    {
      name: 'tracking-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        geofences: state.geofences,
        trackingInterval: state.trackingInterval,
      }),
    }
  )
);

export const selectCurrentLocation = (state: TrackingStore) => state.currentLocation;
export const selectIsTracking = (state: TrackingStore) => state.isTracking;
export const selectGeofences = (state: TrackingStore) => state.geofences;