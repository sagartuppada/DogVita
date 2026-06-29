import type { ReactNode } from "react";
import { AuthGuard } from "@/components/shell/auth-guard";
import { Sidebar } from "@/components/shell/sidebar";
import { Topbar } from "@/components/shell/topbar";
import { ImpersonationBanner } from "@/components/shell/impersonation-banner";
import { CommandPalette } from "@/components/shell/command-palette";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGuard>
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <ImpersonationBanner />
          <Topbar />
          <main className="flex-1 overflow-y-auto bg-cream">
            {children}
          </main>
        </div>
      </div>
      <CommandPalette />
    </AuthGuard>
  );
}
