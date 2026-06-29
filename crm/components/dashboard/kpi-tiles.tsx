"use client";

import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import type { LucideIcon } from "lucide-react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

type Delta = { pct: number; direction: "up" | "down" | "flat"; goodWhen: "up" | "down" };

function DeltaPill({ delta }: { delta: Delta }) {
  const good =
    (delta.goodWhen === "up" && delta.direction === "up") ||
    (delta.goodWhen === "down" && delta.direction === "down");
  const Icon =
    delta.direction === "up" ? TrendingUp : delta.direction === "down" ? TrendingDown : Minus;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 rounded-pill px-1.5 py-0.5 text-[11px] font-semibold",
        delta.direction === "flat"
          ? "bg-cream-dark text-cocoa-tertiary"
          : good
            ? "bg-emerald-100 text-emerald-700"
            : "bg-rose-100 text-rose-700",
      )}
    >
      <Icon className="h-3 w-3" />
      {Math.abs(delta.pct).toFixed(1)}%
    </span>
  );
}

export function KpiTile({
  label,
  value,
  icon: Icon,
  delta,
  accent = "primary",
  footer,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  delta?: Delta;
  accent?: "primary" | "emerald" | "sky" | "rose" | "violet";
  footer?: string;
}) {
  const accentBg: Record<string, string> = {
    primary: "bg-primary-50 text-primary-dark",
    emerald: "bg-emerald-100 text-emerald-700",
    sky: "bg-sky-100 text-sky-700",
    rose: "bg-rose-100 text-rose-700",
    violet: "bg-violet-100 text-violet-700",
  };
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-cocoa-tertiary">
          {label}
        </p>
        <span className={cn("flex h-8 w-8 items-center justify-center rounded-lg", accentBg[accent])}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-2xl font-bold text-cocoa">{value}</span>
        {delta && <DeltaPill delta={delta} />}
      </div>
      {footer && <p className="mt-1 text-xs text-cocoa-tertiary">{footer}</p>}
    </Card>
  );
}
