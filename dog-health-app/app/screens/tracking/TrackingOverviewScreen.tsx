/**
 * TrackingOverviewScreen - GPS tracking and geofencing
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Card, StatusBadge, Button } from '../../components/common';
import { DogMap } from '../../components/maps';
import { colors, spacing, typography } from '../../theme';
import { useDogStore, useTrackingStore } from '../../store';

export const TrackingOverviewScreen: React.FC = () => {
  const dogs = useDogStore((s) => s.dogs);
  const activeDogId = useDogStore((s) => s.activeDogId);
  const activeDog = useMemo(() => dogs.find((d) => d.id === activeDogId) ?? null, [dogs, activeDogId]);
  const currentLocation = useTrackingStore((s) => s.currentLocation);
  const geofences = useTrackingStore((s) => s.geofences);
  const isTracking = useTrackingStore((s) => s.isTracking);
  const totalDistance = useTrackingStore((s) => s.totalDistance);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.mapContainer}>
        <DogMap
          location={currentLocation}
          geofences={geofences}
        />
      </View>
      <View style={styles.bottomSheet}>
        <View style={styles.handle} />
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Tracking</Text>
            <StatusBadge
              label={isTracking ? 'Live' : 'Paused'}
              variant={isTracking ? 'success' : 'warning'}
              size="sm"
              dot
            />
          </View>

          <View style={styles.statsRow}>
            <Card style={styles.statCard}>
              <Ionicons name="location" size={24} color={colors.health.gps} />
              <Text style={styles.statValue}>{currentLocation ? 'Active' : 'No signal'}</Text>
              <Text style={styles.statLabel}>GPS Status</Text>
            </Card>
            <Card style={styles.statCard}>
              <Ionicons name="walk" size={24} color={colors.health.activity} />
              <Text style={styles.statValue}>{(totalDistance / 1000).toFixed(2)}</Text>
              <Text style={styles.statLabel}>km Today</Text>
            </Card>
            <Card style={styles.statCard}>
              <Ionicons name="shield" size={24} color={colors.secondary[600]} />
              <Text style={styles.statValue}>{geofences.filter(g => g.isActive).length}</Text>
              <Text style={styles.statLabel}>Geofences</Text>
            </Card>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Geofences</Text>
              <TouchableOpacity>
                <Text style={styles.seeAll}>See All</Text>
              </TouchableOpacity>
            </View>
            {geofences.length === 0 ? (
              <Card style={styles.emptyCard}>
                <Ionicons name="location-outline" size={32} color={colors.text.tertiary} />
                <Text style={styles.emptyText}>No geofences set up</Text>
                <Button title="Add Geofence" variant="outline" size="sm" />
              </Card>
            ) : (
              geofences.slice(0, 2).map((geofence) => (
                <Card key={geofence.id} style={styles.geofenceCard}>
                  <View style={styles.geofenceRow}>
                    <View style={styles.geofenceInfo}>
                      <Text style={styles.geofenceName}>{geofence.name}</Text>
                      <Text style={styles.geofenceRadius}>{geofence.radius}m radius</Text>
                    </View>
                    <StatusBadge
                      label={geofence.isActive ? 'Active' : 'Inactive'}
                      variant={geofence.isActive ? 'success' : 'default'}
                      size="sm"
                    />
                  </View>
                </Card>
              ))
            )}
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  },
  mapContainer: {
    flex: 1,
    minHeight: 200,
  },
  bottomSheet: {
    backgroundColor: colors.background.primary,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -24,
    paddingTop: spacing.sm,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: colors.neutral[300],
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  scrollContent: {
    padding: spacing.page,
    paddingTop: 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: {
    ...typography.styles.displaySmall,
    color: colors.text.primary,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: spacing.md,
  },
  statValue: {
    ...typography.styles.titleMedium,
    color: colors.text.primary,
    marginTop: spacing.xs,
  },
  statLabel: {
    ...typography.styles.caption,
    color: colors.text.secondary,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    ...typography.styles.titleMedium,
    color: colors.text.primary,
  },
  seeAll: {
    ...typography.styles.bodyMedium,
    color: colors.primary[600],
  },
  emptyCard: {
    alignItems: 'center',
    padding: spacing.xl,
    gap: spacing.sm,
  },
  emptyText: {
    ...typography.styles.bodyMedium,
    color: colors.text.secondary,
  },
  geofenceCard: {
    marginBottom: spacing.sm,
  },
  geofenceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  geofenceInfo: {
    gap: spacing.xxs,
  },
  geofenceName: {
    ...typography.styles.titleMedium,
    color: colors.text.primary,
  },
  geofenceRadius: {
    ...typography.styles.caption,
    color: colors.text.secondary,
  },
});

export default TrackingOverviewScreen;