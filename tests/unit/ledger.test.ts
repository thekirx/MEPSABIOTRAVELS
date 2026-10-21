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
