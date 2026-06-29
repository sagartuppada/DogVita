import { cn } from "@/lib/utils";

// Lightweight table primitives (no TanStack Table yet — added in Phase 2
// when Owners list needs column visibility / pagination). Tokens stay
// consistent with the rest of the UI.

export function Table({ className, ...p }: React.HTMLAttributes<HTMLTableElement>) {
  return (
    <div className="w-full overflow-x-auto">
      <table className={cn("w-full text-sm", className)} {...p} />
    </div>
  );
}
export function THead({ className, ...p }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <thead className={cn("text-xs uppercase tracking-wide text-cocoa-tertiary", className)} {...p} />;
}
export function TBody(p: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody {...p} />;
}
export function TR({ className, ...p }: React.HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      className={cn("border-b border-border last:border-0 transition-colors hover:bg-cream/60", className)}
      {...p}
    />
  );
}
export function TH({ className, ...p }: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return <th className={cn("px-4 py-3 text-left font-medium", className)} {...p} />;
}
export function TD({ className, ...p }: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={cn("px-4 py-3 align-middle text-cocoa", className)} {...p} />;
}
