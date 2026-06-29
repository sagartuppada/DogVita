"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader } from "@/components/ui/loader";
import type { SupportTicket } from "@/lib/types";

const statusColor: Record<string, string> = {
  open: "bg-sky-100 text-sky-700",
  pending: "bg-amber-100 text-amber-700",
  resolved: "bg-emerald-100 text-emerald-700",
  closed: "bg-gray-100 text-gray-600",
};

const priorityColor: Record<string, string> = {
  urgent: "bg-rose-100 text-rose-700",
  high: "bg-orange-100 text-orange-700",
  normal: "bg-gray-100 text-gray-600",
  low: "bg-gray-50 text-gray-400",
};

export function TicketTable({ data, loading }: { data?: SupportTicket[]; loading: boolean }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Open Tickets</CardTitle>
      </CardHeader>
      <CardContent>
        {loading || !data ? (
          <Loader className="h-[260px]" />
        ) : data.length === 0 ? (
          <p className="py-8 text-center text-sm text-cocoa-tertiary">No open tickets</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs font-medium uppercase tracking-wide text-cocoa-tertiary">
                  <th className="pb-2 pr-4">Subject</th>
                  <th className="pb-2 pr-4">Status</th>
                  <th className="pb-2 pr-4">Priority</th>
                  <th className="pb-2">Created</th>
                </tr>
              </thead>
              <tbody>
                {data.map((t) => (
                  <tr key={t.id} className="border-b border-border/50 last:border-0">
                    <td className="py-2.5 pr-4 font-medium text-cocoa">{t.subject}</td>
                    <td className="py-2.5 pr-4">
                      <Badge className={statusColor[t.status]}>{t.status}</Badge>
                    </td>
                    <td className="py-2.5 pr-4">
                      <Badge className={priorityColor[t.priority]}>{t.priority}</Badge>
                    </td>
                    <td className="py-2.5 text-cocoa-tertiary">
                      {new Date(t.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
