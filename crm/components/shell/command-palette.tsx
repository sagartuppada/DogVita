"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, CornerDownLeft } from "lucide-react";
import { NAV_ITEMS } from "@/lib/nav";
import { useUiStore } from "@/store/ui";
import { cn } from "@/lib/utils";

/**
 * Minimal ⌘K command palette. Jumps to nav destinations + (Phase 2) owners.
 * No Radix/portal — a fixed overlay; sufficient and fast.
 */
export function CommandPalette() {
  const open = useUiStore((s) => s.commandOpen);
  const setOpen = useUiStore((s) => s.setCommandOpen);
  const router = useRouter();
  const [q, setQ] = useState("");

  // Global ⌘K / Ctrl+K handler. Registered once on mount.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(!open);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, setOpen]);

  // Reset query whenever we open
  useEffect(() => {
    if (open) setQ("");
  }, [open]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return NAV_ITEMS;
    return NAV_ITEMS.filter(
      (i) =>
        i.label.toLowerCase().includes(query) ||
        i.group.toLowerCase().includes(query),
    );
  }, [q]);

  if (!open) return null;

  const go = (href: string) => {
    router.push(href);
    setOpen(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-cocoa/40 pt-[12vh] backdrop-blur-sm"
      onClick={() => setOpen(false)}
    >
      <div
        className="w-full max-w-xl overflow-hidden rounded-xxl border border-border bg-white shadow-lg animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-border px-4">
          <Search className="h-4 w-4 text-cocoa-tertiary" />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Jump to…"
            className="h-12 flex-1 bg-transparent text-sm text-cocoa outline-none placeholder:text-cocoa-tertiary"
          />
          <kbd className="rounded border border-border bg-cream px-1.5 py-0.5 text-[10px] font-semibold text-cocoa-tertiary">
            ESC
          </kbd>
        </div>
        <ul className="max-h-[50vh] overflow-y-auto p-2">
          {filtered.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <button
                  onClick={() => go(item.href)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm text-cocoa transition-colors hover:bg-cream",
                  )}
                >
                  <Icon className="h-4 w-4 text-cocoa-tertiary" />
                  <span className="flex-1">{item.label}</span>
                  {item.comingSoon && (
                    <span className="rounded-pill bg-cream-dark px-1.5 py-0.5 text-[9px] font-semibold uppercase text-cocoa-tertiary">
                      soon
                    </span>
                  )}
                  <CornerDownLeft className="h-3.5 w-3.5 text-cocoa-tertiary" />
                </button>
              </li>
            );
          })}
          {filtered.length === 0 && (
            <li className="px-3 py-6 text-center text-sm text-cocoa-tertiary">
              No matches for “{q}”
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}
