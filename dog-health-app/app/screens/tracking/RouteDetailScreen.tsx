/**
 * RouteDetailScreen - View a specific route with full map polyline
 */

import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTrackingStore } from '../../store/trackingStore';
import { Card } from '../../components/common';
import { DogMap } from '../../components/maps';
import { spacing, typography } from '../../theme';
import type { RouteDetailScreenProps } from '../../navigation/types';

const formatDuration = (seconds: number) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
};

const formatDistance = (meters: number) => {
  if (meters >= 1000) return `${(meters / 1000).toFixed(2)} km`;
  return `${Math.round(meters)} m`;
};

const formatSpeed = (meters: number, seconds: number) => {
  if (seconds === 0) return '0 km/h';
  const kmh = (meters / 1000) / (seconds / 3600);
  return `${kmh.toFixed(1)} km/h`;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5E9CD',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.page,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  backButton: {
    padding: 4,
    width: 40,
  },
  title: {
    ...typography.styles.headingLG,
    color: '#1F1A17',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: spacing.sm,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    ...typography.styles.bodyMD,
    color: '#A39888',
    marginTop: spacing.md,
  },
  mapContainer: {
    height: 280,
    marginHorizontal: spacing.page,
    borderRadius: 16,
    overflow: 'hidden',
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginHorizontal: spacing.page,
    marginTop: spacing.lg,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F1A17',
    marginTop: spacing.sm,
  },
  statLabel: {
    ...typography.styles.caption,
    color: '#A39888',
    marginTop: 2,
  },
  infoCard: {
    marginHorizontal: spacing.page,
    marginTop: spacing.lg,
  },
  sectionTitle: {
    ...typography.styles.label,
    color: '#6B625A',
    marginBottom: spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#F0E8D8',
  },
  infoLabel: {
    ...typography.styles.bodySM,
    color: '#A39888',
  },
  infoValue: {
    ...typography.styles.bodySM,
    color: '#1F1A17',
    fontWeight: '500',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: spacing.page,
    marginTop: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: 12,
    backgroundColor: '#F4433610',
  },
  deleteText: {
    ...typography.styles.bodyMD,
    color: '#F44336',
    fontWeight: '600',
    marginLeft: spacing.sm,
  },
});

export default function RouteDetailScreen({ navigation, route: navRoute }: RouteDetailScreenProps) {
  const insets = useSafeAreaInsets();
  const routes = useTrackingStore((s) => s.routes);
  const routeId = navRoute.params?.routeId;

  const route = useMemo(() => {
    return routes.find((r) => r.id === routeId) ?? null;
  }, [routes, routeId]);

  const startLocation = route?.locations[0];
  const endLocation = route?.locations[route.locations.length - 1];

  const mapRegion = useMemo(() => {
    if (!route || route.locations.length === 0) return undefined;
    const lats = route.locations.map((l) => l.latitude);
    const lngs = route.locations.map((l) => l.longitude);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    const latDelta = Math.max((maxLat - minLat) * 1.5, 0.005);
    const lngDelta = Math.max((maxLng - minLng) * 1.5, 0.005);
    return {
      latitude: (minLat + maxLat) / 2,
      longitude: (minLng + maxLng) / 2,
      latitudeDelta: latDelta,
      longitudeDelta: lngDelta,
    };
  }, [route]);

  if (!route) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color="#1F1A17" />
          </TouchableOpacity>
        </View>
        <View style={styles.centered}>
          <Ionicons name="alert-circle-outline" size={48} color="#A39888" />
          <Text style={styles.errorText}>Route not found</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#1F1A17" />
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={1}>
          {route.name}
        </Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Map */}
        <View style={styles.mapContainer}>
          <DogMap
            route={route}
            location={endLocation}
            region={mapRegion}
            showUserLocation={false}
          />
        </View>

        {/* Stats Cards */}
        <View style={styles.statsRow}>
          <Card variant="default" padding="md" style={styles.statCard}>
            <Ionicons name="time-outline" size={22} color="#F3A93B" />
            <Text style={styles.statValue}>{formatDuration(route.duration)}</Text>
            <Text style={styles.statLabel}>Duration</Text>
          </Card>
          <Card variant="default" padding="md" style={styles.statCard}>
            <Ionicons name="trail-sign-outline" size={22} color="#4CAF50" />
            <Text style={styles.statValue}>{formatDistance(route.totalDistance)}</Text>
            <Text style={styles.statLabel}>Distance</Text>
          </Card>
          <Card variant="default" padding="md" style={styles.statCard}>
            <Ionicons name="speedometer-outline" size={22} color="#5B9BD5" />
            <Text style={styles.statValue}>{formatSpeed(route.totalDistance, route.duration)}</Text>
            <Text style={styles.statLabel}>Avg Speed</Text>
          </Card>
        </View>

        {/* Route Info */}
        <Card variant="default" padding="md" style={styles.infoCard}>
          <Text style={styles.sectionTitle}>Route Details</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Start</Text>
            <Text style={styles.infoValue}>
              {startLocation
                ? `${startLocation.latitude.toFixed(4)}, ${startLocation.longitude.toFixed(4)}`
                : '--'}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>End</Text>
            <Text style={styles.infoValue}>
              {endLocation
                ? `${endLocation.latitude.toFixed(4)}, ${endLocation.longitude.toFixed(4)}`
                : '--'}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Points</Text>
            <Text style={styles.infoValue}>{route.locations.length}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Date</Text>
            <Text style={styles.infoValue}>
              {new Date(route.startTime).toLocaleString()}
            </Text>
          </View>
        </Card>

        {/* Delete button */}
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => {
            useTrackingStore.getState().deleteRoute(route.id);
            navigation.goBack();
          }}
          activeOpacity={0.7}
        >
          <Ionicons name="trash-outline" size={18} color="#F44336" />
          <Text style={styles.deleteText}>Delete Route</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
