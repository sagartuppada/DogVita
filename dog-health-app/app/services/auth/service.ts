/**
 * Authentication service — email+password + phone+OTP
 * All methods call Supabase directly — no test mode bypass
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../api/supabase';
import { AuthUser, AuthSession } from '../../types';

const STORE_KEYS = [
  'dog-storage',
  'health-storage',
  'alert-storage',
  'tracking-storage',
  'ble-storage',
  'settings-storage',
];

class AuthService {
  private static instance: AuthService;

  private constructor() {}

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  async signUpWithEmail(email: string, password: string): Promise<{ session?: AuthSession; error?: string }> {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        return { error: error.message };
      }

      if (data.session) {
        const session: AuthSession = {
          accessToken: data.session.access_token,
          refreshToken: data.session.refresh_token,
          expiresAt: data.session.expires_at || 0,
          expiresIn: data.session.expires_in || 0,
          user: this.mapUser(data.session.user),
        };
        return { session };
      }

      return { error: 'Check your email for a confirmation link' };
    } catch (err) {
      return { error: (err as Error).message };
    }
  }

  async signInWithEmail(email: string, password: string): Promise<{ session?: AuthSession; error?: string }> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { error: error.message };
      }

      if (data.session) {
        const session: AuthSession = {
          accessToken: data.session.access_token,
          refreshToken: data.session.refresh_token,
          expiresAt: data.session.expires_at || 0,
          expiresIn: data.session.expires_in || 0,
          user: this.mapUser(data.session.user),
        };
        return { session };
      }

      return { error: 'No session returned' };
    } catch (err) {
      return { error: (err as Error).message };
    }
  }

  async sendOTP(phone: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.auth.signInWithOtp({
        phone,
        options: { channel: 'sms' },
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  }

  async verifyOTP(phone: string, token: string): Promise<{ session?: AuthSession; error?: string }> {
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        phone,
        token,
        type: 'sms',
      });

      if (error) {
        return { error: error.message };
      }

      if (data.session) {
        const session: AuthSession = {
          accessToken: data.session.access_token,
          refreshToken: data.session.refresh_token,
          expiresAt: data.session.expires_at || 0,
          expiresIn: data.session.expires_in || 0,
          user: this.mapUser(data.user!),
        };
        return { session };
      }

      return { error: 'No session returned' };
    } catch (err) {
      return { error: (err as Error).message };
    }
  }

  async resendOTP(phone: string): Promise<{ success: boolean; error?: string }> {
    return this.sendOTP(phone);
  }

  async signOut(): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        return { success: false, error: error.message };
      }
      await AsyncStorage.multiRemove(STORE_KEYS);

      // Reset Zustand stores to initial state in memory
      // AsyncStorage is cleared but Zustand keeps old state in memory
      const { useSettingsStore } = require('../../store/settingsStore');
      const { useDogStore } = require('../../store/dogStore');
      const { useAlertStore } = require('../../store/alertStore');
      const { useTrackingStore } = require('../../store/trackingStore');
      const { useHealthStore } = require('../../store/healthStore');

      useSettingsStore.setState({
        hasCompletedOnboarding: false,
        isFirstLaunch: true,
      });
      useDogStore.setState({ dogs: [], activeDogId: null });
      useAlertStore.setState({ alerts: [] });
      useHealthStore.setState({
        heartRateHistory: [],
        temperatureHistory: [],
        activityHistory: [],
        currentMetrics: {},
      });
      useTrackingStore.setState({ locations: [], geofences: [] });

      return { success: true };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  }

  async getCurrentUser(): Promise<AuthUser | null> {
    try {
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        return this.mapUser(data.user);
      }
      return null;
    } catch {
      return null;
    }
  }

  async getSession(): Promise<AuthSession | null> {
    try {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        return {
          accessToken: data.session.access_token,
          refreshToken: data.session.refresh_token,
          expiresAt: data.session.expires_at || 0,
          expiresIn: data.session.expires_in || 0,
          user: this.mapUser(data.session.user),
        };
      }
      return null;
    } catch {
      return null;
    }
  }

  onAuthStateChange(callback: (user: AuthUser | null) => void): () => void {
    const { data } = supabase.auth.onAuthStateChange((_, session) => {
      if (session?.user) {
        callback(this.mapUser(session.user));
      } else {
        callback(null);
      }
    });

    return () => {
      data.subscription.unsubscribe();
    };
  }

  private mapUser(user: import('@supabase/supabase-js').User): AuthUser {
    return {
      id: user.id,
      email: user.email || '',
      phone: user.phone || '',
      createdAt: user.created_at,
      updatedAt: user.updated_at || user.created_at,
      lastLoginAt: new Date().toISOString(),
      metadata: user.user_metadata,
    };
  }

  async refreshSession(): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.auth.refreshSession();
      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  }
}

export const authService = AuthService.getInstance();
export default authService;
