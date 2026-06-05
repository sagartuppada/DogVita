/**
 * Authentication service for phone + OTP flow
 * Includes TEST MODE for local development (OTP: 123456)
 */

import { supabase, isSupabaseConfigured } from '../api/supabase';
import { AuthUser, AuthSession } from '../../types';

const TEST_MODE = !isSupabaseConfigured() || process.env.NODE_ENV === 'development';
const TEST_OTP = '123456';

class AuthService {
  private static instance: AuthService;
  private testUser: AuthUser | null = null;

  private constructor() {}

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  async sendOTP(phone: string): Promise<{ success: boolean; error?: string }> {
    if (TEST_MODE) {
      console.log('[TEST MODE] OTP would be sent to:', phone, '(mock success)');
      return { success: true };
    }

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
    if (TEST_MODE) {
      if (token === TEST_OTP) {
        console.log('[TEST MODE] OTP verified successfully');
        const testUser: AuthUser = {
          id: 'test-user-001',
          phone: phone,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          lastLoginAt: new Date().toISOString(),
        };
        this.testUser = testUser;
        const session: AuthSession = {
          accessToken: 'test-token-' + Date.now(),
          refreshToken: 'test-refresh-' + Date.now(),
          expiresAt: Date.now() + 3600000,
          expiresIn: 3600,
          user: testUser,
        };
        return { session };
      }
      return { error: 'Invalid OTP. Use 123456 in test mode.' };
    }

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
    if (TEST_MODE) {
      this.testUser = null;
      return { success: true };
    }

    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  }

  async getCurrentUser(): Promise<AuthUser | null> {
    if (TEST_MODE) {
      return this.testUser;
    }

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
    if (TEST_MODE) {
      if (this.testUser) {
        return {
          accessToken: 'test-token-' + Date.now(),
          refreshToken: 'test-refresh-' + Date.now(),
          expiresAt: Date.now() + 3600000,
          expiresIn: 3600,
          user: this.testUser,
        };
      }
      return null;
    }

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
    if (TEST_MODE) {
      if (this.testUser) {
        setTimeout(() => callback(this.testUser), 0);
      }
      return () => {};
    }

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
      phone: user.phone || '',
      createdAt: user.created_at,
      updatedAt: user.updated_at || user.created_at,
      lastLoginAt: new Date().toISOString(),
      metadata: user.user_metadata,
    };
  }

  async refreshSession(): Promise<{ success: boolean; error?: string }> {
    if (TEST_MODE) {
      return { success: true };
    }

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

  isTestMode(): boolean {
    return TEST_MODE;
  }
}

export const authService = AuthService.getInstance();
export default authService;