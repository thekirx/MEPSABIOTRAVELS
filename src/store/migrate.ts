import type { DemoData } from "@/domain/types";
import { quoteTotals } from "@/domain/quote";
import { demoPayRules } from "@/seed";
export const schemaVersion = 3;
/**
 * Version 1 saved a percentage markup. Open quotes switch to a fixed peso
 * markup per traveler with the same price. Accepted quotes and booking
 * snapshots keep their percentage so locked prices never move.
 */
function fromV1(saved: Partial<DemoData>): Partial<DemoData> {
  return {
    ...saved,
    schemaVersion: 2,
    quotations: saved.quotations!.map((q) => {
      if (q.status === "Accepted" || q.markupPerPaxCentavos !== undefined)
        return q;
      const { markupPct: _old, ...rest } = q;
      void _old;
      return {
        ...rest,
        markupPerPaxCentavos: Math.round(quoteTotals(q).markup / q.paxCount),
      };
    }),
  };
}
/** Version 3 adds the staff switcher and demo payroll. Records are kept. */
function fromV2(saved: Partial<DemoData>): Partial<DemoData> {
  return {
    ...saved,
    schemaVersion: 3,
    currentAgentId:
      saved.agents?.find((a) => a.role === "Owner")?.id ??
      saved.agents?.[0]?.id ??
      "a1",
    agents: saved.agents?.map((a) => ({ ...demoPayRules[a.id], ...a })),
    cashAdvances: saved.cashAdvances ?? [],
    paydays: saved.paydays ?? [],
  };
}
export function migrateSaved(saved: Partial<DemoData> | undefined) {
  if (!saved) return undefined;
  if (saved.schemaVersion === schemaVersion) return saved;
  if (saved.schemaVersion === 1 && saved.quotations)
    return fromV2(fromV1(saved));
  if (saved.schemaVersion === 2 && saved.quotations) return fromV2(saved);
  return undefined;
}
