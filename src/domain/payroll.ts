import {
  addMonths,
  endOfMonth,
  format,
  parseISO,
  setDate,
  startOfMonth,
} from "date-fns";
import type { Agent, Booking, CashAdvance } from "./types";
import { quoteTotals } from "./quote";

/**
 * Demo payroll for Philippine semi-monthly paydays (15th and end of month).
 * Employee shares use the 2025 rates: SSS 5% of the monthly salary credit
 * (₱5,000–₱35,000), PhilHealth 2.5% (salary floor ₱10,000, ceiling ₱100,000),
 * Pag-IBIG 2% of up to ₱10,000. Withholding tax uses the BIR semi-monthly
 * table in force since 2023. An estimate for the demo, not payroll advice.
 */

export type PayPeriod = {
  key: string;
  start: string;
  end: string;
  label: string;
};

/** "2026-10-1" = 1–15 Oct, "2026-10-2" = 16–31 Oct. */
export function periodOf(day: Date): PayPeriod {
  const half = day.getDate() <= 15 ? 1 : 2;
  const start = half === 1 ? startOfMonth(day) : setDate(day, 16);
  const end = half === 1 ? setDate(day, 15) : endOfMonth(day);
  return {
    key: `${format(day, "yyyy-MM")}-${half}`,
    start: format(start, "yyyy-MM-dd"),
    end: format(end, "yyyy-MM-dd"),
    label: `${format(start, "MMM d")}–${format(end, "d")}`,
  };
}

/** The current period first, then earlier ones. */
export function recentPeriods(today: Date, count = 4): PayPeriod[] {
  const out: PayPeriod[] = [];
  let cursor = today;
  for (let i = 0; i < count; i++) {
    const p = periodOf(cursor);
    out.push(p);
    const start = parseISO(p.start);
    cursor =
      start.getDate() === 1
        ? setDate(addMonths(start, -1), 16)
        : setDate(start, 1);
  }
  return out;
}

const peso = (n: number) => n * 100;

/** Monthly employee contributions in centavos. */
export function monthlyContributions(monthlyBaseCentavos: number) {
  const base = monthlyBaseCentavos / 100;
  const msc = Math.min(35000, Math.max(5000, Math.round(base / 500) * 500));
  const sss = Math.round(peso(msc * 0.05));
  const philhealth = Math.round(
    peso(Math.min(100000, Math.max(10000, base)) * 0.025),
  );
  const pagibig = Math.round(peso(Math.min(base, 10000) * 0.02));
  return { sss, philhealth, pagibig };
}

/** BIR semi-monthly withholding tax (2023 onwards), centavos in and out. */
export function semiMonthlyTax(taxableCentavos: number) {
  const t = taxableCentavos / 100;
  const brackets: [number, number, number][] = [
    // over, base tax, rate on the excess
    [333333, 91770.7, 0.35],
    [83333, 16770.7, 0.3],
    [33333, 4270.7, 0.25],
    [16667, 937.5, 0.2],
    [10417, 0, 0.15],
  ];
  for (const [over, base, rate] of brackets)
    if (t > over) return Math.round(peso(base + (t - over) * rate));
  return 0;
}

export type Payslip = {
  agent: Agent;
  period: PayPeriod;
  base: number;
  commission: number;
  commissionBookings: { id: string; ref: string; profit: number }[];
  gross: number;
  sss: number;
  philhealth: number;
  pagibig: number;
  tax: number;
  advances: number;
  deductions: number;
  net: number;
};

export function payslip(
  agent: Agent,
  period: PayPeriod,
  bookings: Booking[],
  advances: CashAdvance[],
): Payslip {
  const monthly = agent.monthlyBaseCentavos ?? 0;
  const base = Math.round(monthly / 2);
  const closed = bookings.filter(
    (b) =>
      b.assignedAgentId === agent.id &&
      b.status !== "Cancelled" &&
      b.createdAt >= period.start &&
      b.createdAt <= period.end,
  );
  const commissionBookings = closed.map((b) => ({
    id: b.id,
    ref: b.ref,
    profit: quoteTotals(b.quotationSnapshot).grossProfit,
  }));
  const profit = commissionBookings.reduce((sum, b) => sum + b.profit, 0);
  const commission = Math.round((profit * (agent.commissionPct ?? 0)) / 100);
  const gross = base + commission;
  const c = monthlyContributions(monthly);
  const sss = Math.round(c.sss / 2),
    philhealth = Math.round(c.philhealth / 2),
    pagibig = Math.round(c.pagibig / 2);
  const tax = semiMonthlyTax(gross - sss - philhealth - pagibig);
  const adv = advances
    .filter(
      (a) =>
        a.agentId === agent.id &&
        a.date >= period.start &&
        a.date <= period.end,
    )
    .reduce((sum, a) => sum + a.amountCentavos, 0);
  const deductions = sss + philhealth + pagibig + tax + adv;
  return {
    agent,
    period,
    base,
    commission,
    commissionBookings,
    gross,
    sss,
    philhealth,
    pagibig,
    tax,
    advances: adv,
    deductions,
    net: gross - deductions,
  };
}

/** Everyone on payroll (staff with a base pay; the owner is not on payroll). */
export const onPayroll = (agents: Agent[]) =>
  agents.filter((a) => a.role !== "Owner" && (a.monthlyBaseCentavos ?? 0) > 0);
