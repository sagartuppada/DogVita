"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Operator } from "@/lib/types";

/**
 * Operator session — v1 mock auth.
 *
 * Phase 1 of the system plan replaces signIn() with Supabase Auth; the
 * rest of the store shape (operator + impersonation) stays identical so
 * the shell components don't change.
 *
 * CRITICAL: selectors consuming this store must stay pure (no method
 * calls, no new refs) — same rule as the mobile app's Zustand stores.
 */

const MOCK_OPERATOR: Operator = {
  id: "op_1",
  name: "Maya Chen",
  email: "maya@dogvita.com",
  role: "admin",
};

interface SessionState {
  operator: Operator | null;
  // When set, the operator is viewing the product as this owner.
  impersonatingOwnerId: string | null;
  hydrated: boolean;
  signIn: (operator?: Operator) => void;
  signOut: () => void;
  startImpersonation: (ownerId: string) => void;
  stopImpersonation: () => void;
  setHydrated: () => void;
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      operator: null,
      impersonatingOwnerId: null,
      hydrated: false,
      signIn: (operator) =>
        set({ operator: operator ?? MOCK_OPERATOR, impersonatingOwnerId: null }),
      signOut: () =>
        set({ operator: null, impersonatingOwnerId: null }),
      startImpersonation: (ownerId) => set({ impersonatingOwnerId: ownerId }),
      stopImpersonation: () => set({ impersonatingOwnerId: null }),
      setHydrated: () => set({ hydrated: true }),
    }),
    {
      name: "dogvita-crm-session",
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
      },
      partialize: (s) => ({
        operator: s.operator,
        impersonatingOwnerId: s.impersonatingOwnerId,
      }),
    },
  ),
);

// Pure selector helpers (return primitives — safe to use directly in components)
export const selectIsAuthed = (s: SessionState): boolean => s.operator !== null;
export const selectOperator = (s: SessionState): Operator | null => s.operator;
export const selectIsImpersonating = (s: SessionState): boolean =>
  s.impersonatingOwnerId !== null;
export const selectImpersonatingOwnerId = (s: SessionState): string | null =>
  s.impersonatingOwnerId;
