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
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 20,
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
    marginBottom: 16,
  },
  errorText: {
    ...typography.styles.caption,
    color: '#EF4444',
    marginTop: -8,
    marginBottom: 12,
  },
  footer: {
    paddingHorizontal: 24,
  },
});

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

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
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
