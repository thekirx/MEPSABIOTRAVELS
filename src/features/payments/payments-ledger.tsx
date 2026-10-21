"use client";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useTravelStore } from "@/store";
import { destination } from "@/store/selectors";
import { paymentSummary } from "@/store/payment-selectors";
import { money } from "@/domain/money";
import { displayDate, dueLabel } from "@/domain/dates";
import { Block, BigNumber, Sheet, StatusChip } from "@/components/blocks";
import { EmptyState } from "@/components/shared";
import { PaymentDialog } from "./payment-dialog";
import { Statement } from "./statement";

export function PaymentsLedger() {
  const s = useTravelStore(),
    params = useSearchParams();
  const [status, setStatus] = useState(params.get("status") ?? "All"),
    [payment, setPayment] = useState("");
  const statement = s.bookings.find((b) => b.id === params.get("statement"));
  const summary = paymentSummary(s),
    rows = summary.rows.filter((r) => status === "All" || r.status === status);
  const payments = [...s.payments]
    .reverse()
    .sort((a, b) => b.receivedAt.localeCompare(a.receivedAt));
  if (statement) return <Statement booking={statement} />;
  const totals = rows.reduce(
    (sum, r) => ({
      total: sum.total + r.total,
      paid: sum.paid + r.paid,
      balance: sum.balance + r.balance,
    }),
    { total: 0, paid: 0, balance: 0 },
  );
  return (
    <>
      <section className="hello">
        <div>
          <h1>Payments</h1>
          <p>Who owes what, and every payment we&apos;ve recorded.</p>
        </div>
      </section>
      <section className="stats">
        <Block variant="red" tag="Late">
          <BigNumber value={summary.late} />
          <p>Outstanding on trips with overdue installments</p>
        </Block>
        <Block variant="lime" tag="Due in 7 days">
          <BigNumber value={summary.dueSoon} />
          <p>Unpaid installments due this week</p>
        </Block>
        <Block tag="Still to collect">
          <BigNumber
            value={summary.receivables}
            data-testid="kpi-receivables"
            data-centavos={summary.receivables}
          />
          <p>Across {summary.rows.length} active trips</p>
        </Block>
        <Block variant="char" tag="Received this month">
          <BigNumber value={summary.receivedMonth} />
          <p>Payments recorded by hand</p>
        </Block>
      </section>
      <div className="filters" aria-label="Payment filters">
        {["All", "Unpaid", "Partially Paid", "Fully Paid", "Overdue"].map(
          (value) => (
            <button
              key={value}
              className={status === value ? "on" : ""}
              aria-pressed={status === value}
              onClick={() => setStatus(value)}
            >
              {value}{" "}
              <b>
                {
                  summary.rows.filter(
                    (r) => value === "All" || r.status === value,
                  ).length
                }
              </b>
            </button>
          ),
        )}
      </div>
      <Sheet
        id="receivables"
        title="Who owes what"
        note="Sorted by what needs you first"
      >
        <div className="table-wrap">
          <table className="t" data-testid="receivables-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Trip</th>
                <th className="r">Total</th>
                <th className="r">Paid</th>
                <th className="r">Left</th>
                <th>Next due</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const b = r.booking;
                return (
                  <tr key={b.id}>
                    <td>
                      <Link href={`/bookings/view?id=${b.id}`}>
                        <b>
                          {s.customers.find((c) => c.id === b.customerId)?.name}
                        </b>
                        <small>{b.ref}</small>
                      </Link>
                    </td>
                    <td>{destination(s, b.quotationSnapshot)}</td>
                    <td className="r num">{money(r.total)}</td>
                    <td className="r num">{money(r.paid)}</td>
                    <td className="r num">
                      <b
                        className={r.status === "Overdue" ? "danger-text" : ""}
                      >
                        {money(r.balance)}
                      </b>
                    </td>
                    <td>
                      {r.next ? (
                        <>
                          <b>
                            {r.next.label} · {money(r.next.left)}
                          </b>
                          <small>{dueLabel(r.next.dueDate)}</small>
                        </>
                      ) : (
                        "Settled"
                      )}
                    </td>
                    <td>
                      <StatusChip
                        tone={
                          r.status === "Overdue"
                            ? "late"
                            : r.dueSoon
                              ? "next"
                              : r.balance <= 0
                                ? "ok"
                                : "wait"
                        }
                      >
                        {r.status}
                      </StatusChip>
                    </td>
                    <td>
                      <div className="row-actions">
                        <button
                          className="btn small"
                          aria-label={`Record payment for ${b.ref}`}
                          disabled={r.balance <= 0}
                          onClick={() => setPayment(b.id)}
                        >
                          Record
                        </button>
                        <Link
                          className="btn ghost small"
                          href={`/payments?statement=${b.id}`}
                          aria-label={`Statement for ${b.ref}`}
                        >
                          Statement
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={2}>{rows.length} trips shown</td>
                <td className="r num">{money(totals.total)}</td>
                <td className="r num">{money(totals.paid)}</td>
                <td className="r num">{money(totals.balance)}</td>
                <td colSpan={3} />
              </tr>
            </tfoot>
          </table>
        </div>
        {!rows.length && <EmptyState text="No trips at this payment status." />}
      </Sheet>
      <Sheet
        id="received"
        title="Payments received"
        note="Recorded by hand · no money moves in this demo"
      >
        <div className="table-wrap">
          <table className="t">
            <thead>
              <tr>
                <th>Date</th>
                <th>Customer</th>
                <th>Booking</th>
                <th>Method</th>
                <th>Receipt no.</th>
                <th className="r">Amount</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => {
                const b = s.bookings.find((b) => b.id === p.bookingId);
                return (
                  <tr key={p.id}>
                    <td>{displayDate(p.receivedAt, "EEE d MMM")}</td>
                    <td>
                      <b>
                        {s.customers.find((c) => c.id === b?.customerId)?.name}
                      </b>
                    </td>
                    <td>
                      <Link href={`/payments?statement=${p.bookingId}`}>
                        {b?.ref}
                      </Link>
                    </td>
                    <td>{p.method}</td>
                    <td>{p.receiptNo}</td>
                    <td className="r num">
                      <b>{money(p.amountCentavos)}</b>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={5}>{payments.length} payments recorded</td>
                <td className="r num">
                  {money(
                    payments.reduce((sum, p) => sum + p.amountCentavos, 0),
                  )}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Sheet>
      <p className="list-footnote">
        Statements are not official receipts or invoices. All entries are
        simulated.
      </p>
      {payment && (
        <PaymentDialog
          bookingId={payment}
          open
          onClose={() => setPayment("")}
        />
      )}
    </>
  );
}
