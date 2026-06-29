"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

/**
 * UI-only Zustand store (sidebar, command palette, density).
 * Server data lives in TanStack Query, NOT here — same state-split rule
 * as the architecture doc.
 */

type Density = "comfortable" | "compact";

interface UiState {
  sidebarCollapsed: boolean;
  commandOpen: boolean;
  density: Density;
  toggleSidebar: () => void;
  setSidebarCollapsed: (v: boolean) => void;
  setCommandOpen: (v: boolean) => void;
  setDensity: (d: Density) => void;
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      commandOpen: false,
      density: "comfortable",
      toggleSidebar: () =>
        set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),
      setCommandOpen: (v) => set({ commandOpen: v }),
      setDensity: (d) => set({ density: d }),
    }),
    {
      name: "dogvita-crm-ui",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        sidebarCollapsed: s.sidebarCollapsed,
        density: s.density,
      }),
    },
  ),
);

// Pure selectors
export const selectSidebarCollapsed = (s: UiState) => s.sidebarCollapsed;
export const selectCommandOpen = (s: UiState) => s.commandOpen;
export const selectDensity = (s: UiState) => s.density;
