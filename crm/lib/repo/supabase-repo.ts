/**
 * Supabase-backed repository.
 *
 * Maps the real Supabase schema to CRM types. Fields that don't exist in
 * the schema (role, status, tags, lifetimeValue, etc.) get sensible defaults.
 * When Supabase is not configured, callers should fall back to mock-data.
 */

import { supabase } from "../supabase-client";
import type {
  Alert,
  Device,
  Dog,
  HealthMetric,
  KpiSnapshot,
  Operator,
  OwnerDetail,
  OwnerRow,
  PlanDistribution,
  Profile,
  Subscription,
  SupportTicket,
  TimePoint,
} from "../types";

// ── Helpers ──────────────────────────────────────────────────────────────

function toIso(val: string | null | undefined): string {
  return val ?? new Date().toISOString();
}

function mapProfile(row: any): Profile {
  return {
    id: row.id,
    email: row.email ?? null,
    phone: row.phone ?? null,
    displayName: row.display_name ?? null,
    avatarUrl: row.avatar_url ?? null,
    role: "owner",
    status: "active",
    tags: [],
    lifetimeValue: 0,
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
  };
}

function mapDog(row: any): Dog {
  return {
    id: row.id,
    ownerId: row.owner_id,
    name: row.name,
    breed: row.breed ?? "",
    birthDate: row.birth_date ?? undefined,
    weightKg: row.weight_kg ?? undefined,
    gender: row.gender ?? undefined,
    imageUrl: row.photo_url ?? undefined,
    isActive: row.is_active ?? true,
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
  };
}

function mapDevice(row: any, ownerId: string): Device {
  return {
    id: row.id,
    dogId: row.dog_id,
    ownerId,
    deviceName: row.device_name ?? null,
    bleMacAddress: row.ble_mac_address ?? null,
    firmwareVersion: row.firmware_version ?? null,
    isConnected: row.is_connected ?? false,
    lastSeenAt: row.last_seen_at ?? null,
    createdAt: toIso(row.created_at),
    inventoryStatus: "deployed",
  };
}

function mapAlert(row: any, dogName: string): Alert {
  return {
    id: row.id,
    dogId: row.dog_id,
    ownerId: row.owner_id,
    dogName,
    type: row.alert_type,
    severity: row.severity,
    title: row.title,
    message: row.message,
    metricValue: row.metric_value ?? undefined,
    threshold: row.metric_threshold ?? undefined,
    isAcknowledged: row.is_acknowledged ?? false,
    acknowledgedAt: row.acknowledged_at ?? undefined,
    createdAt: toIso(row.created_at),
  };
}

function mapHealthMetric(row: any): HealthMetric {
  return {
    id: row.id,
    dogId: row.dog_id,
    recordedAt: toIso(row.recorded_at),
    heartRateBpm: row.heart_rate_bpm ?? undefined,
    temperatureCelsius: row.temperature_celsius ?? undefined,
    batteryLevel: row.battery_level ?? undefined,
    activitySteps: row.activity_steps ?? undefined,
    activityActiveMinutes: row.activity_active_minutes ?? undefined,
    activityCalories: row.activity_calories ?? undefined,
  };
}

// ── Repository ───────────────────────────────────────────────────────────

export const supabaseRepo = {
  async listOperators(): Promise<Operator[]> {
    if (!supabase) return [];
    return [{ id: "op_1", name: "Admin", email: "admin@dogvita.com", role: "admin" }];
  },

  async getOperator(id: string): Promise<Operator | null> {
    return { id: "op_1", name: "Admin", email: "admin@dogvita.com", role: "admin" };
  },

  async getKpiSnapshot(): Promise<KpiSnapshot> {
    if (!supabase) return { mrr: 0, mrrDeltaPct: 0, activeSubscribers: 0, activeDogs: 0, fleetOnlinePct: 0, openTickets: 0, slaBreachPct: 0, criticalAlerts24h: 0 };

    const [profilesRes, dogsRes, devicesRes, alertsRes, metricsRes] = await Promise.all([
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase.from("dogs").select("id", { count: "exact", head: true }),
      supabase.from("devices").select("is_connected"),
      supabase.from("alerts").select("severity, created_at"),
      supabase.from("health_metrics").select("dog_id, recorded_at").gte("recorded_at", new Date(Date.now() - 86400000).toISOString()),
    ]);

    const totalDevices = devicesRes.data?.length ?? 0;
    const onlineDevices = devicesRes.data?.filter((d) => d.is_connected).length ?? 0;
    const dayAgo = new Date(Date.now() - 86400000).toISOString();
    const critical24h = alertsRes.data?.filter((a) => a.severity === "critical" && a.created_at >= dayAgo).length ?? 0;
    const activeDogs = new Set(metricsRes.data?.map((m) => m.dog_id) ?? []).size;

    return {
      mrr: 0,
      mrrDeltaPct: 0,
      activeSubscribers: profilesRes.count ?? 0,
      activeDogs,
      fleetOnlinePct: totalDevices > 0 ? (onlineDevices / totalDevices) * 100 : 0,
      openTickets: 0,
      slaBreachPct: 0,
      criticalAlerts24h: critical24h,
    };
  },

  async getMrrTrend(days = 30): Promise<TimePoint[]> {
    // No billing in Supabase schema yet — return empty
    return [];
  },

  async getActiveDogsTrend(days = 30): Promise<TimePoint[]> {
    if (!supabase) return [];
    const { data } = await supabase
      .from("health_metrics")
      .select("dog_id, recorded_at")
      .gte("recorded_at", new Date(Date.now() - days * 86400000).toISOString())
      .order("recorded_at");

    if (!data) return [];

    const byDay = new Map<string, Set<string>>();
    for (const row of data) {
      const day = row.recorded_at.slice(0, 10);
      if (!byDay.has(day)) byDay.set(day, new Set());
      byDay.get(day)!.add(row.dog_id);
    }

    return Array.from(byDay.entries()).map(([date, dogs]) => ({ date, value: dogs.size }));
  },

  async getPlanDistribution(): Promise<PlanDistribution[]> {
    if (!supabase) return [];
    const { count } = await supabase.from("profiles").select("id", { count: "exact", head: true });
    return [{ plan: "free", count: count ?? 0, mrr: 0 }];
  },

  async getRecentAlerts(limit = 8): Promise<Alert[]> {
    if (!supabase) return [];

    const { data: alerts } = await supabase
      .from("alerts")
      .select("*, dogs(name)")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (!alerts) return [];

    return alerts.map((a) => mapAlert(a, a.dogs?.name ?? "Unknown"));
  },

  async getOpenTickets(): Promise<SupportTicket[]> {
    // No support_tickets table in schema — return empty
    return [];
  },

  async getOwnerRows(): Promise<OwnerRow[]> {
    if (!supabase) return [];

    const { data: profiles } = await supabase.from("profiles").select("*");
    if (!profiles) return [];

    const rows: OwnerRow[] = await Promise.all(
      profiles.map(async (p) => {
        const { count: dogCount } = await supabase!
          .from("dogs")
          .select("id", { count: "exact", head: true })
          .eq("owner_id", p.id);

        return {
          profile: mapProfile(p),
          dogCount: dogCount ?? 0,
          plan: "free" as const,
          status: "active" as const,
          openTickets: 0,
          lifetimeValue: 0,
          lastActiveAt: null,
        };
      }),
    );

    return rows;
  },

  async getOwnerDetail(id: string): Promise<OwnerDetail | null> {
    if (!supabase) return null;

    const { data: profile } = await supabase.from("profiles").select("*").eq("id", id).single();
    if (!profile) return null;

    const { data: dogs } = await supabase.from("dogs").select("*").eq("owner_id", id);
    const dogIds = (dogs ?? []).map((d: any) => d.id);

    const [metricsRes, alertsRes] = await Promise.all([
      dogIds.length > 0
        ? supabase.from("health_metrics").select("*").in("dog_id", dogIds).order("recorded_at", { ascending: false }).limit(50)
        : Promise.resolve({ data: [] }),
      supabase.from("alerts").select("*, dogs(name)").eq("owner_id", id).order("created_at", { ascending: false }).limit(20),
    ]);

    return {
      profile: mapProfile(profile),
      dogs: (dogs ?? []).map(mapDog),
      devices: [],
      subscription: null,
      recentAlerts: (alertsRes.data ?? []).map((a: any) => mapAlert(a, a.dogs?.name ?? "Unknown")),
      openTickets: [],
      metricsSpark: (metricsRes.data ?? []).map(mapHealthMetric),
    };
  },
};
