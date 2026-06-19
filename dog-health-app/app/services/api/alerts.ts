import { supabase, isSupabaseConfigured } from './supabase';
import type { HealthAlert } from '../../types';

export const alertsService = {
  async getAlerts(userId: string, limit = 100): Promise<HealthAlert[]> {
    if (!isSupabaseConfigured()) return [];

    const { data, error } = await supabase
      .from('alerts')
      .select('*')
      .eq('owner_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[alertsService.getAlerts]', error);
      return [];
    }

    return (data ?? []).map(mapAlertRow);
  },

  async getUnacknowledgedCount(userId: string): Promise<number> {
    if (!isSupabaseConfigured()) return 0;

    const { count, error } = await supabase
      .from('alerts')
      .select('*', { count: 'exact', head: true })
      .eq('owner_id', userId)
      .eq('is_acknowledged', false);

    if (error) {
      console.error('[alertsService.getUnacknowledgedCount]', error);
      return 0;
    }

    return count ?? 0;
  },

  async createAlert(
    alert: Omit<HealthAlert, 'id' | 'timestamp' | 'acknowledged' | 'resolvedAt'>
  ): Promise<HealthAlert | null> {
    if (!isSupabaseConfigured()) return null;

    const { data, error } = await supabase
      .from('alerts')
      .insert([
        {
          dog_id: alert.dogId,
          owner_id: alert.dogId,
          alert_type: alert.type,
          severity: alert.severity,
          message: alert.message,
          metric_value: alert.metricValue,
          metric_threshold: alert.threshold,
          is_acknowledged: false,
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('[alertsService.createAlert]', error);
      return null;
    }

    return mapAlertRow(data as Record<string, unknown>);
  },

  async acknowledgeAlert(alertId: string): Promise<boolean> {
    if (!isSupabaseConfigured()) return false;

    const { error } = await supabase
      .from('alerts')
      .update({
        is_acknowledged: true,
        acknowledged_at: new Date().toISOString(),
      })
      .eq('id', alertId);

    if (error) {
      console.error('[alertsService.acknowledgeAlert]', error);
      return false;
    }
    return true;
  },

  async deleteAlert(alertId: string): Promise<boolean> {
    if (!isSupabaseConfigured()) return false;

    const { error } = await supabase.from('alerts').delete().eq('id', alertId);

    if (error) {
      console.error('[alertsService.deleteAlert]', error);
      return false;
    }
    return true;
  },
};

function mapAlertRow(row: Record<string, unknown>): HealthAlert {
  return {
    id: row.id as string,
    dogId: row.dog_id as string,
    type: row.alert_type as HealthAlert['type'],
    severity: row.severity as HealthAlert['severity'],
    message: (row.message as string) || '',
    metricValue: row.metric_value as number | undefined,
    threshold: row.metric_threshold as number | undefined,
    timestamp: row.created_at as string,
    acknowledged: row.is_acknowledged as boolean,
    resolvedAt: row.acknowledged_at as string | undefined,
  };
}

export default alertsService;