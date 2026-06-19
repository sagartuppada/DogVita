/**
 * SignUpScreen - Email + password registration
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Input, Header } from '../../components/common';
import { colors, spacing, typography } from '../../theme';
import { authService } from '../../services/auth/service';
import type { OnboardingScreenProps } from '../../navigation/types';

export default function SignUpScreen({
  navigation,
}: OnboardingScreenProps<'SignUp'>) {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const isValid =
    email.includes('@') &&
    password.length >= 6 &&
    password === confirmPassword;

  const handleSignUp = async () => {
    if (!isValid) return;
    setLoading(true);

    const { session, error } = await authService.signUpWithEmail(email, password);
    setLoading(false);

    if (error) {
      Alert.alert('Sign Up Failed', error);
      return;
    }

    if (session) {
      navigation.navigate('SetupDog');
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Header showBack onBack={() => navigation.goBack()} title="" />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.headerSection}>
            <Text style={styles.title}>Create your account</Text>
            <Text style={styles.subtitle}>
              Sign up to start monitoring your dog's health
            </Text>
          </View>

          <View style={styles.form}>
            <Input
              label="Email"
              placeholder="you@example.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <Input
              label="Password"
              placeholder="At least 6 characters"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />

            <Input
              label="Confirm Password"
              placeholder="Re-enter password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
            />

            {password.length > 0 && password !== confirmPassword && (
              <Text style={styles.errorText}>Passwords do not match</Text>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.lg }]}>
        <Button
          title="Sign Up"
          onPress={handleSignUp}
          variant="primary"
          size="lg"
          disabled={!isValid}
          loading={loading}
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
  },
  scrollContent: {
    paddingHorizontal: spacing.xxl,
    paddingBottom: spacing.xl,
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
    marginBottom: spacing.lg,
  },
  errorText: {
    ...typography.styles.caption,
    color: colors.status.error,
    marginTop: -spacing.sm,
    marginBottom: spacing.md,
  },
  footer: {
    paddingHorizontal: spacing.xxl,
  },
});
