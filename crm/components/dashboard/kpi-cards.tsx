"use client";

import { DollarSign, Users, PawPrint, Wifi, AlertTriangle, TicketCheck } from "lucide-react";
import { KpiTile } from "./kpi-tiles";
import type { KpiSnapshot } from "@/lib/types";

function fmt(n: number) {
  return n.toLocaleString("en-US");
}

export function KpiCards({ data, loading }: { data?: KpiSnapshot; loading: boolean }) {
  if (loading || !data) {
    return (
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="card h-[110px] animate-pulse bg-cream-dark" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
      <KpiTile
        label="MRR"
        value={`$${fmt(Math.round(data.mrr))}`}
        icon={DollarSign}
        accent="emerald"
        delta={{ pct: data.mrrDeltaPct, direction: data.mrrDeltaPct > 0 ? "up" : data.mrrDeltaPct < 0 ? "down" : "flat", goodWhen: "up" }}
      />
      <KpiTile label="Subscribers" value={fmt(data.activeSubscribers)} icon={Users} accent="sky" />
      <KpiTile label="Active Dogs" value={fmt(data.activeDogs)} icon={PawPrint} accent="primary" />
      <KpiTile label="Fleet Online" value={`${data.fleetOnlinePct.toFixed(0)}%`} icon={Wifi} accent="violet" />
      <KpiTile label="Open Tickets" value={fmt(data.openTickets)} icon={TicketCheck} accent="rose" />
      <KpiTile label="Critical Alerts" value={fmt(data.criticalAlerts24h)} icon={AlertTriangle} accent="rose" />
    </div>
  );
}
