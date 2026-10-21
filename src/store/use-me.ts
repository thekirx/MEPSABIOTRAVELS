"use client";
import { useTravelStore } from "@/store";
import { permissions } from "@/domain/roles";
/** The staff member using the portal (demo switcher) and what they may do. */
export function useMe() {
  const s = useTravelStore();
  const me = s.agents.find((a) => a.id === s.currentAgentId) ?? s.agents[0];
  return { me, ...permissions(me?.role) };
}
