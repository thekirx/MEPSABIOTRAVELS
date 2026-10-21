import { describe, it, expect, beforeEach } from "vitest";
import { buildSeed } from "@/seed";
import { quoteTotals } from "@/domain/quote";
import { bookingFinancials } from "@/domain/payments";
import { useTravelStore } from "@/store";
import { attention } from "@/store/selectors";
const today = new Date("2026-10-21T12:00:00");
describe("deterministic seed and quotation math", () => {
  it("has exact required sizes, relative dates and Andrea price", () => {
    const s = buildSeed(today);
    expect([
      s.agents.length,
      s.customers.length,
      s.leads.length,
      s.packages.length,
      s.quotations.length,
      s.bookings.length,
      s.visas.length,
    ]).toEqual([5, 24, 18, 6, 8, 7, 6]);
    expect(quoteTotals(s.quotations[0]).selling).toBe(22000000);
    expect(s.quotations[0].departDate).toBe("2026-12-05");
    expect(s).toEqual(buildSeed(today));
  });
  it("multiplies only per-pax lines and rounds at end", () => {
    const q = buildSeed(today).quotations[0];
    q.lines = [
      { ...q.lines[0], costCentavos: 12345, basis: "per_pax" },
      { ...q.lines[1], costCentavos: 10001, basis: "per_group" },
    ];
    // Quotes saved before peso markup still price with their old percentage.
    q.markupPerPaxCentavos = undefined;
    q.markupPct = 12.5;
    q.discountCentavos = 100;
    expect(quoteTotals(q)).toEqual({
      netCost: 59381,
      markup: 7423,
      selling: 66704,
      grossProfit: 7323,
      perPax: 16676,
    });
  });
  it("resolves every foreign key and uses integer centavos", () => {
    const s = buildSeed(today);
    for (const l of s.leads) {
      expect(s.customers.some((c) => c.id === l.customerId)).toBe(true);
      expect(s.agents.some((a) => a.id === l.assignedAgentId)).toBe(true);
    }
    for (const q of s.quotations) {
      expect(s.leads.some((l) => l.id === q.leadId)).toBe(true);
    }
    for (const b of s.bookings) {
      expect(s.quotations.some((q) => q.id === b.quotationId)).toBe(true);
      expect(s.customers.some((c) => c.id === b.customerId)).toBe(true);
    }
    for (const p of [...s.payments, ...s.installments])
      expect(s.bookings.some((b) => b.id === p.bookingId)).toBe(true);
    for (const v of s.visas)
      expect(
        s.bookings.some(
          (b) =>
            b.id === v.bookingId &&
            b.travelers.some((t) => t.id === v.travelerId),
        ),
      ).toBe(true);
    const walk = (v: unknown) => {
      if (v && typeof v === "object")
        for (const [k, x] of Object.entries(v)) {
          if (k.endsWith("Centavos"))
            expect(Number.isSafeInteger(x)).toBe(true);
          walk(x);
        }
    };
    walk(s);
  });
  it("derives overdue cumulatively and transitions through all statuses", () => {
    const s = buildSeed(today),
      b = s.bookings[0];
    const total = quoteTotals(b.quotationSnapshot).selling;
    const inst = [
      {
        id: "i",
        bookingId: b.id,
        label: "Deposit",
        dueDate: "2026-10-20",
        amountCentavos: 10000,
      },
    ];
    expect(bookingFinancials(b, [], [], today).status).toBe("Unpaid");
    expect(bookingFinancials(b, [], inst, today).status).toBe("Overdue");
    const pay = {
      id: "p",
      bookingId: b.id,
      amountCentavos: 10000,
      method: "Cash" as const,
      receivedAt: "2026-10-21",
      receiptNo: "DEMO-1",
    };
    expect(bookingFinancials(b, [pay], inst, today).status).toBe(
      "Partially Paid",
    );
    expect(
      bookingFinancials(b, [{ ...pay, amountCentavos: total }], inst, today)
        .status,
    ).toBe("Fully Paid");
  });
});
describe("store hero workflow", () => {
  beforeEach(() => useTravelStore.getState().resetDemo());
  it("accepts once, freezes snapshot, wins lead and records exact deposit", () => {
    const s = useTravelStore.getState();
    const id = s.acceptQuotation("q1");
    expect(useTravelStore.getState().acceptQuotation("q1")).toBe(id);
    let state = useTravelStore.getState();
    const b = state.bookings.find((b) => b.id === id)!;
    expect(b.travelers).toHaveLength(4);
    expect(b.services).toHaveLength(b.quotationSnapshot.lines.length);
    expect(state.installments.filter((i) => i.bookingId === id)).toHaveLength(
      2,
    );
    expect(state.leads[0].stage).toBe("Won");
    expect(() =>
      state.updateQuotation("q1", { markupPerPaxCentavos: 50000 }),
    ).toThrow();
    state.recordPayment(id, 6000000, "Bank Transfer", "Deposit");
    state = useTravelStore.getState();
    expect(
      bookingFinancials(b, state.payments, state.installments).balance,
    ).toBe(16000000);
    expect(() => state.recordPayment(id, 16000001, "Cash", "")).toThrow();
    expect(() => state.recordPayment(id, 1.5, "Cash", "")).toThrow();
  });
  it("requires a reference before manual issuance and avoids duplicate visas", () => {
    const state = useTravelStore.getState(),
      b = state.bookings[0],
      service = b.services[0];
    expect(() =>
      state.updateServiceStatus(b.id, service.id, "Issued", ""),
    ).toThrow();
    state.updateServiceStatus(b.id, service.id, "Issued", "SIM-123");
    const id = state.createVisaCase(b.id, b.travelers[0].id);
    expect(
      useTravelStore.getState().createVisaCase(b.id, b.travelers[0].id),
    ).toBe(id);
  });
});

describe("quotation input integrity", () => {
  beforeEach(() => useTravelStore.getState().resetDemo());
  it("rejects blank or invalid dates before they reach derived dashboard selectors", () => {
    const s = useTravelStore.getState();
    for (const patch of [
      { validUntil: "" },
      { validUntil: "2026-02-30" },
      { departDate: "" },
      { returnDate: "" },
    ])
      expect(() => s.updateQuotation("q1", patch)).toThrow();
  });
});

it("legacy empty validity cannot crash dashboard attention", () => {
  const s = buildSeed(today);
  s.quotations[0].validUntil = "";
  expect(() => attention(s)).not.toThrow();
});
