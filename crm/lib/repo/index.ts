/**
 * Repository — the single swap point between mock data and Supabase.
 *
 * When NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set,
 * queries go to the real database. Otherwise falls back to deterministic
 * mock fixtures.
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
import { isSupabaseConfigured } from "../supabase-client";
import * as mock from "./mock-data";
import { supabaseRepo } from "./supabase-repo";

export const repo = {
  async listOperators(): Promise<Operator[]> {
    return isSupabaseConfigured ? supabaseRepo.listOperators() : mock.operators;
  },
  async getOperator(id: string): Promise<Operator | null> {
    return isSupabaseConfigured ? supabaseRepo.getOperator(id) : mock.operators.find((o) => o.id === id) ?? null;
  },

  async getKpiSnapshot(): Promise<KpiSnapshot> {
    return isSupabaseConfigured ? supabaseRepo.getKpiSnapshot() : mock.getKpiSnapshot();
  },
  async getMrrTrend(days = 30): Promise<TimePoint[]> {
    return isSupabaseConfigured ? supabaseRepo.getMrrTrend(days) : mock.getMrrTrend(days);
  },
  async getActiveDogsTrend(days = 30): Promise<TimePoint[]> {
    return isSupabaseConfigured ? supabaseRepo.getActiveDogsTrend(days) : mock.getActiveDogsTrend(days);
  },
  async getPlanDistribution(): Promise<PlanDistribution[]> {
    return isSupabaseConfigured ? supabaseRepo.getPlanDistribution() : mock.getPlanDistribution();
  },
  async getRecentAlerts(limit = 8): Promise<Alert[]> {
    return isSupabaseConfigured ? supabaseRepo.getRecentAlerts(limit) : mock.getRecentAlerts(limit);
  },
  async getOpenTickets(): Promise<SupportTicket[]> {
    return isSupabaseConfigured ? supabaseRepo.getOpenTickets() : mock.tickets.filter((t) => t.status === "open" || t.status === "pending");
  },

  async getOwnerRows(): Promise<OwnerRow[]> {
    return isSupabaseConfigured ? supabaseRepo.getOwnerRows() : mock.getOwnerRows();
  },
  async getOwnerDetail(id: string): Promise<OwnerDetail | null> {
    return isSupabaseConfigured ? supabaseRepo.getOwnerDetail(id) : mock.getOwnerDetail(id);
  },
};

export type Repository = typeof repo;
