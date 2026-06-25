/**
 * DogMap - Native map with markers, polylines, and geofence circles
 */

import React, { useRef, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import MapView, { Marker, Circle, Polyline, Region } from 'react-native-maps';
import { colors } from '../../theme';
import { LocationData, Geofence, Route } from '../../types';

interface DogMapProps {
  location?: LocationData | null;
  geofences?: Geofence[];
  route?: Route | null;
  showUserLocation?: boolean;
  region?: Region;
  onPress?: (coordinate: { latitude: number; longitude: number }) => void;
  followLocation?: boolean;
  style?: any;
}

export const DogMap: React.FC<DogMapProps> = ({
  location,
  geofences = [],
  route,
  showUserLocation = true,
  region,
  onPress,
  followLocation = false,
  style,
}) => {
  const mapRef = useRef<MapView>(null);

  const defaultRegion: Region = location
    ? {
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }
    : {
        latitude: 37.7749,
        longitude: -122.4194,
        latitudeDelta: 0.1,
        longitudeDelta: 0.1,
      };

  useEffect(() => {
    if (followLocation && location && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      }, 500);
    }
  }, [followLocation, location]);

  const routeCoords = route?.locations.map((loc) => ({
    latitude: loc.latitude,
    longitude: loc.longitude,
  })) ?? [];

  return (
    <View style={[styles.container, style]}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={region || defaultRegion}
        showsUserLocation={showUserLocation}
        showsMyLocationButton
        onPress={(e) => onPress?.(e.nativeEvent.coordinate)}
      >
        {location && (
          <Marker
            coordinate={{
              latitude: location.latitude,
              longitude: location.longitude,
            }}
            title="Your Dog"
            description="Current location"
          >
            <View style={styles.markerOuter}>
              <View style={styles.markerInner} />
            </View>
          </Marker>
        )}

        {routeCoords.length > 1 && (
          <Polyline
            coordinates={routeCoords}
            strokeColor={colors.primary.DEFAULT}
            strokeWidth={4}
          />
        )}

        {geofences.map((geofence) => (
          <React.Fragment key={geofence.id}>
            <Circle
              center={geofence.center}
              radius={geofence.radius}
              fillColor={geofence.isActive ? colors.primary.DEFAULT + '20' : colors.secondary.light + '15'}
              strokeColor={geofence.isActive ? colors.primary.DEFAULT : colors.secondary.light}
              strokeWidth={2}
            />
            <Marker
              coordinate={geofence.center}
              title={geofence.name}
              description={`Radius: ${Math.round(geofence.radius)}m`}
              pinColor={geofence.isActive ? colors.primary.DEFAULT : colors.secondary.light}
            />
          </React.Fragment>
        ))}
      </MapView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  markerOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary.DEFAULT + '40',
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary.DEFAULT,
    borderWidth: 2,
    borderColor: colors.white,
  },
});

export default DogMap;
