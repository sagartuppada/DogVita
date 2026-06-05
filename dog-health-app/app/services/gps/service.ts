/**
 * GPS Service - Handles location tracking
 * Note: Dog GPS coordinates come from ESP32-S3 collar via BLE,
 * not from the phone's GPS. This service provides phone location
 * for map centering and geofence reference.
 */

import { Platform, PermissionsAndroid } from 'react-native';
import { LocationData } from '../../types';

// navigator.geolocation is available at runtime in React Native but not typed
const geolocation = (navigator as unknown as { geolocation: Geolocation }).geolocation;

class GPSService {
  private static instance: GPSService;
  private watchId: number | null = null;
  private listeners: Array<(location: LocationData) => void> = [];

  private constructor() {}

  public static getInstance(): GPSService {
    if (!GPSService.instance) {
      GPSService.instance = new GPSService();
    }
    return GPSService.instance;
  }

  async requestPermissions(): Promise<boolean> {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Location Permission',
          message: 'This app needs access to location for map features.',
          buttonPositive: 'OK',
          buttonNegative: 'Cancel',
        }
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }
    return true;
  }

  async requestBackgroundPermissions(): Promise<boolean> {
    return this.requestPermissions();
  }

  async getCurrentLocation(): Promise<LocationData | null> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) return null;

      return new Promise((resolve) => {
        geolocation.getCurrentPosition(
          (position: GeolocationPosition) => {
            resolve(this.convertToLocationData(position));
          },
          (error: GeolocationPositionError) => {
            console.error('Error getting current location:', error);
            resolve(null);
          },
          { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
        );
      });
    } catch (error) {
      console.error('Error getting current location:', error);
      return null;
    }
  }

  async startTracking(intervalMs: number = 5000): Promise<boolean> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) return false;

      this.watchId = geolocation.watchPosition(
        (position: GeolocationPosition) => {
          const locationData = this.convertToLocationData(position);
          this.notifyListeners(locationData);
        },
        (error: GeolocationPositionError) => {
          console.error('Error watching location:', error);
        },
        { enableHighAccuracy: true, distanceFilter: 5, interval: intervalMs } as PositionOptions
      );

      return true;
    } catch (error) {
      console.error('Error starting location tracking:', error);
      return false;
    }
  }

  stopTracking(): void {
    if (this.watchId !== null) {
      geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
  }

  async reverseGeocode(latitude: number, longitude: number): Promise<string | null> {
    return null;
  }

  calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371e3;
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  onLocationUpdate(callback: (location: LocationData) => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== callback);
    };
  }

  private notifyListeners(location: LocationData): void {
    this.listeners.forEach((listener) => listener(location));
  }

  private convertToLocationData(position: GeolocationPosition): LocationData {
    return {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      altitude: position.coords.altitude ?? undefined,
      accuracy: position.coords.accuracy ?? 0,
      speed: position.coords.speed ?? undefined,
      heading: position.coords.heading ?? undefined,
      timestamp: new Date(position.timestamp).toISOString(),
    };
  }

  isTracking(): boolean {
    return this.watchId !== null;
  }
}

export const gpsService = GPSService.getInstance();
export default gpsService;
