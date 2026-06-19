/**
 * OTPVerificationScreen - OTP code verification
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Header } from '../../components/common';
import { colors, spacing, typography, borderRadius, shadows } from '../../theme';
import { authService } from '../../services/auth/service';
import type { OnboardingScreenProps } from '../../navigation/types';

export default function OTPVerificationScreen({
  route,
  navigation,
}: OnboardingScreenProps<'OTP'>) {
  const insets = useSafeAreaInsets();
  const { phoneNumber } = route.params;
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const inputs = useRef<(TextInput | null)[]>([]);
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const handleResend = useCallback(async () => {
    if (resendCooldown > 0) return;
    const { success, error } = await authService.resendOTP(phoneNumber);
    if (success) {
      setResendCooldown(30);
      Alert.alert('Code Sent', `A new verification code was sent to ${phoneNumber}`);
    } else {
      Alert.alert('Error', error || 'Failed to resend code');
    }
  }, [phoneNumber, resendCooldown]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((c) => Math.max(0, c - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleChange = (text: string, index: number) => {
    if (text.length > 1) text = text.slice(-1);
    const newCode = [...code];
    newCode[index] = text;
    setCode(newCode);
    if (text && index < 5) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !code[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const fullCode = code.join('');
  const isValid = fullCode.length === 6;

  const handleVerify = async () => {
    if (!isValid) return;
    setLoading(true);
    const token = fullCode;
    const { session, error } = await authService.verifyOTP(phoneNumber, token);
    setLoading(false);
    if (session) {
      navigation.navigate('SetupDog');
    } else {
      Alert.alert('Verification Failed', error || 'Invalid code. Please try again.');
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
          <Text style={styles.title}>Verify your number</Text>
          <Text style={styles.subtitle}>
            Enter the 6-digit code sent to{'\n'}{phoneNumber}
          </Text>
        </View>

        <View style={styles.codeRow}>
          {code.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => { inputs.current[index] = ref; }}
              style={[styles.codeInput, digit ? styles.codeInputFilled : null]}
              value={digit}
              onChangeText={(text) => handleChange(text, index)}
              onKeyPress={(e) => handleKeyPress(e, index)}
              keyboardType="number-pad"
              maxLength={1}
              selectTextOnFocus
            />
          ))}
        </View>
      </KeyboardAvoidingView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.lg }]}>
        <Button
          title="Verify"
          onPress={handleVerify}
          variant="primary"
          size="lg"
          disabled={!isValid}
          loading={loading}
        />
        <Button
          title={resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}
          onPress={handleResend}
          variant="ghost"
          size="md"
          style={styles.resendBtn}
          disabled={resendCooldown > 0}
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
    lineHeight: 22,
  },
  codeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
  },
  codeInput: {
    width: 48,
    height: 56,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.background.secondary,
    borderWidth: 1.5,
    borderColor: colors.border.light,
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '700',
    color: colors.text.primary,
  },
  codeInputFilled: {
    borderColor: colors.primary.DEFAULT,
    backgroundColor: colors.white,
  },
  footer: {
    paddingHorizontal: spacing.xxl,
  },
  resendBtn: {
    marginTop: spacing.md,
  },
});
