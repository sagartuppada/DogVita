"use client";

import { useQuery } from "@tanstack/react-query";
import { KpiCards } from "@/components/dashboard/kpi-cards";
import { MrrChart } from "@/components/dashboard/mrr-chart";
import { PlanPie } from "@/components/dashboard/plan-pie";
import { AlertsFeed } from "@/components/dashboard/alerts-feed";
import { TicketTable } from "@/components/dashboard/ticket-table";
import { OwnerTable } from "@/components/dashboard/owner-table";
import { repo } from "@/lib/repo";

export default function DashboardPage() {
  const kpi = useQuery({ queryKey: ["kpi"], queryFn: () => repo.getKpiSnapshot() });
  const mrr = useQuery({ queryKey: ["mrr"], queryFn: () => repo.getMrrTrend(30) });
  const plans = useQuery({ queryKey: ["plans"], queryFn: () => repo.getPlanDistribution() });
  const alerts = useQuery({ queryKey: ["alerts"], queryFn: () => repo.getRecentAlerts(8) });
  const tickets = useQuery({ queryKey: ["tickets"], queryFn: () => repo.getOpenTickets() });
  const owners = useQuery({ queryKey: ["owners"], queryFn: () => repo.getOwnerRows() });

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold text-cocoa">Dashboard</h1>

      <KpiCards data={kpi.data} loading={kpi.isLoading} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <MrrChart data={mrr.data} loading={mrr.isLoading} />
        </div>
        <PlanPie data={plans.data} loading={plans.isLoading} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <AlertsFeed data={alerts.data} loading={alerts.isLoading} />
        <TicketTable data={tickets.data} loading={tickets.isLoading} />
      </div>

      <OwnerTable data={owners.data} loading={owners.isLoading} />
    </div>
  );
}
