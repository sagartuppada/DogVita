"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

// Minimal tooltip — CSS hover, no portal. Sufficient for table headers/labels.
const TooltipCtx = createContext(false);

export function TooltipProvider({ children }: { children: ReactNode }) {
  return (
    <TooltipCtx.Provider value={true}>{children}</TooltipCtx.Provider>
  );
}

export function Tooltip({
  label,
  children,
  side = "top",
}: {
  label: string;
  children: ReactNode;
  side?: "top" | "bottom";
}) {
  const [show, setShow] = useState(false);
  return (
    <span
      className="relative inline-flex"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
      onFocus={() => setShow(true)}
      onBlur={() => setShow(false)}
    >
      {children}
      {show && (
        <span
          role="tooltip"
          className={cn(
            "pointer-events-none absolute left-1/2 z-50 -translate-x-1/2 whitespace-nowrap rounded-md bg-cocoa px-2 py-1 text-xs text-white shadow-md animate-fade-in",
            side === "top" ? "bottom-full mb-1.5" : "top-full mt-1.5",
          )}
        >
          {label}
        </span>
      )}
    </span>
  );
}
