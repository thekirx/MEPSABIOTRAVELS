"use client";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { buildSeed } from "@/seed";
import { createActions, type TravelStore } from "./actions";
import { migrateSaved } from "./migrate";
import { gatedLocalStorage } from "./persist-gate";
export const useTravelStore = create<TravelStore>()(
  persist((...args) => ({ ...buildSeed(), ...createActions(...args) }), {
    name: "travelos-demo-v1",
    version: 1,
    storage: createJSONStorage(() => gatedLocalStorage),
    skipHydration: true,
    migrate: () => buildSeed(),
    merge: (persisted, current) => {
      const saved = migrateSaved(persisted as Partial<TravelStore> | undefined);
      return {
        ...current,
        ...(saved ?? buildSeed()),
        hydrated: false,
      };
    },
    partialize: (s) => {
      const {
        schemaVersion,
        settings,
        currentAgentId,
        agents,
        cashAdvances,
        paydays,
        customers,
        leads,
        packages,
        quotations,
        bookings,
        payments,
        installments,
        visas,
      } = s;
      return {
        schemaVersion,
        settings,
        currentAgentId,
        agents,
        cashAdvances,
        paydays,
        customers,
        leads,
        packages,
        quotations,
        bookings,
        payments,
        installments,
        visas,
      };
    },
    onRehydrateStorage: () => (state, error) => {
      if (error) useTravelStore.setState({ ...buildSeed(), hydrated: true });
      else state?.setHydrated();
    },
  }),
);
