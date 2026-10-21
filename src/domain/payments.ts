import type { Booking, Payment, Installment } from "./types";
import { quoteTotals } from "./quote";
import { format } from "date-fns";
export function bookingFinancials(
  b: Booking,
  payments: Payment[],
  installments: Installment[],
  today = new Date(),
) {
  const total = quoteTotals(b.quotationSnapshot).selling;
  const paid = payments
    .filter((p) => p.bookingId === b.id)
    .reduce((s, p) => s + p.amountCentavos, 0);
  const balance = total - paid;
  const plan = installments
    .filter((i) => i.bookingId === b.id)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  const due = plan
    .filter((i) => i.dueDate < format(today, "yyyy-MM-dd"))
    .reduce((s, i) => s + i.amountCentavos, 0);
  let cumulative = 0;
  const nextDue = plan.find((i) => {
    cumulative += i.amountCentavos;
    return cumulative > paid;
  });
  const status =
    balance <= 0
      ? "Fully Paid"
      : paid < due
        ? "Overdue"
        : paid > 0
          ? "Partially Paid"
          : "Unpaid";
  return { total, paid, balance, status, nextDue };
}
