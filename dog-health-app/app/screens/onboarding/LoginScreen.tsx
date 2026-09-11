/**
 * LoginScreen - Email + password login
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
  footer: {
    paddingHorizontal: 24,
  },
});

export default function LoginScreen({
  navigation,
}: OnboardingScreenProps<'Login'>) {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const isValid = email.includes('@') && password.length >= 6;

  const handleLogin = async () => {
    if (!isValid) return;
    setLoading(true);

    const { session, error } = await authService.signInWithEmail(email, password);
    setLoading(false);

    if (error) {
      Alert.alert('Login Failed', error);
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
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.content}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.headerSection}>
            <Text style={styles.title}>Welcome back</Text>
            <Text style={styles.subtitle}>
              Sign in to your DogVita account
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
              placeholder="Your password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <Button
          title="Sign In"
          onPress={handleLogin}
          variant="primary"
          size="lg"
          disabled={!isValid}
          loading={loading}
        />
      </View>
    </View>
  );
}
