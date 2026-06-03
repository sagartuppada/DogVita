/**
 * WelcomeScreen - Onboarding welcome screen
 */

import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Button } from '../../components/common';
import { colors, spacing, typography } from '../../theme';
import { OnboardingStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'Welcome'>;

export const WelcomeScreen: React.FC<Props> = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="paw" size={80} color={colors.primary[600]} />
        </View>
        <Text style={styles.title}>Dog Health App</Text>
        <Text style={styles.subtitle}>
          Monitor your dog's health in real-time with our smart wearable collar
        </Text>
      </View>
      <View style={styles.features}>
        <FeatureItem icon="heart" text="Heart rate monitoring" />
        <FeatureItem icon="location" text="GPS tracking & geofencing" />
        <FeatureItem icon="fitness" text="Activity tracking" />
        <FeatureItem icon="moon" text="Sleep monitoring" />
      </View>
      <View style={styles.testModeBanner}>
        <Text style={styles.testModeTitle}>🧪 Test Mode Active</Text>
        <Text style={styles.testModeSubtitle}>Use OTP: 123456 to verify</Text>
      </View>
      <View style={styles.footer}>
        <Button
          title="Get Started"
          onPress={() => navigation.navigate('AddPhoneNumber')}
          size="lg"
          style={styles.button}
        />
      </View>
    </SafeAreaView>
  );
};

const FeatureItem = ({ icon, text }: { icon: string; text: string }) => (
  <View style={styles.featureItem}>
    <Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={24} color={colors.primary[600]} />
    <Text style={styles.featureText}>{text}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
    padding: spacing.page,
  },
  content: {
    alignItems: 'center',
    paddingTop: spacing.xxxl,
  },
  iconContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: colors.primary[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xxl,
  },
  title: {
    ...typography.styles.displayMedium,
    color: colors.text.primary,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.styles.bodyLarge,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  features: {
    marginTop: spacing.xxxl,
    gap: spacing.lg,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  featureText: {
    ...typography.styles.bodyLarge,
    color: colors.text.primary,
  },
  testModeBanner: {
    backgroundColor: colors.status.info + '20',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 8,
    marginTop: spacing.md,
    alignItems: 'center',
  },
  testModeTitle: {
    ...typography.styles.labelMedium,
    color: colors.status.info,
    fontWeight: '600',
  },
  testModeSubtitle: {
    ...typography.styles.caption,
    color: colors.status.info,
    marginTop: 2,
  },
  footer: {
    marginTop: 'auto',
    paddingBottom: spacing.lg,
  },
  button: {
    width: '100%',
  },
});

export default WelcomeScreen;