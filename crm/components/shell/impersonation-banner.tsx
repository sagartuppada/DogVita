"use client";

import { ShieldAlert, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  useSessionStore,
  selectIsImpersonating,
} from "@/store/session";

/**
 * Red banner shown when an operator is impersonating an owner.
 * Phase 2 wires `startImpersonation` from the Owner 360° page.
 */
export function ImpersonationBanner() {
  const isImpersonating = useSessionStore(selectIsImpersonating);
  const ownerId = useSessionStore((s) => s.impersonatingOwnerId);
  const stop = useSessionStore((s) => s.stopImpersonation);

  if (!isImpersonating) return null;

  return (
    <div className="flex items-center gap-2 bg-rose-600 px-5 py-1.5 text-sm text-white">
      <ShieldAlert className="h-4 w-4 shrink-0" />
      <span>
        Impersonating owner <code className="font-mono">{ownerId}</code> —
        privileged actions are logged.
      </span>
      <Button
        variant="ghost"
        size="sm"
        className="ml-auto !text-white hover:!bg-rose-500"
        onClick={stop}
      >
        <X className="mr-1 h-3.5 w-3.5" />
        Stop
      </Button>
    </div>
  );
}
