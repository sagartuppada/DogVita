/**
 * DogMap - Map showing dog location
 */

import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import MapView, { Marker, Circle, Region } from 'react-native-maps';
import { colors, spacing, typography } from '../../theme';
import { LocationData, Geofence } from '../../types';

interface DogMapProps {
  location: LocationData | null;
  geofences?: Geofence[];
  showUserLocation?: boolean;
  region?: Region;
}

export const DogMap: React.FC<DogMapProps> = ({
  location,
  geofences = [],
  showUserLocation = true,
  region,
}) => {
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

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={region || defaultRegion}
        showsUserLocation={showUserLocation}
        showsMyLocationButton
      >
        {location && (
          <Marker
            coordinate={{
              latitude: location.latitude,
              longitude: location.longitude,
            }}
            title="Your Dog"
            description="Current location"
          />
        )}
        {geofences.map((geofence) => (
          <React.Fragment key={geofence.id}>
            <Circle
              center={geofence.center}
              radius={geofence.radius}
              fillColor={colors.secondary.light + '30'}
              strokeColor={colors.secondary.dark}
              strokeWidth={2}
            />
            <Marker
              coordinate={geofence.center}
              title={geofence.name}
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
    width: Dimensions.get('window').width,
    height: '100%',
  },
});

export default DogMap;