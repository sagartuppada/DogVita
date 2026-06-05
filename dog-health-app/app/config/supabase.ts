/**
 * Supabase configuration - re-exports from services/api/supabase
 */

import { supabase as _supabase, isSupabaseConfigured } from '../services/api/supabase';
export const supabase = _supabase;
export const isConfigured = isSupabaseConfigured;
export default _supabase;