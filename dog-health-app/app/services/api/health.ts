import { supabase, isSupabaseConfigured } from './supabase';
import type {
  HeartRateData,
  HeartRateZone,
  TemperatureData,
  ActivityData,
  HealthMetrics,
  BatteryData,
} from '../../types';
import type { ActivityType } from '../../types/health';

function getHeartRateZone(bpm: number): HeartRateZone {
  if (bpm < 60) return 'rest';
  if (bpm < 100) return 'light';
  if (bpm < 140) return 'moderate';
  if (bpm < 180) return 'active';
  return 'peak';
}

function celsiusToFahrenheit(c: number): number {
  return Number((c * 9 / 5 + 32).toFixed(1));
}

export const healthService = {
  async getHeartRateHistory(dogId: string, limit = 100): Promise<HeartRateData[]> {
    if (!isSupabaseConfigured()) return [];

    const { data, error } = await supabase
      .from('health_metrics')
      .select('*')
      .eq('dog_id', dogId)
      .not('heart_rate_bpm', 'is', null)
      .order('recorded_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[healthService.getHeartRateHistory]', error);
      return [];
    }

    return (data ?? []).map((row) => ({
      bpm: row.heart_rate_bpm as number,
      variability: undefined,
      zone: getHeartRateZone(row.heart_rate_bpm as number),
      timestamp: row.recorded_at as string,
    }));
  },

  async getTemperatureHistory(dogId: string, limit = 100): Promise<TemperatureData[]> {
    if (!isSupabaseConfigured()) return [];

    const { data, error } = await supabase
      .from('health_metrics')
      .select('*')
      .eq('dog_id', dogId)
      .not('temperature_celsius', 'is', null)
      .order('recorded_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[healthService.getTemperatureHistory]', error);
      return [];
    }

    return (data ?? []).map((row) => {
      const celsius = row.temperature_celsius as number;
      return {
        celsius,
        fahrenheit: celsiusToFahrenheit(celsius),
        isAbnormal: celsius < 37.5 || celsius > 39.5,
        timestamp: row.recorded_at as string,
      };
    });
  },

  async getActivityHistory(dogId: string, limit = 100): Promise<ActivityData[]> {
    if (!isSupabaseConfigured()) return [];

    const { data, error } = await supabase
      .from('health_metrics')
      .select('*')
      .eq('dog_id', dogId)
      .not('activity_steps', 'is', null)
      .order('recorded_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[healthService.getActivityHistory]', error);
      return [];
    }

    return (data ?? []).map((row) => {
      const steps = row.activity_steps as number;
      let type: ActivityType = 'resting';
      if (steps > 500) type = 'walking';
      if (steps > 2000) type = 'running';
      if (steps > 5000) type = 'playing';
      return {
        steps,
        distance: Number((steps * 0.7 / 1000).toFixed(2)),
        activeMinutes: (row.activity_active_minutes as number) ?? 0,
        calories: (row.activity_calories as number) ?? 0,
        type,
        timestamp: row.recorded_at as string,
      };
    });
  },

  async addMetrics(dogId: string, metrics: Partial<HealthMetrics>): Promise<boolean> {
    if (!isSupabaseConfigured()) return false;

    const { error } = await supabase.from('health_metrics').insert([
      {
        dog_id: dogId,
        recorded_at: metrics.timestamp ?? new Date().toISOString(),
        heart_rate_bpm: metrics.heartRate?.bpm,
        temperature_celsius: metrics.temperature?.celsius,
        battery_level: metrics.battery?.level,
        activity_steps: metrics.activity?.steps,
        activity_active_minutes: metrics.activity?.activeMinutes,
        activity_calories: metrics.activity?.calories,
      },
    ]);

    if (error) {
      console.error('[healthService.addMetrics]', error);
      return false;
    }
    return true;
  },

  async getLatestMetrics(
    dogId: string
  ): Promise<Partial<HealthMetrics> | null> {
    if (!isSupabaseConfigured()) return null;

    const { data, error } = await supabase
      .from('health_metrics')
      .select('*')
      .eq('dog_id', dogId)
      .order('recorded_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) return null;

    const row = data as Record<string, unknown>;

    const result: Partial<HealthMetrics> = {
      timestamp: row.recorded_at as string,
    };

    if (row.heart_rate_bpm != null) {
      const bpm = row.heart_rate_bpm as number;
      result.heartRate = {
        bpm,
        variability: undefined,
        zone: getHeartRateZone(bpm),
        timestamp: row.recorded_at as string,
      };
    }

    if (row.temperature_celsius != null) {
      const celsius = row.temperature_celsius as number;
      result.temperature = {
        celsius,
        fahrenheit: celsiusToFahrenheit(celsius),
        isAbnormal: celsius < 37.5 || celsius > 39.5,
        timestamp: row.recorded_at as string,
      };
    }

    if (row.battery_level != null) {
      result.battery = {
        level: row.battery_level as number,
        isCharging: false,
        estimatedHours: 0,
        timestamp: row.recorded_at as string,
      };
    }

    if (row.activity_steps != null) {
      const steps = row.activity_steps as number;
      let type: ActivityType = 'resting';
      if (steps > 500) type = 'walking';
      if (steps > 2000) type = 'running';
      if (steps > 5000) type = 'playing';
      result.activity = {
        steps,
        distance: Number((steps * 0.7 / 1000).toFixed(2)),
        activeMinutes: (row.activity_active_minutes as number) ?? 0,
        calories: (row.activity_calories as number) ?? 0,
        type,
        timestamp: row.recorded_at as string,
      };
    }

    return result;
  },
};

export default healthService;