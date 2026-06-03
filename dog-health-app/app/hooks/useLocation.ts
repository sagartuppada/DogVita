/**
 * useLocation - Hook for GPS tracking
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
    setCurrentLocation,
    addLocationToHistory,
    updateTotalDistance,
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

  useEffect(() => {
    const unsubscribe = gpsService.onLocationUpdate((location) => {
      setCurrentLocation(location);
      addLocationToHistory(location);
    });
    return unsubscribe;
  }, [setCurrentLocation, addLocationToHistory]);

  return {
    currentLocation,
    locationHistory,
    totalDistance,
    isTracking,
    permissionGranted,
    startTracking,
    stopTracking,
    getCurrentLocation,
    requestPermissions,
  };
};

export default useLocation;