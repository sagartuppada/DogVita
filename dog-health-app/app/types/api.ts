/**
 * API-related type definitions
 */

import { SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';

// API Response types
export interface ApiResponse<T> {
  data: T | null;
  error: ApiError | null;
  status: number;
  message?: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  perPage: number;
  hasMore: boolean;
}

// Supabase types
export interface SupabaseClientConfig {
  url: string;
  anonKey: string;
  options?: {
    auth?: {
      persistSession?: boolean;
      autoRefreshToken?: boolean;
    };
  };
}

export interface RealtimeSubscription {
  channel: RealtimeChannel;
  table: string;
  filter?: string;
}

// Auth types
export interface AuthUser {
  id: string;
  email: string;
  phone: string;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string;
  metadata?: Record<string, unknown>;
}

export interface OTPRequest {
  phone: string;
}

export interface OTPVerify {
  phone: string;
  token: string;
}

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  expiresIn: number;
  user: AuthUser;
}

// API endpoint types
export interface Endpoints {
  auth: {
    sendOTP: string;
    verifyOTP: string;
    refreshToken: string;
    signOut: string;
  };
  dogs: {
    list: string;
    get: string;
    create: string;
    update: string;
    delete: string;
  };
  health: {
    metrics: string;
    heartRate: string;
    temperature: string;
    activity: string;
    sleep: string;
    trends: string;
  };
  tracking: {
    location: string;
    geofence: string;
    history: string;
  };
  alerts: {
    list: string;
    acknowledge: string;
    rules: string;
  };
}

// User types
export interface UserProfile {
  id: string;
  phone: string;
  name?: string;
  email?: string;
  avatar?: string;
  dogs: string[];
  preferences: UserPreferences;
  createdAt: string;
  updatedAt: string;
}

export interface UserPreferences {
  notifications: NotificationPreferences;
  privacy: PrivacyPreferences;
  display: DisplayPreferences;
}

export interface NotificationPreferences {
  pushEnabled: boolean;
  heartRateAlerts: boolean;
  geofenceAlerts: boolean;
  activityReminders: boolean;
  marketingEmails: boolean;
}

export interface PrivacyPreferences {
  shareLocation: boolean;
  anonymousAnalytics: boolean;
}

export interface DisplayPreferences {
  theme: 'light' | 'dark' | 'system';
  units: 'metric' | 'imperial';
  language: string;
}

// Database table types
export interface Database {
  public: {
    Tables: {
      users: {
        Row: UserProfile;
        Insert: Omit<UserProfile, 'createdAt' | 'updatedAt'>;
        Update: Partial<Omit<UserProfile, 'id' | 'createdAt'>>;
      };
      dogs: {
        Row: import('./dog').Dog;
        Insert: Omit<import('./dog').Dog, 'id' | 'createdAt' | 'updatedAt'>;
        Update: Partial<Omit<import('./dog').Dog, 'id'>>;
      };
      health_metrics: {
        Row: import('./health').HealthMetrics;
        Insert: Partial<import('./health').HealthMetrics>;
        Update: Partial<import('./health').HealthMetrics>;
      };
      alerts: {
        Row: import('./health').HealthAlert;
        Insert: Omit<import('./health').HealthAlert, 'id'>;
        Update: Partial<import('./health').HealthAlert>;
      };
    };
  };
}