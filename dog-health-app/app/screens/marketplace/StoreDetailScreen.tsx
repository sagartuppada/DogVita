import React from 'react';
import { View, Text, StyleSheet, Pressable, Linking, ScrollView } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { spacing, borderRadius, colors } from '../../theme';
import type { RootStackParamList } from '../../navigation/types';

type StoreDetailRouteProp = RouteProp<RootStackParamList, 'StoreDetail'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const StoreDetailScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<StoreDetailRouteProp>();
  const { storeId } = route.params;

  const isAllStores = storeId === 'all';

  const handleDirections = () => {
    if (isAllStores) return;
    const lat = 37.7749;
    const lng = -122.4194;
    Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`).catch(() => {});
  };

  const handleCall = () => {
    Linking.openURL('tel:+15550101').catch(() => {});
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.navBar}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </Pressable>
        <Text style={styles.navTitle}>{isAllStores ? 'Pet Stores' : 'Store Details'}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
        <View style={styles.storeIconContainer}>
          <View style={styles.storeIcon}>
            <Ionicons name="storefront" size={48} color={colors.primary.DEFAULT} />
          </View>
        </View>

        <View style={styles.content}>
          <Text style={styles.storeName}>
            {isAllStores ? 'Pet Stores' : 'Paws & Claws Pet Supply'}
          </Text>
          <Text style={styles.storeAddress}>
            {isAllStores ? 'Browse pet stores near you' : '123 Main St, Anytown, USA'}
          </Text>

          {!isAllStores && (
            <>
              <View style={styles.infoRow}>
                <Ionicons name="time-outline" size={18} color={colors.text.secondary} />
                <Text style={styles.infoText}>Mon-Sat 9am-8pm, Sun 10am-6pm</Text>
              </View>
              <View style={styles.infoRow}>
                <Ionicons name="location-outline" size={18} color={colors.text.secondary} />
                <Text style={styles.infoText}>1.2 km away</Text>
              </View>
            </>
          )}
        </View>

        <View style={styles.actions}>
          <Pressable style={styles.actionBtn} onPress={handleDirections}>
            <Ionicons name="navigate-outline" size={22} color={colors.white} />
            <Text style={styles.actionBtnText}>Get Directions</Text>
          </Pressable>

          <Pressable
            style={[styles.actionBtn, styles.secondaryActionBtn]}
            onPress={handleCall}
          >
            <Ionicons name="call-outline" size={22} color={colors.primary.DEFAULT} />
            <Text style={styles.secondaryActionBtnText}>Call Store</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.primary },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.page,
    paddingVertical: spacing.md,
  },
  backBtn: { padding: spacing.xs },
  navTitle: { fontSize: 17, fontWeight: '600', color: colors.text.primary },
  body: { flex: 1 },
  storeIconContainer: { alignItems: 'center', paddingVertical: spacing.xxl },
  storeIcon: {
    width: 100,
    height: 100,
    borderRadius: borderRadius.xxl,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { padding: spacing.page, alignItems: 'center' },
  storeName: { fontSize: 22, fontWeight: '700', color: colors.text.primary, marginBottom: spacing.sm, textAlign: 'center' },
  storeAddress: { fontSize: 15, color: colors.text.secondary, textAlign: 'center', marginBottom: spacing.lg },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  infoText: { fontSize: 14, color: colors.text.secondary, marginLeft: spacing.sm },
  actions: {
    flexDirection: 'row',
    padding: spacing.page,
    gap: spacing.md,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary.DEFAULT,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  actionBtnText: { fontSize: 15, fontWeight: '600', color: colors.white },
  secondaryActionBtn: {
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.primary.DEFAULT,
  },
  secondaryActionBtnText: { fontSize: 15, fontWeight: '600', color: colors.primary.DEFAULT },
});

export default StoreDetailScreen;