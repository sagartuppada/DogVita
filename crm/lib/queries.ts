"use client";

import { useQuery } from "@tanstack/react-query";
import { repo } from "@/lib/repo";

/**
 * TanStack Query hooks — server-state layer.
 * All data flows through `repo`, the single swap point to Supabase.
 *
 * Query keys are namespaced so cache invalidation is precise.
 */
export const qk = {
  kpi: ["kpi"] as const,
  mrrTrend: (days: number) => ["mrr-trend", days] as const,
  activeDogsTrend: (days: number) => ["active-dogs-trend", days] as const,
  planDistribution: ["plan-distribution"] as const,
  recentAlerts: (limit: number) => ["recent-alerts", limit] as const,
  ownerRows: ["owner-rows"] as const,
  ownerDetail: (id: string) => ["owner-detail", id] as const,
};

export function useKpi() {
  return useQuery({ queryKey: qk.kpi, queryFn: () => repo.getKpiSnapshot() });
}

export function useMrrTrend(days = 30) {
  return useQuery({
    queryKey: qk.mrrTrend(days),
    queryFn: () => repo.getMrrTrend(days),
  });
}

export function useActiveDogsTrend(days = 30) {
  return useQuery({
    queryKey: qk.activeDogsTrend(days),
    queryFn: () => repo.getActiveDogsTrend(days),
  });
}

export function usePlanDistribution() {
  return useQuery({
    queryKey: qk.planDistribution,
    queryFn: () => repo.getPlanDistribution(),
  });
}

export function useRecentAlerts(limit = 8) {
  return useQuery({
    queryKey: qk.recentAlerts(limit),
    queryFn: () => repo.getRecentAlerts(limit),
  });
}

export function useOwnerRows() {
  return useQuery({ queryKey: qk.ownerRows, queryFn: () => repo.getOwnerRows() });
}

export function useOwnerDetail(id: string) {
  return useQuery({
    queryKey: qk.ownerDetail(id),
    queryFn: () => repo.getOwnerDetail(id),
    enabled: Boolean(id),
  });
}
