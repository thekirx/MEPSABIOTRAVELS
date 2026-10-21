import { beforeEach, describe, expect, it } from "vitest";
import { buildSeed } from "@/seed";
import { useTravelStore } from "@/store";
import { migrateSaved } from "@/store/migrate";
import { hasInsurance, markupPerPax, quoteTotals } from "@/domain/quote";

const today = new Date(2026, 9, 21);

describe("peso markup and insurance", () => {
  beforeEach(() => useTravelStore.getState().resetDemo());
  it("adds a fixed peso amount per traveler", () => {
    const q = structuredClone(buildSeed(today).quotations[0]);
    const base = quoteTotals(q);
    q.markupPerPaxCentavos = 200000;
    const t = quoteTotals(q);
    expect(t.markup).toBe(200000 * q.paxCount);
    expect(t.selling).toBe(base.netCost + 200000 * q.paxCount);
    expect(t.grossProfit).toBe(t.markup);
  });
  it("keeps Andrea's seeded quote at ₱220,000 with insurance included", () => {
    const q = buildSeed(today).quotations[0];
    expect(hasInsurance(q)).toBe(true);
    expect(quoteTotals(q).selling).toBe(22000000);
    expect(markupPerPax(q)).toBe(350000);
    expect(q.flightDetails).toContain("SW 412");
  });
  it("includes insurance on every seeded quote and new quote", () => {
    expect(buildSeed(today).quotations.every(hasInsurance)).toBe(true);
    const s = useTravelStore.getState();
    const id = s.createQuotation("l2");
    const q = useTravelStore.getState().quotations.find((x) => x.id === id)!;
    expect(hasInsurance(q)).toBe(true);
    expect(q.markupPerPaxCentavos).toBe(100000);
    expect(q.markupPct).toBeUndefined();
  });
  it("rejects negative or fractional peso markup", () => {
    const s = useTravelStore.getState();
    expect(() =>
      s.updateQuotation("q1", { markupPerPaxCentavos: -1 }),
    ).toThrow();
    expect(() =>
      s.updateQuotation("q1", { markupPerPaxCentavos: 10.5 }),
    ).toThrow();
  });
});

describe("saved data from the percentage version", () => {
  it("moves open quotes to peso markup without changing the price", () => {
    const old = structuredClone(buildSeed(today));
    old.schemaVersion = 1;
    for (const q of old.quotations) {
      delete q.markupPerPaxCentavos;
      q.markupPct = 10;
    }
    const before = old.quotations.map((q) => quoteTotals(q).selling);
    const next = migrateSaved(old)!;
    expect(next.schemaVersion).toBe(2);
    next.quotations!.forEach((q, i) => {
      if (q.status === "Accepted") {
        // Locked prices keep their original percentage exactly.
        expect(q.markupPct).toBe(10);
        expect(quoteTotals(q).selling).toBe(before[i]);
      } else {
        expect(q.markupPct).toBeUndefined();
        expect(Math.abs(quoteTotals(q).selling - before[i])).toBeLessThan(
          q.paxCount,
        );
      }
    });
  });
  it("drops data it does not understand", () => {
    expect(migrateSaved({ schemaVersion: 0 })).toBeUndefined();
  });
});
