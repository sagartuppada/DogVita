import React, { useMemo, useEffect, useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useDogStore } from '../../store/dogStore';
import { useHealthStore } from '../../store/healthStore';
import { useBLEStore } from '../../store/bleStore';
import { useAlertStore } from '../../store/alertStore';
import { StatusBadge, EmptyState } from '../../components/common';
import { spacing, typography, borderRadius, shadows, colors } from '../../theme';
import type { DashboardScreenProps } from '../../navigation/types';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.primary },
  scrollContent: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 120 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  headerTitle: { fontSize: 28, fontWeight: '800', color: colors.text.primary, fontFamily: typography.fontFamily.bold },
  bellBtn: { padding: 8 },
  greeting: { ...typography.styles.bodySM, color: colors.text.secondary, marginBottom: 2 },
  subGreeting: { ...typography.styles.bodySM, color: colors.text.tertiary, marginBottom: 16 },
  dogCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.background.card, borderRadius: borderRadius.xl, padding: 16, marginBottom: 20, ...shadows.elevatedCard },
  dogPhoto: { width: 64, height: 64, borderRadius: 32, marginRight: 14, backgroundColor: colors.background.secondary, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  dogPhotoImg: { width: 64, height: 64, borderRadius: 32 },
  dogInfo: { flex: 1 },
  dogName: { fontSize: 18, fontWeight: '700', color: colors.text.primary },
  dogBreed: { fontSize: 13, color: colors.text.tertiary, marginTop: 2 },
  onlineBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#22C55E18', borderRadius: borderRadius.pill, paddingVertical: 4, paddingHorizontal: 10, marginTop: 6, alignSelf: 'flex-start', gap: 4 },
  onlineDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.health.activity },
  onlineText: { fontSize: 12, fontWeight: '600', color: colors.health.activity },
  liveHealthCard: { backgroundColor: colors.background.card, borderRadius: borderRadius.xl, padding: 20, marginBottom: 16, ...shadows.elevatedCard },
  liveHealthHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  liveHealthTitle: { fontSize: 14, fontWeight: '600', color: colors.text.secondary },
  allGoodRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  allGoodText: { fontSize: 22, fontWeight: '800', color: colors.health.activity },
  updatedText: { fontSize: 12, color: colors.text.tertiary },
  metricsRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  metricCard: { flex: 1, backgroundColor: colors.background.card, borderRadius: borderRadius.xl, padding: 14, alignItems: 'center', ...shadows.elevatedCard },
  metricIconWrap: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  metricValue: { fontSize: 22, fontWeight: '800', color: colors.text.primary },
  metricUnit: { fontSize: 11, color: colors.text.tertiary, marginTop: 2 },
  metricLabel: { fontSize: 11, fontWeight: '600', color: colors.text.secondary, marginTop: 4 },
  todayCard: { backgroundColor: colors.background.card, borderRadius: borderRadius.xl, padding: 20, marginBottom: 20, ...shadows.elevatedCard },
  todayTitle: { fontSize: 14, fontWeight: '700', color: colors.text.primary, marginBottom: 14 },
  todayRow: { flexDirection: 'row', justifyContent: 'space-between' },
  todayItem: { alignItems: 'center', flex: 1 },
  todayValue: { fontSize: 18, fontWeight: '800', color: colors.text.primary },
  todayLabel: { fontSize: 11, color: colors.text.tertiary, marginTop: 2 },
  aiInputCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.background.card, borderRadius: borderRadius.pill, paddingVertical: 12, paddingHorizontal: 16, marginBottom: 20, ...shadows.elevatedCard, gap: 10 },
  aiIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.primary.DEFAULT + '18', alignItems: 'center', justifyContent: 'center' },
  aiPlaceholder: { flex: 1, fontSize: 14, color: colors.text.tertiary },
  aiSendBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.primary.DEFAULT, alignItems: 'center', justifyContent: 'center' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.text.primary },
  deviceRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.background.card, borderRadius: borderRadius.xl, padding: 14, marginBottom: 12, ...shadows.elevatedCard },
  deviceInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  deviceIconWrap: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.background.secondary, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  deviceName: { fontSize: 14, fontWeight: '600', color: colors.text.primary },
  deviceStatus: { fontSize: 12, color: colors.text.tertiary, marginTop: 1 },
});

export default function DashboardScreen({ navigation }: DashboardScreenProps<'Dashboard'>) {
  const insets = useSafeAreaInsets();
  const dogs = useDogStore((s) => s.dogs);
  const activeDogId = useDogStore((s) => s.activeDogId);
  const currentMetrics = useHealthStore((s) => s.currentMetrics);
  const isConnected = useBLEStore((s) => s.isConnected);
  const deviceName = useBLEStore((s) => s.connectedDeviceName);
  const alerts = useAlertStore((s) => s.alerts);
  const fetchAlerts = useAlertStore((s) => s.fetchAlerts);
  const fetchHeartRateHistory = useHealthStore((s) => s.fetchHeartRateHistory);
  const fetchTemperatureHistory = useHealthStore((s) => s.fetchTemperatureHistory);
  const fetchActivityHistory = useHealthStore((s) => s.fetchActivityHistory);
  const fetchLatestMetrics = useHealthStore((s) => s.fetchLatestMetrics);

  const activeDog = useMemo(
    () => dogs.find((d) => d.id === activeDogId) ?? null,
    [dogs, activeDogId],
  );

  const metrics = activeDogId ? currentMetrics[activeDogId] : undefined;

  const fetchAllData = useCallback(async () => {
    if (!activeDogId) return;
    await Promise.all([
      fetchHeartRateHistory(activeDogId),
      fetchTemperatureHistory(activeDogId),
      fetchActivityHistory(activeDogId),
      fetchLatestMetrics(activeDogId),
      fetchAlerts(),
    ]);
  }, [activeDogId, fetchHeartRateHistory, fetchTemperatureHistory, fetchActivityHistory, fetchLatestMetrics, fetchAlerts]);

  useEffect(() => { fetchAllData(); }, [fetchAllData]);

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchAllData().finally(() => setRefreshing(false));
  }, [fetchAllData]);

  const hasUnackedAlerts = useMemo(
    () => alerts.some((a) => !a.acknowledged && a.dogId === activeDogId),
    [alerts, activeDogId],
  );

  const handleAiPress = useCallback(() => {
    navigation.getParent()?.navigate('Chat');
  }, [navigation]);

  if (!activeDog) {
    return (
      <EmptyState
        icon="paw-outline"
        title="No Dog Profile"
        message="Add your dog to get started"
        actionLabel="Get Started"
        onAction={() => { navigation.getParent()?.navigate('Settings'); }}
      />
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary.DEFAULT} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>DogVita</Text>
          <TouchableOpacity style={styles.bellBtn} activeOpacity={0.7} onPress={() => navigation.getParent()?.navigate('Settings')}>
            <Ionicons name="notifications-outline" size={24} color={colors.text.primary} />
          </TouchableOpacity>
        </View>

        {/* Dog Profile Card */}
        <View style={styles.dogCard}>
          <View style={styles.dogPhoto}>
            {activeDog.imageUrl ? (
              <Image source={{ uri: activeDog.imageUrl }} style={styles.dogPhotoImg} />
            ) : (
              <Ionicons name="paw" size={28} color={colors.primary.DEFAULT} />
            )}
          </View>
          <View style={styles.dogInfo}>
            <Text style={styles.dogName}>{activeDog.name}</Text>
            <Text style={styles.dogBreed}>
              {activeDog.breed || 'Mixed'} · {activeDog.weight ? `${activeDog.weight} kg` : ''}
            </Text>
            <View style={styles.onlineBadge}>
              <View style={styles.onlineDot} />
              <Text style={styles.onlineText}>Online</Text>
            </View>
          </View>
        </View>

        {/* Live Health Status */}
        <View style={styles.liveHealthCard}>
          <Text style={styles.liveHealthTitle}>Live Health</Text>
          <View style={styles.allGoodRow}>
            <Text style={styles.allGoodText}>All Good</Text>
            <Text style={styles.updatedText}>Updated 2 min ago</Text>
          </View>
        </View>

        {/* Health Metric Cards */}
        <View style={styles.metricsRow}>
          <View style={styles.metricCard}>
            <View style={[styles.metricIconWrap, { backgroundColor: '#EF444418' }]}>
              <Ionicons name="heart" size={20} color={colors.health.heartRate} />
            </View>
            <Text style={styles.metricValue}>{metrics?.heartRate?.bpm ?? '--'}</Text>
            <Text style={styles.metricUnit}>bpm</Text>
            <Text style={styles.metricLabel}>Heart Rate</Text>
          </View>
          <View style={styles.metricCard}>
            <View style={[styles.metricIconWrap, { backgroundColor: '#F59E0B18' }]}>
              <Ionicons name="thermometer" size={20} color={colors.health.temperature} />
            </View>
            <Text style={styles.metricValue}>{metrics?.temperature?.celsius?.toFixed(1) ?? '--'}</Text>
            <Text style={styles.metricUnit}>°C</Text>
            <Text style={styles.metricLabel}>Temperature</Text>
          </View>
          <View style={styles.metricCard}>
            <View style={[styles.metricIconWrap, { backgroundColor: '#22C55E18' }]}>
              <Ionicons name="flash" size={20} color={colors.health.activity} />
            </View>
            <Text style={styles.metricValue}>{metrics?.activity?.activeMinutes ?? '--'}</Text>
            <Text style={styles.metricUnit}>min</Text>
            <Text style={styles.metricLabel}>Active</Text>
          </View>
        </View>

        {/* Today */}
        <View style={styles.todayCard}>
          <Text style={styles.todayTitle}>Today</Text>
          <View style={styles.todayRow}>
            <View style={styles.todayItem}>
              <Text style={styles.todayValue}>{metrics?.activity?.steps?.toLocaleString() ?? '--'}</Text>
              <Text style={styles.todayLabel}>Steps</Text>
            </View>
            <View style={styles.todayItem}>
              <Text style={styles.todayValue}>{metrics?.activity?.distance?.toFixed(1) ?? '--'}</Text>
              <Text style={styles.todayLabel}>km Walked</Text>
            </View>
            <View style={styles.todayItem}>
              <Text style={styles.todayValue}>{metrics?.activity?.calories ?? '--'}</Text>
              <Text style={styles.todayLabel}>kcal</Text>
            </View>
          </View>
        </View>

        {/* AI Chat Input */}
        <TouchableOpacity style={styles.aiInputCard} activeOpacity={0.7} onPress={handleAiPress}>
          <View style={styles.aiIcon}>
            <Ionicons name="chatbubble-ellipses" size={18} color={colors.primary.DEFAULT} />
          </View>
          <Text style={styles.aiPlaceholder}>Ask AI — How is {activeDog.name} doing today?</Text>
          <View style={styles.aiSendBtn}>
            <Ionicons name="arrow-up" size={18} color="#FFFFFF" />
          </View>
        </TouchableOpacity>

        {/* Device Status */}
        <View style={styles.deviceRow}>
          <View style={styles.deviceInfo}>
            <View style={styles.deviceIconWrap}>
              <Ionicons name="watch" size={18} color={colors.text.secondary} />
            </View>
            <View>
              <Text style={styles.deviceName}>{deviceName || 'No device'}</Text>
              <Text style={styles.deviceStatus}>{isConnected ? 'Connected' : 'Disconnected'}</Text>
            </View>
          </View>
          <StatusBadge label={isConnected ? 'Live' : 'Offline'} variant={isConnected ? 'success' : 'default'} size="sm" />
        </View>
      </ScrollView>
    </View>
  );
}
