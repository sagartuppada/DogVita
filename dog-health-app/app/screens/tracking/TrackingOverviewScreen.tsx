/**
 * TrackingOverviewScreen - GPS tracking with native map, route recording, and geofence management
 */

import React, { useMemo, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useDogStore } from '../../store/dogStore';
import { useTrackingStore } from '../../store/trackingStore';
import { Card, StatusBadge, EmptyState } from '../../components/common';
import { DogMap } from '../../components/maps';
import { useLocation } from '../../hooks/useLocation';
import { spacing, typography, borderRadius, shadows } from '../../theme';
import type { TrackingTabScreenProps } from '../../navigation/types';

const formatDuration = (seconds: number) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
};

const formatDistance = (meters: number) => {
  if (meters >= 1000) return `${(meters / 1000).toFixed(2)} km`;
  return `${Math.round(meters)} m`;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollContent: {
    flexGrow: 1,
  },
  mapContainer: {
    height: 300,
    position: 'relative',
  },
  mapPlaceholder: {
    flex: 1,
    backgroundColor: '#EDE2C6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapPlaceholderText: {
    ...typography.styles.bodySM,
    color: '#9CA3AF',
    marginTop: spacing.md,
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
    backgroundColor: '#16A34A',
    ...shadows.fab,
  },
  fabRecording: {
    backgroundColor: '#EF4444',
    ...shadows.fab,
  },
  fabSecondary: {
    backgroundColor: '#FFFFFF',
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  headerActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  headerActionBtn: {
    padding: 2,
  },
  dogName: {
    ...typography.styles.headingMD,
    color: '#111827',
  },
  breed: {
    ...typography.styles.bodySM,
    color: '#9CA3AF',
    marginTop: 2,
  },
  routeStatsBanner: {
    flexDirection: 'row',
    backgroundColor: '#EF444410',
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    marginBottom: spacing.lg,
  },
  routeStat: {
    flex: 1,
    alignItems: 'center',
  },
  routeStatDivider: {
    width: 1,
    height: 32,
    backgroundColor: '#F0E8D8',
    alignSelf: 'center',
  },
  routeStatValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  routeStatLabel: {
    ...typography.styles.caption,
    color: '#9CA3AF',
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: '#EDE2C6',
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
    color: '#111827',
    marginTop: spacing.xs,
  },
  statLabel: {
    ...typography.styles.caption,
    color: '#9CA3AF',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: '#F0E8D8',
    alignSelf: 'center',
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EDE2C6',
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  actionButtonText: {
    ...typography.styles.bodySM,
    color: '#111827',
    fontWeight: '600',
  },
});

export default function TrackingOverviewScreen({ navigation }: TrackingTabScreenProps<'Tracking'>) {
  const insets = useSafeAreaInsets();
  const dogs = useDogStore((s) => s.dogs);
  const activeDogId = useDogStore((s) => s.activeDogId);
  const currentLocation = useTrackingStore((s) => s.currentLocation);
  const isTracking = useTrackingStore((s) => s.isTracking);
  const activeRoute = useTrackingStore((s) => s.activeRoute);
  const geofences = useTrackingStore((s) => s.geofences);
  const totalDistance = useTrackingStore((s) => s.totalDistance);
  const locationHistory = useTrackingStore((s) => s.locationHistory);

  const {
    startRouteRecording,
    stopRouteRecording,
    startTracking,
    stopTracking,
  } = useLocation();

  const currentLatitude = currentLocation?.latitude ?? null;
  const currentLongitude = currentLocation?.longitude ?? null;
  const currentSpeed = currentLocation?.speed ?? null;

  const activeDog = useMemo(
    () => dogs.find((d) => d.id === activeDogId) ?? null,
    [dogs, activeDogId],
  );

  useEffect(() => {
    if (activeDogId) {
      useTrackingStore.getState().fetchGeofences(activeDogId);
      useTrackingStore.getState().fetchRoutes(activeDogId);
    }
  }, [activeDogId]);

  const handleStartRoute = useCallback(() => {
    if (!activeDogId) return;
    const routeName = `${activeDog?.name || 'Dog'} Walk`;
    startRouteRecording(activeDogId, routeName);
    Alert.alert('Route Started', `Recording: ${routeName}`);
  }, [activeDogId, activeDog, startRouteRecording]);

  const handleEndRoute = useCallback(() => {
    const route = stopRouteRecording();
    if (route) {
      Alert.alert(
        'Route Completed',
        `${route.name}\nDistance: ${formatDistance(route.totalDistance)}\nDuration: ${formatDuration(route.duration)}`,
        [
          {
            text: 'View Route',
            onPress: () => navigation.getParent()?.navigate('RouteDetail', { routeId: route.id }),
          },
          { text: 'OK', style: 'default' },
        ]
      );
    }
  }, [stopRouteRecording, navigation]);

  const handleToggleTracking = useCallback(() => {
    if (isTracking) {
      stopTracking();
    } else {
      startTracking();
    }
  }, [isTracking, startTracking, stopTracking]);

  const handleNavigateToRoutes = useCallback(() => {
    navigation.getParent()?.navigate('RouteHistory');
  }, [navigation]);

  const handleNavigateToGeofences = useCallback(() => {
    navigation.getParent()?.navigate('GeofenceManager');
  }, [navigation]);

  const dogGeofences = useMemo(() => {
    if (!activeDogId) return [];
    return geofences.filter((g) => g.dogId === activeDogId);
  }, [geofences, activeDogId]);

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

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      {/* Map */}
      <View style={styles.mapContainer}>
        {hasLocation ? (
          <DogMap
            location={currentLocation}
            geofences={dogGeofences}
            route={activeRoute}
            followLocation={isTracking}
          />
        ) : (
          <View style={styles.mapPlaceholder}>
            <Ionicons name="map-outline" size={48} color="#9CA3AF" />
            <Text style={styles.mapPlaceholderText}>Waiting for GPS data...</Text>
          </View>
        )}

        {/* Floating FABs */}
        <View style={styles.fabContainer}>
          <TouchableOpacity
            style={[styles.fab, styles.fabSecondary]}
            activeOpacity={0.7}
            onPress={handleNavigateToRoutes}
          >
            <Ionicons name="list" size={20} color="#111827" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.fab, styles.fabSecondary]}
            activeOpacity={0.7}
            onPress={handleNavigateToGeofences}
          >
            <Ionicons name="locate-outline" size={20} color="#111827" />
          </TouchableOpacity>
          {activeRoute ? (
            <TouchableOpacity
              style={[styles.fab, styles.fabRecording]}
              activeOpacity={0.7}
              onPress={handleEndRoute}
            >
              <Ionicons name="stop" size={22} color="#FFFFFF" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.fab, styles.fabPrimary]}
              activeOpacity={0.7}
              onPress={handleStartRoute}
            >
              <Ionicons name="play" size={22} color="#FFFFFF" />
            </TouchableOpacity>
          )}
        </View>

        {/* Status Overlay */}
        <View style={[styles.statusOverlay, { top: insets.top + spacing.lg }]}>
          <StatusBadge
            label={activeRoute ? 'Recording' : isTracking ? 'Tracking' : 'Paused'}
            variant={activeRoute ? 'error' : isTracking ? 'success' : 'warning'}
            size="md"
            dot
          />
        </View>
      </View>

      {/* Info Card */}
      <Card variant="elevated" padding="lg" style={styles.infoCard}>
        <View style={styles.infoHeader}>
          <View>
            <Text style={styles.dogName}>{activeDog.name}</Text>
            <Text style={styles.breed}>{activeDog.breed}</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.headerActionBtn}
              onPress={handleToggleTracking}
              activeOpacity={0.7}
            >
              <Ionicons
                name={isTracking ? 'pause-circle' : 'play-circle'}
                size={28}
                color={isTracking ? '#F59E0B' : '#22C55E'}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Active route stats */}
        {activeRoute && (
          <View style={styles.routeStatsBanner}>
            <View style={styles.routeStat}>
              <Text style={styles.routeStatValue}>{formatDistance(activeRoute.totalDistance)}</Text>
              <Text style={styles.routeStatLabel}>Distance</Text>
            </View>
            <View style={styles.routeStatDivider} />
            <View style={styles.routeStat}>
              <Text style={styles.routeStatValue}>
                {formatDuration(Math.floor((Date.now() - new Date(activeRoute.startTime).getTime()) / 1000))}
              </Text>
              <Text style={styles.routeStatLabel}>Duration</Text>
            </View>
            <View style={styles.routeStatDivider} />
            <View style={styles.routeStat}>
              <Text style={styles.routeStatValue}>{activeRoute.locations.length}</Text>
              <Text style={styles.routeStatLabel}>Points</Text>
            </View>
          </View>
        )}

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Ionicons name="speedometer" size={18} color="#16A34A" />
            <Text style={styles.statValue}>{currentSpeed ? `${currentSpeed.toFixed(1)}` : '--'}</Text>
            <Text style={styles.statLabel}>km/h</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Ionicons name="trail-sign-outline" size={18} color="#22C55E" />
            <Text style={styles.statValue}>
              {totalDistance > 0 ? formatDistance(totalDistance) : '--'}
            </Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Ionicons name="location" size={18} color="#3B82F6" />
            <Text style={styles.statValue}>
              {locationHistory.length}
            </Text>
            <Text style={styles.statLabel}>Points</Text>
          </View>
        </View>

        {/* Quick action buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleNavigateToRoutes}
            activeOpacity={0.7}
          >
            <Ionicons name="list-outline" size={18} color="#16A34A" />
            <Text style={styles.actionButtonText}>Route History</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleNavigateToGeofences}
            activeOpacity={0.7}
          >
            <Ionicons name="locate-outline" size={18} color="#3B82F6" />
            <Text style={styles.actionButtonText}>Geofences</Text>
          </TouchableOpacity>
        </View>
      </Card>
      </ScrollView>
    </View>
  );
}
