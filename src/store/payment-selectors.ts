import { addDays, format } from "date-fns";
import type { DemoData } from "@/domain/types";
import { bookingFinancials } from "@/domain/payments";

export function allocatedInstallments(s: DemoData, bookingId: string) {
  let remainingPaid = s.payments
    .filter((p) => p.bookingId === bookingId)
    .reduce((sum, p) => sum + p.amountCentavos, 0);
  return s.installments
    .filter((i) => i.bookingId === bookingId)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .map((i) => {
      const paid = Math.min(i.amountCentavos, remainingPaid);
      remainingPaid -= paid;
      return { ...i, paid, left: i.amountCentavos - paid };
    });
}

export function paymentRows(s: DemoData, now = new Date()) {
  const today = format(now, "yyyy-MM-dd"),
    week = format(addDays(now, 7), "yyyy-MM-dd");
  return s.bookings
    .filter((b) => b.status !== "Cancelled")
    .map((booking) => {
      const f = bookingFinancials(booking, s.payments, s.installments, now);
      const plan = allocatedInstallments(s, booking.id);
      const dueSoon = plan
        .filter((i) => i.dueDate >= today && i.dueDate <= week)
        .reduce((sum, i) => sum + i.left, 0);
      const next = plan.find((i) => i.left > 0);
      return { booking, ...f, next, dueSoon };
    })
    .sort((a, b) => {
      const rank = (row: typeof a) =>
        row.status === "Overdue"
          ? 0
          : row.dueSoon > 0
            ? 1
            : row.balance > 0
              ? 2
              : 3;
      return (
        rank(a) - rank(b) ||
        (a.next?.dueDate ?? "9999").localeCompare(b.next?.dueDate ?? "9999")
      );
    });
}

export function paymentSummary(s: DemoData, now = new Date()) {
  const rows = paymentRows(s, now);
  return {
    rows,
    late: rows
      .filter((r) => r.status === "Overdue")
      .reduce((sum, r) => sum + r.balance, 0),
    dueSoon: rows.reduce((sum, r) => sum + r.dueSoon, 0),
    receivables: rows.reduce((sum, r) => sum + r.balance, 0),
    receivedMonth: s.payments
      .filter((p) => p.receivedAt.startsWith(format(now, "yyyy-MM")))
      .reduce((sum, p) => sum + p.amountCentavos, 0),
  };
}
