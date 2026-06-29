/**
 * Mock dataset for the CRM dashboard.
 *
 * This module is the ONLY data source in v1. When the Phase-1 swap to
 * Supabase happens, lib/repo/supabase.ts will replace these functions
 * with real queries and this file is deleted. Keep the repository
 * interface in lib/repo/index.ts stable so the rest of the app doesn't
 * change.
 */

import type {
  Alert,
  AlertType,
  Device,
  Dog,
  HealthMetric,
  KpiSnapshot,
  Operator,
  OwnerDetail,
  OwnerRow,
  Plan,
  PlanDistribution,
  Profile,
  Subscription,
  SupportTicket,
  TicketPriority,
  TicketStatus,
  TimePoint,
} from "../types";

// Deterministic so the UI is stable between reloads (no SSR/CSR hydration mismatch).
const NOW = new Date("2026-06-27T09:00:00Z").getTime();
const DAY = 86_400_000;
const HOUR = 3_600_000;

function iso(offsetMs: number): string {
  return new Date(NOW - offsetMs).toISOString();
}
function dateOnly(offsetDays: number): string {
  return new Date(NOW - offsetDays * DAY).toISOString().slice(0, 10);
}

// ── Operators (mock auth) ─────────────────────────────────────────────────

export const operators: Operator[] = [
  {
    id: "op_1",
    name: "Maya Chen",
    email: "maya@dogvita.com",
    role: "admin",
  },
  {
    id: "op_2",
    name: "Ravi Patel",
    email: "ravi@dogvita.com",
    role: "support",
  },
];

// ── Owners / profiles ────────────────────────────────────────────────────

const FIRST = ["Liam", "Olivia", "Noah", "Emma", "Ava", "Sofia", "Lucas", "Mia", "Ethan", "Isla", "Kai", "Nora", "Leo", "Aria", "Eli", "Zoe"];
const LAST = ["Tan", "Garcia", "Müller", "Rossi", "Kim", "Costa", "Anders", "Haddad", "Olsen", "Reyes", "Patel", "Nguyen"];
const BREEDS = ["Golden Retriever", "Labrador", "French Bulldog", "Poodle", "Beagle", "Border Collie", "Shiba Inu", "Dachshund", "Corgi", "Husky"];
const TAGS = ["high-value", "breeder", "churn-risk", "vip", "new", "trial"];
const SOURCES = ["organic", "ads", "referral", "partner"];

// Seeded PRNG so the dataset is stable.
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(42);
const pick = <T,>(arr: T[]): T => arr[Math.floor(rand() * arr.length)] as T;
const between = (min: number, max: number) => min + rand() * (max - min);
const intBetween = (min: number, max: number) => Math.floor(between(min, max + 1));

export const profiles: Profile[] = Array.from({ length: 48 }).map((_, i) => {
  const first = pick(FIRST);
  const last = pick(LAST);
  const createdAtAgo = intBetween(3, 540);
  return {
    id: `own_${i + 1}`,
    email: `${first.toLowerCase()}.${last.toLowerCase()}@example.com`,
    phone: rand() > 0.3 ? `+1${intBetween(2000000000, 9899999999)}` : null,
    displayName: `${first} ${last}`,
    avatarUrl: null,
    role: "owner",
    status: rand() > 0.93 ? "suspended" : "active",
    firstName: first,
    lastName: last,
    countryCode: "US",
    timezone: "America/New_York",
    tags: Array.from(new Set([pick(TAGS), pick(TAGS)])).slice(0, intBetween(0, 3)),
    notes: null,
    lastLoginAt: rand() > 0.2 ? iso(intBetween(1, 30) * DAY) : null,
    lifetimeValue: Number(between(0, 480).toFixed(2)),
    acquiredSource: pick(SOURCES),
    createdAt: iso(createdAtAgo * DAY),
    updatedAt: iso(intBetween(0, createdAtAgo) * DAY),
  };
});

// ── Dogs ──────────────────────────────────────────────────────────────────

export const dogs: Dog[] = [];
profiles.forEach((owner) => {
  const n = rand() > 0.6 ? intBetween(2, 3) : 1;
  for (let i = 0; i < n; i++) {
    dogs.push({
      id: `dog_${dogs.length + 1}`,
      ownerId: owner.id,
      name: pick(["Buddy", "Bella", "Max", "Luna", "Charlie", "Coco", "Rocky", "Daisy", "Milo", "Ruby", "Bear", "Nala"]),
      breed: pick(BREEDS),
      birthDate: iso(intBetween(6, 144) * 30 * DAY).slice(0, 10),
      weightKg: Number(between(3, 42).toFixed(1)),
      gender: rand() > 0.5 ? "male" : "female",
      imageUrl: undefined,
      isActive: true,
      createdAt: owner.createdAt,
      updatedAt: owner.createdAt,
    });
  }
});

// ── Devices ───────────────────────────────────────────────────────────────

export const devices: Device[] = dogs
  .filter(() => rand() > 0.25)
  .map((dog, i) => ({
    id: `dev_${i + 1}`,
    dogId: dog.id,
    ownerId: dog.ownerId,
    deviceName: `DogVita Collar ${i + 1}`,
    bleMacAddress: `AA:BB:CC:${intBetween(0, 99).toString().padStart(2, "0")}:${intBetween(0, 99).toString().padStart(2, "0")}:${intBetween(0, 99).toString().padStart(2, "0")}`,
    firmwareVersion: pick(["1.0.3", "1.0.4", "1.1.0"]),
    isConnected: rand() > 0.18,
    lastSeenAt: iso(intBetween(0, 36) * HOUR),
    batteryLevel: intBetween(8, 100),
    sku: "DVC-ESP32S3-01",
    serialNumber: `SN${(10000 + i).toString()}`,
    hardwareRevision: "rev-b",
    inventoryStatus: "deployed" as const,
    createdAt: dog.createdAt,
  }));

// ── Subscriptions ─────────────────────────────────────────────────────────

const PLAN_PRICES: Record<Plan, number> = { free: 0, plus: 4.99, pro: 9.99, breeder: 29.99 };
function planFromOwner(i: number): Plan {
  const r = (i * 7) % 10;
  if (r < 4) return "free";
  if (r < 8) return "plus";
  if (r === 8) return "pro";
  return "breeder";
}

export const subscriptions: Subscription[] = profiles.map((p, i) => {
  const plan = planFromOwner(i);
  const status = p.status === "suspended" ? "canceled" : rand() > 0.88 ? "trialing" : rand() > 0.92 ? "past_due" : "active";
  const qty = plan === "breeder" ? intBetween(3, 8) : 1;
  return {
    id: `sub_${i + 1}`,
    ownerId: p.id,
    plan,
    status: status as Subscription["status"],
    quantity: qty,
    mrr: Number((PLAN_PRICES[plan] * qty).toFixed(2)),
    currentPeriodEnd: iso(intBetween(-20, 35) * DAY),
    cancelAtPeriodEnd: rand() > 0.9,
    createdAt: p.createdAt,
  };
});

// ── Alerts ────────────────────────────────────────────────────────────────

const ALERT_TYPES: { type: AlertType; title: string; severity: Alert["severity"]; metric: () => number; threshold: number }[] = [
  { type: "heart_rate_high", title: "Heart rate high", severity: "critical", metric: () => intBetween(185, 220), threshold: 180 },
  { type: "temperature_high", title: "Temperature elevated", severity: "critical", metric: () => Number(between(39.5, 41.2).toFixed(1)), threshold: 39.2 },
  { type: "battery_low", title: "Battery low", severity: "warning", metric: () => intBetween(5, 19), threshold: 20 },
  { type: "geofence_exit", title: "Left safe zone", severity: "warning", metric: () => intBetween(50, 800), threshold: 100 },
  { type: "activity_abnormal", title: "Abnormal activity", severity: "info", metric: () => intBetween(0, 100), threshold: 0 },
  { type: "device_disconnect", title: "Device disconnected", severity: "warning", metric: () => intBetween(1, 30), threshold: 0 },
];

const dogById = new Map(dogs.map((d) => [d.id, d]));
export const alerts: Alert[] = Array.from({ length: 120 }).map((_, i) => {
  const dog = dogs[i % dogs.length]!;
  const def = ALERT_TYPES[i % ALERT_TYPES.length]!;
  const value = def.metric();
  return {
    id: `alt_${i + 1}`,
    dogId: dog.id,
    ownerId: dog.ownerId,
    dogName: dog.name,
    type: def.type,
    severity: def.severity,
    title: def.title,
    message: `${dog.name} (${dog.breed}) — ${def.title.toLowerCase()}.`,
    metricValue: value,
    threshold: def.threshold,
    isAcknowledged: rand() > 0.45,
    acknowledgedAt: rand() > 0.6 ? iso(intBetween(0, 48) * HOUR) : null,
    createdAt: iso(intBetween(0, 14) * DAY + intBetween(0, 24) * HOUR),
  };
});

// ── Health metrics (sparkline sample per dog) ────────────────────────────

export const healthMetrics: HealthMetric[] = [];
dogs.slice(0, 20).forEach((dog) => {
  for (let h = 0; h < 24; h++) {
    healthMetrics.push({
      id: `hm_${dog.id}_${h}`,
      dogId: dog.id,
      recordedAt: iso(h * HOUR),
      heartRateBpm: intBetween(70, 140),
      temperatureCelsius: Number(between(38.0, 39.2).toFixed(1)),
      batteryLevel: intBetween(20, 100),
      activitySteps: intBetween(0, 4000),
      activityActiveMinutes: intBetween(0, 90),
      activityCalories: intBetween(20, 400),
    });
  }
});

// ── Support tickets ───────────────────────────────────────────────────────

const TICKET_SUBJECTS = [
  "Collar won't pair",
  "Heart rate readings look wrong",
  "Cancel my subscription",
  "Refund request — defective unit",
  "How do I add a second dog?",
  "GPS track is missing points",
  "Charging issue",
  "Vet report not generating",
];

export const tickets: SupportTicket[] = Array.from({ length: 34 }).map((_, i) => {
  const owner = profiles[i % profiles.length]!;
  const priority: TicketPriority = (["low", "normal", "high", "urgent"] as const)[i % 4]!;
  const status: TicketStatus = (["open", "pending", "resolved", "closed"] as const)[i % 4]!;
  const created = iso(intBetween(0, 20) * DAY + intBetween(0, 24) * HOUR);
  return {
    id: `tkt_${i + 1}`,
    ownerId: owner.id,
    dogId: rand() > 0.5 ? dogs.find((d) => d.ownerId === owner.id)?.id ?? null : null,
    subject: pick(TICKET_SUBJECTS),
    status,
    priority,
    category: pick(["billing", "device", "health", "account", "other"]),
    assignedTo: rand() > 0.5 ? "op_2" : null,
    createdAt: created,
    updatedAt: created,
    slaDueAt: iso(intBetween(-12, 36) * HOUR),
  };
});

// ── Dashboard rollups ────────────────────────────────────────────────────

export function getKpiSnapshot(): KpiSnapshot {
  const activeSubs = subscriptions.filter((s) => s.status === "active" || s.status === "trialing");
  const mrr = activeSubs.reduce((sum, s) => sum + s.mrr, 0);
  const deployed = devices;
  const online = deployed.filter((d) => d.isConnected).length;
  const openT = tickets.filter((t) => t.status === "open" || t.status === "pending");
  const slaBreached = openT.filter((t) => t.slaDueAt && new Date(t.slaDueAt).getTime() < NOW);
  const crit24 = alerts.filter((a) => a.severity === "critical" && new Date(a.createdAt).getTime() > NOW - DAY);
  const activeDogs = new Set(healthMetrics.map((m) => m.dogId)).size;

  return {
    mrr: Number(mrr.toFixed(2)),
    mrrDeltaPct: 4.2,
    activeSubscribers: activeSubs.length,
    activeDogs,
    fleetOnlinePct: deployed.length ? Math.round((online / deployed.length) * 100) : 0,
    openTickets: openT.length,
    slaBreachPct: openT.length ? Math.round((slaBreached.length / openT.length) * 100) : 0,
    criticalAlerts24h: crit24.length,
  };
}

export function getMrrTrend(days = 30): TimePoint[] {
  const base = getKpiSnapshot().mrr / 30;
  return Array.from({ length: days }).map((_, i) => ({
    date: dateOnly(days - 1 - i),
    value: Number((base * (0.82 + i * 0.006) + Math.sin(i / 3) * 18).toFixed(2)),
  }));
}

export function getActiveDogsTrend(days = 30): TimePoint[] {
  const base = getKpiSnapshot().activeDogs;
  return Array.from({ length: days }).map((_, i) => ({
    date: dateOnly(days - 1 - i),
    value: Math.max(1, Math.round(base * (0.7 + i * 0.01) + Math.sin(i / 2) * 4)),
  }));
}

export function getPlanDistribution(): PlanDistribution[] {
  const map = new Map<Plan, PlanDistribution>();
  (Object.keys(PLAN_PRICES) as Plan[]).forEach((plan) => map.set(plan, { plan, count: 0, mrr: 0 }));
  subscriptions.forEach((s) => {
    const row = map.get(s.plan)!;
    row.count += 1;
    row.mrr += s.mrr;
  });
  return Array.from(map.values());
}

export function getRecentAlerts(limit = 8): Alert[] {
  return [...alerts]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit);
}

// ── Owner list + detail (the "CRM" proper) ───────────────────────────────

export function getOwnerRows(): OwnerRow[] {
  return profiles
    .map((profile) => {
      const sub = subscriptions.find((s) => s.ownerId === profile.id);
      const openTickets = tickets.filter((t) => t.ownerId === profile.id && (t.status === "open" || t.status === "pending")).length;
      return {
        profile,
        dogCount: dogs.filter((d) => d.ownerId === profile.id).length,
        plan: sub?.plan ?? "free",
        status: profile.status,
        openTickets,
        lifetimeValue: profile.lifetimeValue,
        lastActiveAt: profile.lastLoginAt ?? null,
      };
    })
    .sort((a, b) => new Date(b.profile.createdAt).getTime() - new Date(a.profile.createdAt).getTime());
}

export function getOwnerDetail(id: string): OwnerDetail | null {
  const profile = profiles.find((p) => p.id === id);
  if (!profile) return null;
  const ownerDogs = dogs.filter((d) => d.ownerId === id);
  const ownerDevices = devices.filter((d) => d.ownerId === id);
  const subscription = subscriptions.find((s) => s.ownerId === id) ?? null;
  const recentAlerts = alerts
    .filter((a) => a.ownerId === id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 6);
  const openTickets = tickets.filter((t) => t.ownerId === id && (t.status === "open" || t.status === "pending"));

  const sparkDog = ownerDogs[0];
  const metricsSpark = sparkDog ? healthMetrics.filter((m) => m.dogId === sparkDog.id).slice(-24) : [];

  return {
    profile,
    dogs: ownerDogs,
    devices: ownerDevices,
    subscription,
    recentAlerts,
    openTickets,
    metricsSpark,
  };
}

// keep dogById referenced (used by future alert enrichment)
void dogById;
