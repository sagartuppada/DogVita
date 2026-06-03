/**
 * Supabase client configuration
 * Manages database connection and real-time subscriptions
 */

import { createClient, SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';
import { Database } from '../../types';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

const isConfigured = Boolean(supabaseUrl && supabaseAnonKey && !supabaseUrl.includes('your-project'));

if (!isConfigured) {
  console.warn('Supabase credentials not configured. Running in offline/test mode.');
}

let _supabase: SupabaseClient | null = null;

if (isConfigured) {
  _supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  });
}

export const supabase: SupabaseClient = _supabase as SupabaseClient;

export const getSupabaseUrl = () => supabaseUrl;
export const getSupabaseAnonKey = () => supabaseAnonKey;

export const isSupabaseConfigured = () => isConfigured;

export type RealtimeCallback = (payload: {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  table: string;
  new?: Record<string, unknown>;
  old?: Record<string, unknown>;
}) => void;

const activeSubscriptions: Map<string, RealtimeChannel> = new Map();

export const subscribeToTable = (
  table: string,
  callback: RealtimeCallback,
  filter?: string
): string | null => {
  if (!_supabase) return null;
  
  const subscriptionId = `${table}_${Date.now()}`;
  
  let channel = _supabase.channel(subscriptionId);
  
  if (filter) {
    channel = channel.on(
      'postgres_changes',
      { event: '*', schema: 'public', table, filter },
      (payload) => {
        const eventType = payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE';
        callback({
          eventType,
          table,
          new: payload.new as Record<string, unknown> | undefined,
          old: payload.old as Record<string, unknown> | undefined,
        });
      }
    );
  } else {
    channel = channel.on(
      'postgres_changes',
      { event: '*', schema: 'public', table },
      (payload) => {
        const eventType = payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE';
        callback({
          eventType,
          table,
          new: payload.new as Record<string, unknown> | undefined,
          old: payload.old as Record<string, unknown> | undefined,
        });
      }
    );
  }

  channel.subscribe();
  activeSubscriptions.set(subscriptionId, channel);

  return subscriptionId;
};

export const unsubscribeFromTable = (subscriptionId: string): void => {
  if (!_supabase) return;
  const channel = activeSubscriptions.get(subscriptionId);
  if (channel) {
    _supabase.removeChannel(channel);
    activeSubscriptions.delete(subscriptionId);
  }
};

export const unsubscribeAll = (): void => {
  if (!_supabase) return;
  activeSubscriptions.forEach((channel) => {
    _supabase!.removeChannel(channel);
  });
  activeSubscriptions.clear();
};

export default supabase;