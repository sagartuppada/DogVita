/**
 * TrackingOverviewScreen - GPS tracking with map and floating FABs
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useDogStore } from '../../store/dogStore';
import { useTrackingStore } from '../../store/trackingStore';
import { Card, StatusBadge, EmptyState } from '../../components/common';
import { colors, spacing, typography, borderRadius, shadows } from '../../theme';
import type { TrackingTabScreenProps } from '../../navigation/types';

export default function TrackingOverviewScreen({}: TrackingTabScreenProps<'Tracking'>) {
  const insets = useSafeAreaInsets();
  const dogs = useDogStore((s) => s.dogs);
  const activeDogId = useDogStore((s) => s.activeDogId);
  const currentLocation = useTrackingStore((s) => s.currentLocation);
  const isTracking = useTrackingStore((s) => s.isTracking);

  const currentLatitude = currentLocation?.latitude ?? null;
  const currentLongitude = currentLocation?.longitude ?? null;
  const currentSpeed = currentLocation?.speed ?? null;

  const activeDog = useMemo(
    () => dogs.find((d) => d.id === activeDogId) ?? null,
    [dogs, activeDogId],
  );

  if (!activeDog) {
    return (
      <EmptyState
        icon="paw-outline"
        title="No Dog Selected"
        message="Add a dog profile to start tracking"
      />
    );
  }

  const hasLocation = currentLatitude !== null && currentLongitude !== null;

  const handleLocate = () => {
    if (currentLatitude !== null && currentLongitude !== null) {
      // Pan map to current location (MapView ref would be needed for full implementation)
      // For now, show an alert confirming location
    }
  };

  const handleToggleTracking = () => {
    useTrackingStore.getState().setTracking(!isTracking);
  };

  return (
    <View style={styles.container}>
      {/* Map */}
      <View style={styles.mapContainer}>
        {hasLocation ? (
          <MapView
            provider={PROVIDER_DEFAULT}
            style={styles.map}
            initialRegion={{
              latitude: currentLatitude!,
              longitude: currentLongitude!,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }}
            showsUserLocation={false}
            showsMyLocationButton={false}
          >
            <Marker
              coordinate={{
                latitude: currentLatitude!,
                longitude: currentLongitude!,
              }}
            >
              <View style={styles.markerContainer}>
                <View style={styles.markerDot} />
              </View>
            </Marker>
          </MapView>
        ) : (
          <View style={styles.mapPlaceholder}>
            <Ionicons name="map-outline" size={48} color={colors.text.tertiary} />
            <Text style={styles.mapPlaceholderText}>Waiting for GPS data...</Text>
          </View>
        )}

        {/* Floating FABs */}
        <View style={styles.fabContainer}>
          <TouchableOpacity
            style={[styles.fab, styles.fabSecondary]}
            activeOpacity={0.7}
            onPress={handleLocate}
          >
            <Ionicons name="locate" size={20} color={colors.text.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.fab, styles.fabPrimary]}
            activeOpacity={0.7}
            onPress={handleToggleTracking}
          >
            <Ionicons name={isTracking ? 'pause' : 'play'} size={22} color={colors.white} />
          </TouchableOpacity>
        </View>

        {/* Status Overlay */}
        <View style={[styles.statusOverlay, { top: insets.top + spacing.lg }]}>
          <StatusBadge
            label={isTracking ? 'Tracking' : 'Paused'}
            variant={isTracking ? 'success' : 'warning'}
            size="md"
            dot
          />
        </View>
      </View>

      {/* Info Card */}
      <Card variant="elevated" padding="lg" style={styles.infoCard}>
        <View style={styles.infoHeader}>
          <Text style={styles.dogName}>{activeDog.name}</Text>
          <Text style={styles.breed}>{activeDog.breed}</Text>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Ionicons name="speedometer" size={18} color={colors.primary.DEFAULT} />
            <Text style={styles.statValue}>{currentSpeed ? `${currentSpeed.toFixed(1)}` : '--'}</Text>
            <Text style={styles.statLabel}>km/h</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Ionicons name="location" size={18} color={colors.status.info} />
            <Text style={styles.statValue}>
              {currentLatitude ? currentLatitude.toFixed(4) : '--'}
            </Text>
            <Text style={styles.statLabel}>Lat</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Ionicons name="location" size={18} color={colors.status.info} />
            <Text style={styles.statValue}>
              {currentLongitude ? currentLongitude.toFixed(4) : '--'}
            </Text>
            <Text style={styles.statLabel}>Lng</Text>
          </View>
        </View>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  mapPlaceholder: {
    flex: 1,
    backgroundColor: colors.background.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapPlaceholderText: {
    ...typography.styles.bodySM,
    color: colors.text.tertiary,
    marginTop: spacing.md,
  },
  markerContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary.DEFAULT + '30',
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary.DEFAULT,
    borderWidth: 2,
    borderColor: colors.white,
  },
  fabContainer: {
    position: 'absolute',
    right: spacing.xl,
    bottom: spacing.xl,
    gap: spacing.md,
  },
  fab: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabPrimary: {
    backgroundColor: colors.primary.DEFAULT,
    ...shadows.fab,
  },
  fabSecondary: {
    backgroundColor: colors.white,
    ...shadows.md,
  },
  statusOverlay: {
    position: 'absolute',
    left: spacing.xl,
  },
  infoCard: {
    marginHorizontal: spacing.page,
    marginBottom: spacing.xl,
    marginTop: -spacing.xl,
    zIndex: 1,
  },
  infoHeader: {
    marginBottom: spacing.lg,
  },
  dogName: {
    ...typography.styles.headingMD,
    color: colors.text.primary,
  },
  breed: {
    ...typography.styles.bodySM,
    color: colors.text.tertiary,
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text.primary,
    marginTop: spacing.xs,
  },
  statLabel: {
    ...typography.styles.caption,
    color: colors.text.tertiary,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: colors.border.light,
    alignSelf: 'center',
  },
});
