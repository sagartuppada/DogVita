"use client";

import { useRouter } from "next/navigation";
import { LogOut, Search } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useUiStore } from "@/store/ui";
import {
  useSessionStore,
  selectOperator,
} from "@/store/session";

export function Topbar() {
  const router = useRouter();
  const operator = useSessionStore(selectOperator);
  const setCommandOpen = useUiStore((s) => s.setCommandOpen);
  const signOut = useSessionStore((s) => s.signOut);

  return (
    <header className="flex h-16 shrink-0 items-center gap-3 border-b border-border bg-cream-card px-5">
      {/* Search trigger (opens command palette) */}
      <button
        onClick={() => setCommandOpen(true)}
        className="flex h-9 max-w-md flex-1 items-center gap-2 rounded-md border border-border bg-white px-3 text-sm text-cocoa-tertiary transition-colors hover:border-primary/40"
      >
        <Search className="h-4 w-4" />
        <span>Search owners, dogs, tickets…</span>
        <kbd className="ml-auto rounded border border-border bg-cream px-1.5 py-0.5 text-[10px] font-semibold">
          ⌘K
        </kbd>
      </button>

      <div className="ml-auto flex items-center gap-3">
        <div className="hidden text-right sm:block">
          <p className="text-sm font-semibold text-cocoa">{operator?.name}</p>
          <p className="text-xs capitalize text-cocoa-tertiary">
            {operator?.role}
          </p>
        </div>
        <Avatar name={operator?.name} />
        <Button
          variant="ghost"
          size="icon"
          title="Sign out"
          onClick={() => {
            signOut();
            router.replace("/login");
          }}
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
