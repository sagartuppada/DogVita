/**
 * RouteHistoryScreen - List of recorded routes/walks
 */

import React, { useMemo, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useDogStore } from '../../store/dogStore';
import { useTrackingStore } from '../../store/trackingStore';
import { Card, EmptyState } from '../../components/common';
import { colors, spacing, typography, borderRadius } from '../../theme';
import type { Route } from '../../types';
import type { RouteHistoryScreenProps } from '../../navigation/types';
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

const RouteItem: React.FC<{
  route: Route;
  onPress: () => void;
}> = ({ route, onPress }) => {
  const date = new Date(route.startTime);
  const dateStr = date.toLocaleDateString();
  const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <Card variant="default" padding="md" style={styles.routeCard}>
        <View style={styles.routeRow}>
          <View style={styles.routeIcon}>
            <Ionicons name="walk" size={22} color={colors.primary.DEFAULT} />
          </View>
          <View style={styles.routeInfo}>
            <Text style={styles.routeName}>{route.name}</Text>
            <Text style={styles.routeDate}>{dateStr} at {timeStr}</Text>
          </View>
          <View style={styles.routeStats}>
            <Text style={styles.routeStatValue}>{formatDistance(route.totalDistance)}</Text>
            <Text style={styles.routeStatLabel}>{formatDuration(route.duration)}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.text.tertiary} />
        </View>
      </Card>
    </TouchableOpacity>
  );
};

export default function RouteHistoryScreen({ navigation }: RouteHistoryScreenProps) {
  const insets = useSafeAreaInsets();
  const routes = useTrackingStore((s) => s.routes);
  const activeRoute = useTrackingStore((s) => s.activeRoute);
  const dogs = useDogStore((s) => s.dogs);
  const activeDogId = useDogStore((s) => s.activeDogId);

  const activeDog = useMemo(
    () => dogs.find((d) => d.id === activeDogId) ?? null,
    [dogs, activeDogId]
  );

  useEffect(() => {
    if (activeDogId) {
      useTrackingStore.getState().fetchRoutes(activeDogId);
    }
  }, [activeDogId]);

  const dogRoutes = useMemo(() => {
    if (!activeDogId) return [];
    return routes.filter((r) => r.dogId === activeDogId);
  }, [routes, activeDogId]);

  const handleRoutePress = (route: Route) => {
    navigation.navigate('RouteDetail', { routeId: route.id });
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>Route History</Text>
        <View style={styles.backButton} />
      </View>

      {activeRoute && (
        <Card variant="elevated" padding="md" style={styles.recordingBanner}>
          <View style={styles.recordingRow}>
            <View style={styles.recordingDot} />
            <Text style={styles.recordingText}>Recording: {activeRoute.name}</Text>
              <Text style={styles.recordingStat}>
                {formatDistance(activeRoute.totalDistance)} · {formatDuration(Math.floor((Date.now() - new Date(activeRoute.startTime).getTime()) / 1000))}
            </Text>
          </View>
        </Card>
      )}

      <FlatList
        data={dogRoutes}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <RouteItem route={item} onPress={() => handleRoutePress(item)} />
        )}
        contentContainerStyle={[styles.list, { paddingBottom: 100 }]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <EmptyState
            icon="map-outline"
            title="No Routes Yet"
            message={activeDog ? `Start tracking ${activeDog.name} to record your first walk.` : 'Add a dog to start recording routes.'}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.page,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },
  backButton: {
    padding: 4,
    width: 40,
  },
  title: {
    ...typography.styles.headingXL,
    color: colors.text.primary,
  },
  recordingBanner: {
    marginHorizontal: spacing.page,
    marginBottom: spacing.md,
    backgroundColor: colors.status.success + '12',
  },
  recordingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recordingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.status.success,
    marginRight: spacing.sm,
  },
  recordingText: {
    ...typography.styles.bodyMD,
    color: colors.text.primary,
    fontWeight: '600',
    flex: 1,
  },
  recordingStat: {
    ...typography.styles.caption,
    color: colors.text.secondary,
  },
  list: {
    paddingHorizontal: spacing.page,
  },
  routeCard: {
    marginBottom: spacing.md,
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  routeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary.DEFAULT + '18',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  routeInfo: {
    flex: 1,
  },
  routeName: {
    ...typography.styles.bodyMD,
    color: colors.text.primary,
    fontWeight: '600',
  },
  routeDate: {
    ...typography.styles.caption,
    color: colors.text.tertiary,
    marginTop: 2,
  },
  routeStats: {
    alignItems: 'flex-end',
    marginRight: spacing.sm,
  },
  routeStatValue: {
    ...typography.styles.bodySM,
    color: colors.text.primary,
    fontWeight: '600',
  },
  routeStatLabel: {
    ...typography.styles.caption,
    color: colors.text.tertiary,
    marginTop: 2,
  },
});
