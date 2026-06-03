/**
 * AddPhoneNumberScreen - Phone number entry
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Button, Input } from '../../components/common';
import { colors, spacing, typography } from '../../theme';
import { OnboardingStackParamList } from '../../navigation/types';
import { authService } from '../../services/auth';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'AddPhoneNumber'>;

export const AddPhoneNumberScreen: React.FC<Props> = ({ navigation }) => {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendOTP = async () => {
    if (!phone.trim()) {
      Alert.alert('Error', 'Please enter your phone number');
      return;
    }

    setLoading(true);
    try {
      const result = await authService.sendOTP(phone);
      if (result.success) {
        navigation.navigate('OTPVerification', { phoneNumber: phone });
      } else {
        Alert.alert('Error', result.error || 'Failed to send OTP');
      }
    } catch {
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Enter your phone number</Text>
        <Text style={styles.subtitle}>
          We'll send you a verification code
        </Text>
        <Input
          placeholder="+1 (555) 123-4567"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          autoComplete="tel"
          containerStyle={styles.input}
        />
        <Button
          title="Send Code"
          onPress={handleSendOTP}
          loading={loading}
          style={styles.button}
        />
        <Button
          title="Back"
          onPress={() => navigation.goBack()}
          variant="ghost"
          style={styles.backButton}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
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
    marginBottom: spacing.xxl,
  },
  input: {
    marginBottom: spacing.lg,
  },
  button: {
    marginTop: spacing.md,
  },
  backButton: {
    marginTop: spacing.md,
  },
});

export default AddPhoneNumberScreen;