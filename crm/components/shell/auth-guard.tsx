"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  useSessionStore,
  selectIsAuthed,
} from "@/store/session";
import { Loader } from "@/components/ui/loader";

/**
 * Client-side auth gate for the (app) group.
 *
 * Waits for Zustand persist hydration, then redirects to /login if no
 * operator session exists. Runs inside the (app) layout so all nested
 * routes are protected.
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const hydrated = useSessionStore((s) => s.hydrated);
  const isAuthed = useSessionStore(selectIsAuthed);

  useEffect(() => {
    if (hydrated && !isAuthed) {
      router.replace("/login");
    }
  }, [hydrated, isAuthed, router]);

  if (!hydrated || !isAuthed) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader label="Loading session…" />
      </div>
    );
  }

  return <>{children}</>;
}
