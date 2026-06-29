/**
 * Repository — the single swap point between mock data and Supabase.
 *
 * Today every function reads from ./mock-data (deterministic fixtures).
 * Phase 1 will replace this file's body with Supabase queries; the rest
 * of the app (queries.ts, components) stays unchanged because it imports
 * from here, not from mock-data directly.
 *
 * Convention: every function returns a Promise so the swap to async
 * network calls is a drop-in change.
 */

import type {
  Alert,
  KpiSnapshot,
  Operator,
  OwnerDetail,
  OwnerRow,
  PlanDistribution,
  SupportTicket,
  TimePoint,
} from "../types";
import * as mock from "./mock-data";

export const repo = {
  // ── Auth (mock) ────────────────────────────────────────────────────────
  async listOperators(): Promise<Operator[]> {
    return mock.operators;
  },
  async getOperator(id: string): Promise<Operator | null> {
    return mock.operators.find((o) => o.id === id) ?? null;
  },

  // ── Dashboard ──────────────────────────────────────────────────────────
  async getKpiSnapshot(): Promise<KpiSnapshot> {
    return mock.getKpiSnapshot();
  },
  async getMrrTrend(days = 30): Promise<TimePoint[]> {
    return mock.getMrrTrend(days);
  },
  async getActiveDogsTrend(days = 30): Promise<TimePoint[]> {
    return mock.getActiveDogsTrend(days);
  },
  async getPlanDistribution(): Promise<PlanDistribution[]> {
    return mock.getPlanDistribution();
  },
  async getRecentAlerts(limit = 8): Promise<Alert[]> {
    return mock.getRecentAlerts(limit);
  },
  async getOpenTickets(): Promise<SupportTicket[]> {
    return mock.tickets.filter((t) => t.status === "open" || t.status === "pending");
  },

  // ── Owners ─────────────────────────────────────────────────────────────
  async getOwnerRows(): Promise<OwnerRow[]> {
    return mock.getOwnerRows();
  },
  async getOwnerDetail(id: string): Promise<OwnerDetail | null> {
    return mock.getOwnerDetail(id);
  },
};

export type Repository = typeof repo;
