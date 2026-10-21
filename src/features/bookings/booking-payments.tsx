"use client";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import { useTravelStore } from "@/store";
import { allocatedInstallments } from "@/store/payment-selectors";
import { financials } from "@/store/selectors";
import { displayDate } from "@/domain/dates";
import { money } from "@/domain/money";
import type { Booking } from "@/domain/types";
import { Sheet, KeyValues, StatusChip, Meter } from "@/components/blocks";
import { Button } from "@/components/ui/button";
export function BookingPayments({
  booking: b,
  onPayment,
}: {
  booking: Booking;
  onPayment: () => void;
}) {
  const s = useTravelStore(),
    f = financials(s, b),
    plan = allocatedInstallments(s, b.id);
  return (
    <Sheet
      id="payments"
      title="Payments"
      action={
        <>
          <Link
            className="btn ghost small"
            href={`/payments?statement=${b.id}`}
          >
            Print statement
          </Link>
          <Button
            disabled={f.balance <= 0 || b.status === "Cancelled"}
            onClick={() => onPayment()}
          >
            Record payment
          </Button>
        </>
      }
    >
      <KeyValues
        items={[
          { label: "Trip total", value: money(f.total) },
          { label: "Paid", value: money(f.paid) },
          { label: "Still to collect", value: money(f.balance) },
        ]}
      />
      <div className="new-section">
        <Meter paid={f.paid} total={f.total} />
      </div>
      <div className="table-wrap new-section">
        <table className="t">
          <thead>
            <tr>
              <th>Payment plan</th>
              <th>Due</th>
              <th>Amount</th>
              <th>Paid</th>
              <th>Left</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {plan.map((i) => {
              const { paid, left } = i;
              const late =
                left > 0 && i.dueDate < format(new Date(), "yyyy-MM-dd");
              return (
                <tr key={i.id} data-testid="installment-row">
                  <td>{i.label}</td>
                  <td>{format(parseISO(i.dueDate), "EEE d MMM")}</td>
                  <td>{money(i.amountCentavos)}</td>
                  <td>{money(paid)}</td>
                  <td>{money(left)}</td>
                  <td>
                    <StatusChip
                      tone={left <= 0 ? "ok" : late ? "late" : "wait"}
                    >
                      {left <= 0 ? "Paid" : late ? "Late" : "Not yet due"}
                    </StatusChip>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <h3 className="new-section">Received</h3>
      <div className="table-wrap">
        <table className="t">
          <thead>
            <tr>
              <th>Date</th>
              <th>Method</th>
              <th>Reference</th>
              <th>Note</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            {s.payments
              .filter((p) => p.bookingId === b.id)
              .map((p) => (
                <tr key={p.id}>
                  <td>{displayDate(p.receivedAt)}</td>
                  <td>{p.method}</td>
                  <td>{p.receiptNo}</td>
                  <td>{p.note}</td>
                  <td>{money(p.amountCentavos)}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </Sheet>
  );
}
