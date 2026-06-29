/**
 * Shared domain types — CRM surface.
 *
 * Source of truth for dog/health types lives in
 * dog-health-app/app/types/{dog,health}.ts. These CRM types are the admin
 * view over those entities; when `shared/` is extracted (Phase 0 of the
 * system-architecture plan), these will import from @dogvita/types instead.
 */

// ── Roles & identity ──────────────────────────────────────────────────────

export type Role = "owner" | "admin" | "support" | "vet";
export type ProfileStatus = "active" | "suspended" | "invited" | "deleted";

export interface Profile {
  id: string;
  email: string | null;
  phone: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  role: Role;
  status: ProfileStatus;
  firstName?: string | null;
  lastName?: string | null;
  countryCode?: string | null;
  timezone?: string | null;
  tags: string[];
  notes?: string | null;
  lastLoginAt?: string | null;
  lifetimeValue: number;
  acquiredSource?: string | null;
  createdAt: string;
  updatedAt: string;
}

// ── Dogs (patients) ───────────────────────────────────────────────────────

export type Gender = "male" | "female";

export interface Dog {
  id: string;
  ownerId: string;
  name: string;
  breed: string;
  birthDate?: string;
  weightKg?: number;
  gender?: Gender;
  imageUrl?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ── Devices ───────────────────────────────────────────────────────────────

export type InventoryStatus =
  | "in_stock"
  | "reserved"
  | "shipped"
  | "deployed"
  | "returned"
  | "defective";

export interface Device {
  id: string;
  dogId: string | null;
  ownerId: string;
  deviceName: string | null;
  bleMacAddress: string | null;
  firmwareVersion: string | null;
  isConnected: boolean;
  lastSeenAt: string | null;
  batteryLevel?: number | null;
  sku?: string | null;
  serialNumber?: string | null;
  hardwareRevision?: string | null;
  inventoryStatus: InventoryStatus;
  createdAt: string;
}

// ── Health metrics (time-series) ─────────────────────────────────────────

export interface HealthMetric {
  id: string;
  dogId: string;
  recordedAt: string;
  heartRateBpm?: number | null;
  temperatureCelsius?: number | null;
  batteryLevel?: number | null;
  activitySteps?: number | null;
  activityActiveMinutes?: number | null;
  activityCalories?: number | null;
}

// ── Alerts ────────────────────────────────────────────────────────────────

export type AlertType =
  | "heart_rate_high"
  | "heart_rate_low"
  | "temperature_high"
  | "temperature_low"
  | "battery_low"
  | "geofence_enter"
  | "geofence_exit"
  | "activity_abnormal"
  | "sleep_disruption"
  | "device_disconnect";

export type AlertSeverity = "info" | "warning" | "critical";

export interface Alert {
  id: string;
  dogId: string;
  ownerId: string;
  dogName: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
  metricValue?: number | null;
  threshold?: number | null;
  isAcknowledged: boolean;
  acknowledgedAt?: string | null;
  createdAt: string;
}

// ── Subscriptions / billing ──────────────────────────────────────────────

export type Plan = "free" | "plus" | "pro" | "breeder";
export type SubscriptionStatus =
  | "trialing"
  | "active"
  | "past_due"
  | "canceled"
  | "paused";

export interface Subscription {
  id: string;
  ownerId: string;
  plan: Plan;
  status: SubscriptionStatus;
  quantity: number;
  mrr: number;
  currentPeriodEnd?: string | null;
  cancelAtPeriodEnd: boolean;
  createdAt: string;
}

// ── Support tickets ───────────────────────────────────────────────────────

export type TicketStatus = "open" | "pending" | "resolved" | "closed";
export type TicketPriority = "low" | "normal" | "high" | "urgent";

export interface SupportTicket {
  id: string;
  ownerId: string;
  dogId?: string | null;
  subject: string;
  status: TicketStatus;
  priority: TicketPriority;
  category?: string | null;
  assignedTo?: string | null;
  createdAt: string;
  updatedAt: string;
  slaDueAt?: string | null;
}

// ── Dashboard KPIs ────────────────────────────────────────────────────────

export interface KpiSnapshot {
  mrr: number;
  mrrDeltaPct: number; // WoW change
  activeSubscribers: number;
  activeDogs: number; // dogs with a metric in last 24h
  fleetOnlinePct: number; // deployed devices connected / total deployed
  openTickets: number;
  slaBreachPct: number;
  criticalAlerts24h: number;
}

export interface TimePoint {
  date: string; // ISO date
  value: number;
}

export interface PlanDistribution {
  plan: Plan;
  count: number;
  mrr: number;
}

export interface OwnerRow {
  profile: Profile;
  dogCount: number;
  plan: Plan;
  status: ProfileStatus;
  openTickets: number;
  lifetimeValue: number;
  lastActiveAt: string | null;
}

export interface OwnerDetail {
  profile: Profile;
  dogs: Dog[];
  devices: Device[];
  subscription: Subscription | null;
  recentAlerts: Alert[];
  openTickets: SupportTicket[];
  metricsSpark: HealthMetric[];
}

// ── Operator session (mock auth in v1) ───────────────────────────────────

export interface Operator {
  id: string;
  name: string;
  email: string;
  role: Exclude<Role, "owner">;
}
