/**
 * AddPhoneNumberScreen - Phone number entry
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Input, Header } from '../../components/common';
import { colors, spacing, typography } from '../../theme';
import type { OnboardingScreenProps } from '../../navigation/types';

export default function AddPhoneNumberScreen({
  navigation,
}: OnboardingScreenProps<'AddPhone'>) {
  const insets = useSafeAreaInsets();
  const [phoneNumber, setPhoneNumber] = useState('');

  const isValid = phoneNumber.length >= 10;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Header showBack onBack={() => navigation.goBack()} title="" />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        <View style={styles.headerSection}>
          <Text style={styles.title}>What's your number?</Text>
          <Text style={styles.subtitle}>
            We'll send you a verification code to get started
          </Text>
        </View>

        <View style={styles.form}>
          <Input
            placeholder="(555) 123-4567"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            keyboardType="phone-pad"
            maxLength={14}
          />
        </View>
      </KeyboardAvoidingView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.lg }]}>
        <Button
          title="Continue"
          onPress={() => navigation.navigate('OTP', { phoneNumber })}
          variant="primary"
          size="lg"
          disabled={!isValid}
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
    paddingHorizontal: spacing.xxl,
  },
  headerSection: {
    marginBottom: spacing.xxxl,
  },
  title: {
    ...typography.styles.headingLG,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.styles.bodyMD,
    color: colors.text.secondary,
  },
  form: {
    marginBottom: spacing.xl,
  },
  footer: {
    paddingHorizontal: spacing.xxl,
  },
});
