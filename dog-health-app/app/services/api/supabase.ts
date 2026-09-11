/**
 * Supabase client configuration
 * Manages database connection and real-time subscriptions
 *
 * IMPORTANT: react-native-dotenv (@env) does NOT reliably inline values
 * in release builds. The hardcoded fallbacks below are what the app
 * actually uses in production. Update them when rotating credentials.
 */

import { createClient, SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';
import { Database } from '../../types';
// @ts-ignore - react-native-dotenv module
import { SUPABASE_URL, SUPABASE_ANON_KEY, EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_ANON_KEY } from '@env';

// Production Supabase project (fallback — see header comment)
const supabaseUrl = SUPABASE_URL || EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = SUPABASE_ANON_KEY || EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

console.log('[supabase] ENV CHECK — URL:', supabaseUrl ? supabaseUrl.substring(0, 40) + '...' : '(empty)');
console.log('[supabase] ENV CHECK — Key:', supabaseAnonKey ? supabaseAnonKey.substring(0, 20) + '...' : '(empty)');

const _isConfigured = Boolean(supabaseUrl && supabaseAnonKey && !supabaseUrl.includes('your-project'));
console.log('[supabase] ENV CHECK — Configured:', _isConfigured);

if (!_isConfigured) {
  console.warn('Supabase credentials not configured. Running in offline/test mode.');
}

let _supabase: SupabaseClient | null = null;
let isConfigured = false;

if (_isConfigured) {
  try {
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
    isConfigured = true;
  } catch (error) {
    console.warn('[supabase] Failed to create client, running in offline mode:', (error as Error).message);
    _supabase = null;
    isConfigured = false;
  }
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