/**
 * useLocation - Hook for GPS tracking with route recording
 */

import { useState, useEffect, useCallback } from 'react';
import { useTrackingStore } from '../store';
import { gpsService } from '../services/gps';
import { LocationData } from '../types';

export const useLocation = () => {
  const [isTracking, setIsTracking] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);

  const {
    currentLocation,
    locationHistory,
    totalDistance,
    activeRoute,
    routes,
    setCurrentLocation,
    addLocationToHistory,
    addLocationToRoute,
    updateTotalDistance,
    startRoute,
    endRoute,
  } = useTrackingStore();

  const requestPermissions = useCallback(async () => {
    const granted = await gpsService.requestPermissions();
    setPermissionGranted(granted);
    return granted;
  }, []);

  const startTracking = useCallback(async (intervalMs: number = 5000) => {
    const hasPermission = permissionGranted || (await requestPermissions());
    if (!hasPermission) return false;

    const success = await gpsService.startTracking(intervalMs);
    if (success) {
      setIsTracking(true);
      useTrackingStore.setState({ isTracking: true });
    }
    return success;
  }, [permissionGranted, requestPermissions]);

  const stopTracking = useCallback(() => {
    gpsService.stopTracking();
    setIsTracking(false);
    useTrackingStore.setState({ isTracking: false });
  }, []);

  const getCurrentLocation = useCallback(async () => {
    const location = await gpsService.getCurrentLocation();
    if (location) {
      setCurrentLocation(location);
      addLocationToHistory(location);
    }
    return location;
  }, [setCurrentLocation, addLocationToHistory]);

  const startRouteRecording = useCallback((dogId: string, name?: string) => {
    const route = startRoute(dogId, name);
    // Also start GPS tracking if not already
    startTracking();
    return route;
  }, [startRoute, startTracking]);

  const stopRouteRecording = useCallback(() => {
    const route = endRoute();
    stopTracking();
    return route;
  }, [endRoute, stopTracking]);

  useEffect(() => {
    const unsubscribe = gpsService.onLocationUpdate((location) => {
      setCurrentLocation(location);
      addLocationToHistory(location);
      addLocationToRoute(location);
    });
    return unsubscribe;
  }, [setCurrentLocation, addLocationToHistory, addLocationToRoute]);

  return {
    currentLocation,
    locationHistory,
    totalDistance,
    activeRoute,
    routes,
    isTracking,
    permissionGranted,
    startTracking,
    stopTracking,
    getCurrentLocation,
    requestPermissions,
    startRouteRecording,
    stopRouteRecording,
  };
};

export default useLocation;
