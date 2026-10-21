"use client";
import Link from "next/link";
import { useTravelStore } from "@/store";
import { financials } from "@/store/selectors";
import { money } from "@/domain/money";
import { displayDate } from "@/domain/dates";
import type { Booking } from "@/domain/types";
import { AgencyLogo } from "@/components/agency-logo";

export function Statement({ booking: b }: { booking: Booking }) {
  const s = useTravelStore(),
    f = financials(s, b);
  const payments = s.payments
    .filter((p) => p.bookingId === b.id)
    .sort((a, b) => b.receivedAt.localeCompare(a.receivedAt));
  return (
    <>
      <Link className="back no-print" href="/payments">
        ← Payments
      </Link>
      <section className="hello no-print">
        <div>
          <h1>Statement of account</h1>
          <p>Review and print the recorded amounts.</p>
        </div>
        <button className="btn lime" onClick={() => window.print()}>
          Print statement
        </button>
      </section>
      <article className="statement print-document">
        <header className="doc-top">
          <AgencyLogo />
          <span>STATEMENT OF ACCOUNT</span>
        </header>
        <p>Statement — not an official receipt/invoice.</p>
        <div className="statement-meta">
          <strong>
            {s.customers.find((c) => c.id === b.customerId)?.name}
          </strong>
          <span>
            {b.ref} · {displayDate(new Date().toISOString())}
          </span>
        </div>
        <div className="statement-table">
          <table className="t">
            <thead>
              <tr>
                <th>Trip total</th>
                <th>Payments recorded</th>
                <th>Outstanding balance</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{money(f.total)}</td>
                <td>{money(f.paid)}</td>
                <td>
                  <b>{money(f.balance)}</b>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <h2>Installment schedule</h2>
        <div className="statement-table">
          <table className="t">
            <thead>
              <tr>
                <th>Installment</th>
                <th>Due</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {s.installments
                .filter((i) => i.bookingId === b.id)
                .map((i) => (
                  <tr key={i.id}>
                    <td>{i.label}</td>
                    <td>{displayDate(i.dueDate)}</td>
                    <td>{money(i.amountCentavos)}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        <h2>Payment history</h2>
        <div className="statement-table">
          <table className="t">
            <thead>
              <tr>
                <th>Date</th>
                <th>Reference</th>
                <th>Method</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id}>
                  <td>{displayDate(p.receivedAt)}</td>
                  <td>{p.receiptNo}</td>
                  <td>{p.method}</td>
                  <td>{money(p.amountCentavos)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!payments.length && <p>No payments recorded yet.</p>}
        <footer className="statement-footer">
          <p>
            {s.settings.agencyName} · reservations@meptravel.com ·
            mepsabiotravel.com
          </p>
          <p>
            DEMO — simulated data · Entries recorded manually. No real payment
            is processed.
          </p>
        </footer>
      </article>
    </>
  );
}
