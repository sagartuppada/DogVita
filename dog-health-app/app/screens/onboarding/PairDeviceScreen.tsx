/**
 * PairDeviceScreen - BLE device pairing
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Button, Header, StatusBadge } from '../../components/common';
import { spacing, typography, borderRadius, shadows } from '../../theme';
import type { OnboardingScreenProps } from '../../navigation/types';
import { useSettingsStore } from '../../store/settingsStore';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  pulseArea: {
    width: 160,
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
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
    color: '#111827',
    textAlign: 'center',
    marginBottom: 24,
  },
  devicePreview: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    ...shadows.card,
  },
  deviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deviceInfo: {
    flex: 1,
    marginLeft: 12,
  },
  deviceName: {
    ...typography.styles.bodyMD,
    color: '#111827',
    fontWeight: '600',
  },
  deviceId: {
    ...typography.styles.caption,
    color: '#9CA3AF',
  },
  errorHint: {
    ...typography.styles.bodySM,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 16,
  },
  footer: {
    paddingHorizontal: 24,
  },
});

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
        return { icon: 'bluetooth', color: '#16A34A', text: 'Scanning for devices...' };
      case 'found':
        return { icon: 'watch', color: '#3B82F6', text: 'DogVita Collar found!' };
      case 'pairing':
        return { icon: 'sync', color: '#16A34A', text: 'Pairing...' };
      case 'connected':
        return { icon: 'checkmark-circle', color: '#22C55E', text: 'Connected!' };
      case 'error':
        return { icon: 'alert-circle', color: '#EF4444', text: 'Pairing failed' };
    }
  };

  const config = getStatusConfig()!;

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
              <Ionicons name="watch" size={24} color="#6B7280" />
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

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
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

      </View>
    </View>
  );
}
