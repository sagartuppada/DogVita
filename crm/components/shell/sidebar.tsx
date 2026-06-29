"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PawPrint, ChevronLeft } from "lucide-react";
import { NAV_ITEMS, NAV_GROUPS } from "@/lib/nav";
import { useUiStore, selectSidebarCollapsed } from "@/store/ui";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const pathname = usePathname();
  const collapsed = useUiStore(selectSidebarCollapsed);
  const toggle = useUiStore((s) => s.toggleSidebar);

  return (
    <aside
      className={cn(
        "flex flex-col border-r border-border bg-cream-card transition-[width] duration-200",
        collapsed ? "w-[68px]" : "w-60",
      )}
    >
      {/* Brand */}
      <div className="flex h-16 items-center gap-2.5 px-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-white shadow-sm">
          <PawPrint className="h-5 w-5" />
        </div>
        {!collapsed && (
          <span className="text-base font-bold text-cocoa">DogVita</span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 pb-4">
        {NAV_GROUPS.map((group) => {
          const items = NAV_ITEMS.filter((i) => i.group === group);
          if (items.length === 0) return null;
          return (
            <div key={group} className="mb-4">
              {!collapsed && (
                <p className="px-3 pb-1.5 pt-3 text-[10px] font-semibold uppercase tracking-wider text-cocoa-tertiary">
                  {group}
                </p>
              )}
              <ul className="space-y-0.5">
                {items.map((item) => {
                  const active =
                    item.href === "/dashboard"
                      ? pathname === "/dashboard"
                      : pathname.startsWith(item.href);
                  const Icon = item.icon;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        title={collapsed ? item.label : undefined}
                        className={cn(
                          "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                          collapsed && "justify-center",
                          active
                            ? "bg-primary-50 text-primary-dark"
                            : "text-cocoa-secondary hover:bg-cream-dark hover:text-cocoa",
                        )}
                      >
                        <Icon className="h-[18px] w-[18px] shrink-0" />
                        {!collapsed && <span className="truncate">{item.label}</span>}
                        {!collapsed && item.comingSoon && (
                          <span className="ml-auto rounded-pill bg-cream-dark px-1.5 py-0.5 text-[9px] font-semibold uppercase text-cocoa-tertiary">
                            soon
                          </span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <button
        onClick={toggle}
        className={cn(
          "flex h-10 items-center gap-2 border-t border-border px-4 text-xs font-medium text-cocoa-tertiary transition-colors hover:bg-cream-dark hover:text-cocoa",
          collapsed && "justify-center",
        )}
      >
        <ChevronLeft
          className={cn("h-4 w-4 transition-transform", collapsed && "rotate-180")}
        />
        {!collapsed && <span>Collapse</span>}
      </button>
    </aside>
  );
}
