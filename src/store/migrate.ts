import type { DemoData } from "@/domain/types";
import { quoteTotals } from "@/domain/quote";
export const schemaVersion = 2;
/**
 * Version 1 saved a percentage markup. Open quotes switch to a fixed peso
 * markup per traveler with the same price. Accepted quotes and booking
 * snapshots keep their percentage so locked prices never move.
 */
export function migrateSaved(saved: Partial<DemoData> | undefined) {
  if (!saved) return undefined;
  if (saved.schemaVersion === schemaVersion) return saved;
  if (saved.schemaVersion !== 1 || !saved.quotations) return undefined;
  return {
    ...saved,
    schemaVersion,
    quotations: saved.quotations.map((q) => {
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
