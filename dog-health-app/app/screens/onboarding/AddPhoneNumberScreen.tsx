/**
 * AddPhoneNumberScreen - Phone number entry
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Input, Header } from '../../components/common';
import { spacing, typography } from '../../theme';
import { authService } from '../../services/auth/service';
import type { OnboardingScreenProps } from '../../navigation/types';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  headerSection: {
    marginBottom: 28,
  },
  title: {
    ...typography.styles.headingLG,
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    ...typography.styles.bodyMD,
    color: '#6B7280',
  },
  form: {
    marginBottom: 20,
  },
  footer: {
    paddingHorizontal: 24,
  },
});

export default function AddPhoneNumberScreen({
  navigation,
}: OnboardingScreenProps<'AddPhone'>) {
  const insets = useSafeAreaInsets();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);

  const isValid = phoneNumber.length >= 10;

  const handleContinue = async () => {
    if (!isValid) return;
    setLoading(true);
    const fullPhone = phoneNumber.startsWith('+') ? phoneNumber : `+91${phoneNumber.replace(/\D/g, '')}`;
    const { success, error } = await authService.sendOTP(fullPhone);
    setLoading(false);
    if (success) {
      navigation.navigate('OTP', { phoneNumber: fullPhone });
    } else {
      Alert.alert('Error', error || 'Failed to send verification code');
    }
  };

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

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <Button
          title="Continue"
          onPress={handleContinue}
          variant="primary"
          size="lg"
          disabled={!isValid}
          loading={loading}
        />
      </View>
    </View>
  );
}
