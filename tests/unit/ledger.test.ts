import { expect, it } from "vitest";
import { buildSeed } from "@/seed";
import { paymentSummary } from "@/store/payment-selectors";
it("allocates partial payments to installments before computing due-soon amounts", () => {
  const now = new Date(2026, 9, 21, 10),
    s = buildSeed(now),
    b = s.bookings[0];
  s.bookings = [b];
  s.installments = [
    {
      id: "first",
      bookingId: b.id,
      label: "Deposit",
      amountCentavos: 10000,
      dueDate: "2026-10-22",
    },
    {
      id: "last",
      bookingId: b.id,
      label: "Balance",
      amountCentavos: 20000,
      dueDate: "2026-10-28",
    },
  ];
  s.payments = [
    {
      id: "p",
      bookingId: b.id,
      amountCentavos: 15000,
      method: "Cash",
      receivedAt: "2026-10-21",
      receiptNo: "SIM",
    },
  ];
  expect(paymentSummary(s, now).dueSoon).toBe(15000);
  expect(paymentSummary(s, now).receivedMonth).toBe(15000);
  b.status = "Cancelled";
  expect(paymentSummary(s, now).dueSoon).toBe(0);
  expect(paymentSummary(s, now).receivables).toBe(0);
});

import { tripSteps } from "@/store/selectors";
import { allocatedInstallments } from "@/store/payment-selectors";
it("uses one chronological allocation when final payment falls before the deposit", () => {
  const s = buildSeed(),
    b = s.bookings[0];
  s.installments = [
    {
      id: "dep",
      bookingId: b.id,
      label: "30% deposit",
      amountCentavos: 10000,
      dueDate: "2026-10-24",
    },
    {
      id: "final",
      bookingId: b.id,
      label: "Final balance",
      amountCentavos: 20000,
      dueDate: "2026-10-01",
    },
  ];
  s.payments = [
    {
      id: "p",
      bookingId: b.id,
      amountCentavos: 15000,
      method: "Cash",
      receivedAt: "2026-10-21",
      receiptNo: "SIM",
    },
  ];
  expect(
    allocatedInstallments(s, b.id).map((i) => [i.id, i.paid, i.left]),
  ).toEqual([
    ["final", 15000, 5000],
    ["dep", 0, 10000],
  ]);
  expect(
    paymentSummary(s, new Date(2026, 9, 21)).rows.find(
      (r) => r.booking.id === b.id,
    )?.dueSoon,
  ).toBe(10000);
  expect(
    tripSteps(s, b).find((step) => step.id === "deposit")?.remainingCentavos,
  ).toBe(10000);
});
