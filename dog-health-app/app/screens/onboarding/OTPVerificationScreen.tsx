/**
 * OTPVerificationScreen - OTP verification
 */

import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Alert, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Button } from '../../components/common';
import { colors, spacing, typography } from '../../theme';
import { OnboardingStackParamList } from '../../navigation/types';
import { authService } from '../../services/auth';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'OTPVerification'>;

export const OTPVerificationScreen: React.FC<Props> = ({ navigation, route }) => {
  const { phoneNumber } = route.params;
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setResendTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleVerify = async () => {
    if (otp.length < 6) {
      Alert.alert('Error', 'Please enter the 6-digit code');
      return;
    }

    setLoading(true);
    try {
      const result = await authService.verifyOTP(phoneNumber, otp);
      if (result.session) {
        navigation.navigate('SetupDogProfile');
      } else {
        Alert.alert('Error', result.error || 'Verification failed');
      }
    } catch {
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    const result = await authService.resendOTP(phoneNumber);
    if (result.success) {
      setResendTimer(60);
      setOtp('');
    } else {
      Alert.alert('Error', result.error || 'Failed to resend code');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
        <View style={styles.content}>
          <Text style={styles.title}>Verify your number</Text>
          <Text style={styles.subtitle}>
            Enter the 6-digit code sent to{'\n'}{phoneNumber}
          </Text>
          <View style={styles.testModeHint}>
            <Text style={styles.testModeText}>🧪 TEST MODE: Use code 123456</Text>
          </View>
          <View style={styles.otpContainer}>
            <TextInput
              ref={inputRef}
              style={styles.otpInput}
              value={otp}
              onChangeText={setOtp}
              keyboardType="number-pad"
              maxLength={6}
              placeholder="• • • • • •"
              placeholderTextColor={colors.text.tertiary}
              textAlign="center"
            />
          </View>
          <Button
            title="Verify"
            onPress={handleVerify}
            loading={loading}
            disabled={otp.length < 6}
            style={styles.button}
          />
          <View style={styles.resendContainer}>
            {resendTimer > 0 ? (
              <Text style={styles.resendText}>Resend in {resendTimer}s</Text>
            ) : (
              <Button title="Resend Code" onPress={handleResend} variant="ghost" />
            )}
          </View>
          <Button
            title="Change Number"
            onPress={() => navigation.goBack()}
            variant="ghost"
            style={styles.changeButton}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: spacing.page,
    paddingTop: spacing.xxxl,
  },
  title: {
    ...typography.styles.headlineMedium,
    color: colors.text.primary,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.styles.bodyLarge,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  testModeHint: {
    backgroundColor: colors.status.info + '20',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 8,
    marginBottom: spacing.lg,
    alignItems: 'center',
  },
  testModeText: {
    ...typography.styles.labelMedium,
    color: colors.status.info,
  },
  otpContainer: {
    marginBottom: spacing.xxl,
  },
  otpInput: {
    ...typography.styles.displaySmall,
    color: colors.text.primary,
    letterSpacing: 16,
    paddingVertical: spacing.lg,
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
  },
  button: {
    marginBottom: spacing.lg,
  },
  resendContainer: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  resendText: {
    ...typography.styles.bodyMedium,
    color: colors.text.secondary,
  },
  changeButton: {
    marginTop: spacing.md,
  },
});

export default OTPVerificationScreen;