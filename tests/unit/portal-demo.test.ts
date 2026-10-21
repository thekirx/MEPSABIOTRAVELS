import { beforeEach, describe, expect, it } from "vitest";
import { buildSeed } from "@/seed";
import { useTravelStore } from "@/store";
import { migrateSaved } from "@/store/migrate";
import { permissions, jobTypesFor } from "@/domain/roles";
import {
  monthlyContributions,
  onPayroll,
  payslip,
  periodOf,
  recentPeriods,
  semiMonthlyTax,
} from "@/domain/payroll";
import { quoteTotals } from "@/domain/quote";
import { bookingFinancials } from "@/domain/payments";

describe("roles", () => {
  it("lets Sales and the owner price; only the owner sees salaries", () => {
    expect(permissions("Owner")).toEqual({
      canPrice: true,
      canSeeMargins: true,
      canSeeSalary: true,
    });
    expect(permissions("Sales").canSeeSalary).toBe(false);
    expect(permissions("Ticketing").canSeeMargins).toBe(false);
    expect(permissions("Visa").canPrice).toBe(false);
    expect(jobTypesFor.Ticketing).toEqual(["service"]);
  });
});

describe("payroll math", () => {
  it("uses 2025 employee contribution rates", () => {
    expect(monthlyContributions(2200000)).toEqual({
      sss: 110000,
      philhealth: 55000,
      pagibig: 20000,
    });
    // SSS salary credit caps at ₱35,000; PhilHealth floor ₱10,000.
    expect(monthlyContributions(8000000).sss).toBe(175000);
    expect(monthlyContributions(800000).philhealth).toBe(25000);
  });
  it("applies the BIR semi-monthly tax table", () => {
    expect(semiMonthlyTax(1041700)).toBe(0);
    expect(semiMonthlyTax(2000000)).toBe(160410);
    expect(semiMonthlyTax(4000000)).toBe(593745);
  });
  it("splits months into 1–15 and 16–end paydays", () => {
    expect(periodOf(new Date(2026, 9, 21))).toMatchObject({
      key: "2026-10-2",
      start: "2026-10-16",
      end: "2026-10-31",
    });
    expect(recentPeriods(new Date(2026, 9, 3), 3).map((p) => p.key)).toEqual([
      "2026-10-1",
      "2026-09-2",
      "2026-09-1",
    ]);
  });
  it("pays commission on bookings closed in the period and deducts advances", () => {
    const s = buildSeed(new Date(2026, 9, 21));
    const kat = s.agents.find((a) => a.id === "a2")!;
    const period = periodOf(new Date(2026, 9, 21));
    const slip = payslip(kat, period, s.bookings, s.cashAdvances);
    const closed = s.bookings.filter(
      (b) =>
        b.assignedAgentId === "a2" &&
        b.createdAt >= period.start &&
        b.createdAt <= period.end,
    );
    const profit = closed.reduce(
      (n, b) => n + quoteTotals(b.quotationSnapshot).grossProfit,
      0,
    );
    expect(slip.base).toBe(1100000);
    expect(slip.commission).toBe(Math.round(profit * 0.05));
    expect(slip.advances).toBe(100000);
    expect(slip.net).toBe(slip.gross - slip.deductions);
    expect(onPayroll(s.agents).map((a) => a.id)).toEqual([
      "a2",
      "a3",
      "a4",
      "a5",
    ]);
  });
});

describe("client approval and staff switching", () => {
  beforeEach(() => useTravelStore.getState().resetDemo());
  it("books the trip and records the full deposit once", () => {
    const { bookingId, receiptNo } = useTravelStore
      .getState()
      .approveOnline("q1", "GCash");
    const s = useTravelStore.getState();
    const b = s.bookings.find((x) => x.id === bookingId)!;
    const f = bookingFinancials(b, s.payments, s.installments);
    expect(f.paid).toBe(6600000);
    expect(f.balance).toBe(15400000);
    expect(s.payments.at(-1)).toMatchObject({ method: "GCash", receiptNo });
    expect(
      s.quotations.find((q) => q.id === "q1")!.clientApprovedAt,
    ).toBeTruthy();
    expect(s.leads[0].stage).toBe("Won");
    expect(b.services.find((x) => x.category === "Airfare")).toMatchObject({
      status: "On Hold",
    });
    expect(() => s.approveOnline("q1", "Maya")).toThrow();
  });
  it("refuses expired quotes", () => {
    const s = useTravelStore.getState();
    useTravelStore.setState({
      quotations: s.quotations.map((q) =>
        q.id === "q1" ? { ...q, validUntil: "2000-01-01" } : q,
      ),
    });
    expect(() =>
      useTravelStore.getState().approveOnline("q1", "GCash"),
    ).toThrow(/expired/);
  });
  it("only lets the owner approve payday, and freezes the payslips", () => {
    const s = useTravelStore.getState();
    s.setCurrentAgent("a2");
    expect(() => useTravelStore.getState().approvePayday("x", [])).toThrow();
    useTravelStore.getState().setCurrentAgent("a1");
    useTravelStore.getState().approvePayday("2026-10-2", [
      {
        agentId: "a2",
        base: 1,
        commission: 0,
        commissionBookings: [],
        gross: 1,
        sss: 0,
        philhealth: 0,
        pagibig: 0,
        tax: 0,
        advances: 0,
        deductions: 0,
        net: 1,
      },
    ]);
    useTravelStore.getState().updatePay("a2", 9900000, 10);
    expect(useTravelStore.getState().paydays[0].slips[0].net).toBe(1);
    expect(() => s.setCurrentAgent("nobody")).toThrow();
  });
});

describe("saved data from version 2", () => {
  it("keeps records and adds the staff switcher and pay rules", () => {
    const v2 = structuredClone(buildSeed(new Date(2026, 9, 21))) as Partial<
      ReturnType<typeof buildSeed>
    >;
    v2.schemaVersion = 2;
    delete v2.currentAgentId;
    delete v2.cashAdvances;
    delete v2.paydays;
    v2.agents = v2.agents!.map(
      ({ monthlyBaseCentavos: _m, commissionPct: _c, ...a }) => (
        void _m,
        void _c,
        a
      ),
    );
    v2.quotations![0].discountCentavos = 12345;
    const next = migrateSaved(v2)!;
    expect(next.schemaVersion).toBe(3);
    expect(next.currentAgentId).toBe("a1");
    expect(next.quotations![0].discountCentavos).toBe(12345);
    expect(next.agents!.find((a) => a.id === "a2")!.commissionPct).toBe(5);
    expect(next.cashAdvances).toEqual([]);
  });
});
