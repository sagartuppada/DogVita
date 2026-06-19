/**
 * WelcomeScreen - Premium welcome landing
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Button } from '../../components/common';
import { colors, spacing, typography, borderRadius, shadows } from '../../theme';
import type { OnboardingScreenProps } from '../../navigation/types';

export default function WelcomeScreen({ navigation }: OnboardingScreenProps<'Welcome'>) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      {/* Logo Area */}
      <View style={styles.logoArea}>
        <View style={styles.logoCircle}>
          <Ionicons name="paw" size={48} color={colors.primary.DEFAULT} />
        </View>
        <Text style={styles.appName}>DogVita</Text>
        <Text style={styles.tagline}>Smart health monitoring for your best friend</Text>
      </View>

      {/* Features */}
      <View style={styles.features}>
        <View style={styles.featureRow}>
          <View style={[styles.featureIcon, { backgroundColor: colors.health.heartRate + '18' }]}>
            <Ionicons name="heart" size={20} color={colors.health.heartRate} />
          </View>
          <View style={styles.featureText}>
            <Text style={styles.featureTitle}>Real-time Health</Text>
            <Text style={styles.featureDesc}>Heart rate, temperature, and SpO₂</Text>
          </View>
        </View>

        <View style={styles.featureRow}>
          <View style={[styles.featureIcon, { backgroundColor: colors.status.info + '18' }]}>
            <Ionicons name="location" size={20} color={colors.status.info} />
          </View>
          <View style={styles.featureText}>
            <Text style={styles.featureTitle}>Live Tracking</Text>
            <Text style={styles.featureDesc}>GPS location and activity monitoring</Text>
          </View>
        </View>

        <View style={styles.featureRow}>
          <View style={[styles.featureIcon, { backgroundColor: colors.status.success + '18' }]}>
            <Ionicons name="shield-checkmark" size={20} color={colors.status.success} />
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
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
    paddingHorizontal: spacing.xxl,
  },
  logoArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: spacing.xxxl,
  },
  logoCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
    ...shadows.md,
  },
  appName: {
    ...typography.styles.headingXL,
    color: colors.primary.dark,
    marginBottom: spacing.sm,
  },
  tagline: {
    ...typography.styles.bodyMD,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  features: {
    marginBottom: spacing.xxxl,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  featureIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.lg,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    ...typography.styles.bodyLG,
    color: colors.text.primary,
    fontWeight: '600',
  },
  featureDesc: {
    ...typography.styles.bodySM,
    color: colors.text.secondary,
    marginTop: 2,
  },
  cta: {
    paddingBottom: spacing.xl,
  },
  signInLink: {
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  signInText: {
    ...typography.styles.bodyMD,
    color: colors.primary.dark,
    fontWeight: '500',
  },
});
