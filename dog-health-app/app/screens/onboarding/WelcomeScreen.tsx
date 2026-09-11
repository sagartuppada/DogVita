/**
 * WelcomeScreen - Premium welcome landing
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Button } from '../../components/common';
import { spacing, typography, borderRadius, shadows } from '../../theme';
import type { OnboardingScreenProps } from '../../navigation/types';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 24,
  },
  logoArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 28,
  },
  logoCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#F0FDF4',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    ...shadows.md,
  },
  appName: {
    ...typography.styles.headingXL,
    color: '#15803D',
    marginBottom: 8,
  },
  tagline: {
    ...typography.styles.bodyMD,
    color: '#6B7280',
    textAlign: 'center',
  },
  features: {
    marginBottom: 28,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  featureIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    ...typography.styles.bodyLG,
    color: '#111827',
    fontWeight: '600',
  },
  featureDesc: {
    ...typography.styles.bodySM,
    color: '#6B7280',
    marginTop: 2,
  },
  cta: {
    paddingBottom: 20,
  },
  signInLink: {
    alignItems: 'center',
    marginTop: 16,
  },
  signInText: {
    ...typography.styles.bodyMD,
    color: '#15803D',
    fontWeight: '500',
  },
  skipLink: {
    alignItems: 'center',
    marginTop: 12,
  },
  skipText: {
    ...typography.styles.bodySM,
    color: '#9CA3AF',
  },
});

export default function WelcomeScreen({ navigation }: OnboardingScreenProps<'Welcome'>) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      {/* Logo Area */}
      <View style={styles.logoArea}>
        <View style={styles.logoCircle}>
          <Ionicons name="paw" size={48} color="#16A34A" />
        </View>
        <Text style={styles.appName}>DogVita</Text>
        <Text style={styles.tagline}>Smart health monitoring for your best friend</Text>
      </View>

      {/* Features */}
      <View style={styles.features}>
        <View style={styles.featureRow}>
          <View style={[styles.featureIcon, { backgroundColor: '#EF444418' }]}>
            <Ionicons name="heart" size={20} color="#EF4444" />
          </View>
          <View style={styles.featureText}>
            <Text style={styles.featureTitle}>Real-time Health</Text>
            <Text style={styles.featureDesc}>Heart rate, temperature, and SpO₂</Text>
          </View>
        </View>

        <View style={styles.featureRow}>
          <View style={[styles.featureIcon, { backgroundColor: '#3B82F618' }]}>
            <Ionicons name="location" size={20} color="#3B82F6" />
          </View>
          <View style={styles.featureText}>
            <Text style={styles.featureTitle}>Live Tracking</Text>
            <Text style={styles.featureDesc}>GPS location and activity monitoring</Text>
          </View>
        </View>

        <View style={styles.featureRow}>
          <View style={[styles.featureIcon, { backgroundColor: '#22C55E18' }]}>
            <Ionicons name="shield-checkmark" size={20} color="#22C55E" />
          </View>
          <View style={styles.featureText}>
            <Text style={styles.featureTitle}>Smart Alerts</Text>
            <Text style={styles.featureDesc}>Instant notifications for health changes</Text>
          </View>
        </View>
      </View>

      {/* CTA */}
      <View style={styles.cta}>
        <Button
          title="Get Started"
          onPress={() => navigation.navigate('SignUp')}
          variant="primary"
          size="lg"
        />
        <TouchableOpacity
          onPress={() => navigation.navigate('Login')}
          style={styles.signInLink}
          activeOpacity={0.7}
        >
          <Text style={styles.signInText}>Already have an account? Sign In</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => {
            const { useSettingsStore } = require('../../store/settingsStore');
            useSettingsStore.getState().setOnboardingComplete();
            const rootNav = navigation.getParent()?.getParent();
            if (rootNav) {
              rootNav.navigate('Main');
            }
          }}
          style={styles.skipLink}
          activeOpacity={0.7}
        >
          <Text style={styles.skipText}>Skip for now</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
