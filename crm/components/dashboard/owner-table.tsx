"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Loader } from "@/components/ui/loader";
import type { OwnerRow } from "@/lib/types";

export function OwnerTable({ data, loading }: { data?: OwnerRow[]; loading: boolean }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Owners</CardTitle>
      </CardHeader>
      <CardContent>
        {loading || !data ? (
          <Loader className="h-[200px]" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs font-medium uppercase tracking-wide text-cocoa-tertiary">
                  <th className="pb-2 pr-4">Owner</th>
                  <th className="pb-2 pr-4">Plan</th>
                  <th className="pb-2 pr-4">Dogs</th>
                  <th className="pb-2 pr-4">Tickets</th>
                  <th className="pb-2 pr-4">LTV</th>
                  <th className="pb-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {data.map((r) => (
                  <tr key={r.profile.id} className="border-b border-border/50 last:border-0">
                    <td className="py-2.5 pr-4">
                      <div className="flex items-center gap-2">
                        <Avatar name={r.profile.displayName} size="xs" />
                        <div>
                          <p className="font-medium text-cocoa">{r.profile.displayName || r.profile.email}</p>
                          <p className="text-xs text-cocoa-tertiary">{r.profile.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-2.5 pr-4">
                      <Badge tone={r.plan === "pro" ? "purple" : r.plan === "breeder" ? "warning" : r.plan === "plus" ? "info" : "neutral"}>{r.plan}</Badge>
                    </td>
                    <td className="py-2.5 pr-4 text-cocoa">{r.dogCount}</td>
                    <td className="py-2.5 pr-4 text-cocoa">{r.openTickets}</td>
                    <td className="py-2.5 pr-4 text-cocoa">${r.lifetimeValue.toFixed(2)}</td>
                    <td className="py-2.5">
                      <Badge tone={r.status === "active" ? "success" : r.status === "suspended" ? "danger" : "neutral"}>{r.status}</Badge>
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
