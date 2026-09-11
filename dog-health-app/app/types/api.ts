import type { Dog } from './dog';
import type { HealthMetrics, HealthAlert } from './health';

// ponytail: only types actually imported by consumers

export interface AuthUser {
  id: string;
  email: string;
  phone: string;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string;
  metadata?: Record<string, unknown>;
}

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  expiresIn: number;
  user: AuthUser;
}

export interface Database {
  public: {
    Tables: {
      users: {
        Row: AuthUser;
        Insert: Omit<AuthUser, 'createdAt' | 'updatedAt'>;
        Update: Partial<Omit<AuthUser, 'id' | 'createdAt'>>;
      };
      dogs: {
        Row: Dog;
        Insert: Omit<Dog, 'id' | 'createdAt' | 'updatedAt'>;
        Update: Partial<Omit<Dog, 'id'>>;
      };
      health_metrics: {
        Row: HealthMetrics;
        Insert: Partial<HealthMetrics>;
        Update: Partial<HealthMetrics>;
      };
      alerts: {
        Row: HealthAlert;
        Insert: Omit<HealthAlert, 'id'>;
        Update: Partial<HealthAlert>;
      };
    };
  };
}
