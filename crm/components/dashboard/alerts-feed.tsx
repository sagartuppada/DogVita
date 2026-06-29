"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader } from "@/components/ui/loader";
import { AlertTriangle, AlertCircle, Info } from "lucide-react";
import type { Alert } from "@/lib/types";

const severityConfig = {
  critical: { icon: AlertTriangle, color: "bg-rose-100 text-rose-700" },
  warning: { icon: AlertCircle, color: "bg-amber-100 text-amber-700" },
  info: { icon: Info, color: "bg-sky-100 text-sky-700" },
};

export function AlertsFeed({ data, loading }: { data?: Alert[]; loading: boolean }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Alerts</CardTitle>
      </CardHeader>
      <CardContent>
        {loading || !data ? (
          <Loader className="h-[260px]" />
        ) : data.length === 0 ? (
          <p className="py-8 text-center text-sm text-cocoa-tertiary">No alerts</p>
        ) : (
          <ul className="space-y-3">
            {data.map((a) => {
              const cfg = severityConfig[a.severity];
              const Icon = cfg.icon;
              return (
                <li key={a.id} className="flex items-start gap-3">
                  <span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${cfg.color}`}>
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-cocoa">{a.title}</p>
                    <p className="text-xs text-cocoa-tertiary">{a.dogName} &middot; {new Date(a.createdAt).toLocaleDateString()}</p>
                  </div>
                  <Badge tone={a.isAcknowledged ? "neutral" : "info"} className="shrink-0">
                    {a.isAcknowledged ? "Acked" : "New"}
                  </Badge>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
