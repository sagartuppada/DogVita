/**
 * PairDeviceScreen - BLE device pairing
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Button, Header, StatusBadge } from '../../components/common';
import { colors, spacing, typography, borderRadius, shadows } from '../../theme';
import type { OnboardingScreenProps } from '../../navigation/types';
import { useSettingsStore } from '../../store/settingsStore';

export default function PairDeviceScreen({
  navigation,
}: OnboardingScreenProps<'PairDevice'>) {
  const insets = useSafeAreaInsets();
  const [status, setStatus] = useState<'scanning' | 'found' | 'pairing' | 'connected' | 'error'>('scanning');
  const pulseAnim = new Animated.Value(1);

  useEffect(() => {
    if (status === 'scanning') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.15, duration: 1000, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
        ])
      ).start();

      // Simulate finding device
      const timer = setTimeout(() => setStatus('found'), 3000);
      return () => clearTimeout(timer);
    }
  }, [status]);

  const getStatusConfig = () => {
    switch (status) {
      case 'scanning':
        return { icon: 'bluetooth', color: colors.primary.DEFAULT, text: 'Scanning for devices...' };
      case 'found':
        return { icon: 'watch', color: colors.status.info, text: 'DogVita Collar found!' };
      case 'pairing':
        return { icon: 'sync', color: colors.primary.DEFAULT, text: 'Pairing...' };
      case 'connected':
        return { icon: 'checkmark-circle', color: colors.status.success, text: 'Connected!' };
      case 'error':
        return { icon: 'alert-circle', color: colors.status.error, text: 'Pairing failed' };
    }
  };

  const config = getStatusConfig();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Header showBack onBack={() => navigation.goBack()} title="" />

      <View style={styles.content}>
        {/* Pulse Animation */}
        <View style={styles.pulseArea}>
          <Animated.View
            style={[
              styles.pulseRing,
              { transform: [{ scale: pulseAnim }], borderColor: config.color + '30' },
            ]}
          />
          <Animated.View
            style={[
              styles.pulseRingInner,
              { transform: [{ scale: pulseAnim }], borderColor: config.color + '20' },
            ]}
          />
          <View style={[styles.pulseIcon, { backgroundColor: config.color + '18' }]}>
            <Ionicons name={config.icon} size={40} color={config.color} />
          </View>
        </View>

        <Text style={styles.statusText}>{config.text}</Text>

        {status === 'found' && (
          <View style={styles.devicePreview}>
            <View style={styles.deviceRow}>
              <Ionicons name="watch" size={24} color={colors.text.secondary} />
              <View style={styles.deviceInfo}>
                <Text style={styles.deviceName}>DogVita Collar</Text>
                <Text style={styles.deviceId}>Signal: Strong</Text>
              </View>
              <StatusBadge label="Ready" variant="success" size="sm" />
            </View>
          </View>
        )}

        {status === 'error' && (
          <Text style={styles.errorHint}>
            Make sure your collar is charged and nearby
          </Text>
        )}
      </View>

      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.lg }]}>
        {status === 'scanning' && (
          <Button
            title="Cancel"
            onPress={() => navigation.goBack()}
            variant="secondary"
            size="lg"
          />
        )}
        {status === 'found' && (
          <Button
            title="Pair Now"
            onPress={() => {
              setStatus('pairing');
              setTimeout(() => setStatus('connected'), 2000);
            }}
            variant="primary"
            size="lg"
          />
        )}
        {status === 'connected' && (
          <Button
            title="Start Using DogVita"
            onPress={() => {
              useSettingsStore.getState().setOnboardingComplete();
              const rootNav = navigation.getParent()?.getParent();
              if (rootNav) {
                rootNav.navigate('Main');
              }
            }}
            variant="primary"
            size="lg"
          />
        )}
        {status === 'error' && (
          <Button
            title="Try Again"
            onPress={() => setStatus('scanning')}
            variant="primary"
            size="lg"
          />
        )}
        <Button
          title="Skip for Now"
          onPress={() => {
            useSettingsStore.getState().setOnboardingComplete();
            const rootNav = navigation.getParent()?.getParent();
            if (rootNav) {
              rootNav.navigate('Main');
            }
          }}
          variant="ghost"
          size="md"
          style={styles.skipBtn}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
  },
  pulseArea: {
    width: 160,
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xxl,
  },
  pulseRing: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 2,
  },
  pulseRingInner: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 1.5,
  },
  pulseIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusText: {
    ...typography.styles.headingSM,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.xxl,
  },
  devicePreview: {
    width: '100%',
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    ...shadows.card,
  },
  deviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deviceInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  deviceName: {
    ...typography.styles.bodyMD,
    color: colors.text.primary,
    fontWeight: '600',
  },
  deviceId: {
    ...typography.styles.caption,
    color: colors.text.tertiary,
  },
  errorHint: {
    ...typography.styles.bodySM,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
  footer: {
    paddingHorizontal: spacing.xxl,
  },
  skipBtn: {
    marginTop: spacing.md,
  },
});
