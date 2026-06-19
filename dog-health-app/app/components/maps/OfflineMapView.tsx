import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface OfflineMapViewProps {
  latitude: number;
  longitude: number;
  latitudeDelta?: number;
  longitudeDelta?: number;
}

export const OfflineMapView: React.FC<OfflineMapViewProps> = ({
  latitude,
  longitude,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.tileRow}>
        {['', '', ''].map((_, ci) => (
          <View key={ci} style={styles.tile}>
            <View style={styles.gridLineH} />
            <View style={styles.gridLineV} />
          </View>
        ))}
      </View>
      <View style={styles.tileRow}>
        {['', '', ''].map((_, ci) => (
          <View key={ci} style={styles.tile}>
            <View style={styles.gridLineH} />
            <View style={styles.gridLineV} />
          </View>
        ))}
      </View>
      <View style={styles.tileRow}>
        {['', '', ''].map((_, ci) => (
          <View key={ci} style={styles.tile}>
            <View style={styles.gridLineH} />
            <View style={styles.gridLineV} />
          </View>
        ))}
      </View>

      <View style={styles.centerRow}>
        <View style={styles.markerOuter}>
          <View style={styles.markerInner} />
        </View>
      </View>

      <View style={styles.label}>
        <Text style={styles.labelText}>Temp Map — {latitude.toFixed(4)}, {longitude.toFixed(4)}</Text>
        <Text style={styles.labelSub}>OpenStreetMap tiles offline</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#cde0b6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tileRow: {
    flexDirection: 'row',
  },
  tile: {
    width: 130,
    height: 130,
    backgroundColor: '#e1edce',
    borderWidth: 0.5,
    borderColor: '#bbcba8',
    position: 'relative',
  },
  gridLineH: {
    position: 'absolute',
    left: '50%',
    top: 0,
    bottom: 0,
    width: 0.5,
    backgroundColor: '#c3d4ad',
  },
  gridLineV: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    height: 0.5,
    backgroundColor: '#c3d4ad',
  },
  centerRow: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  markerOuter: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(220, 38, 38, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  markerInner: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#dc2626',
    borderWidth: 2,
    borderColor: '#fff',
  },
  label: {
    position: 'absolute',
    bottom: 12,
    alignItems: 'center',
  },
  labelText: {
    fontSize: 11,
    color: '#5a6b4a',
    fontWeight: '600',
  },
  labelSub: {
    fontSize: 10,
    color: '#7a8b6a',
    marginTop: 2,
  },
});