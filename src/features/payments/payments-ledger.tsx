"use client";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Printer, Plus, ArrowLeft, WalletCards } from "lucide-react";
import { useTravelStore } from "@/store";
import { financials, kpis } from "@/store/selectors";
import { money } from "@/domain/money";
import {
  PageHeader,
  MoneyCell,
  StatusBadge,
  EmptyState,
} from "@/components/shared";
import { Button } from "@/components/ui/button";
import { PaymentDialog } from "./payment-dialog";
export function PaymentsLedger() {
  const s = useTravelStore(),
    params = useSearchParams();
  const [status, setStatus] = useState(params.get("status") ?? "All"),
    [payment, setPayment] = useState("");
  const statement = s.bookings.find((b) => b.id === params.get("statement"));
  const rows = s.bookings.filter(
    (b) =>
      b.status !== "Cancelled" &&
      (status === "All" || financials(s, b).status === status),
  );
  if (statement) {
    const b = statement,
      f = financials(s, b);
    return (
      <>
        <Link href="/payments" className="back-link no-print">
          <ArrowLeft size={14} />
          Receivables ledger
        </Link>
        <PageHeader
          title="Statement of account"
          action={
            <Button onClick={() => window.print()}>
              <Printer />
              Print statement
            </Button>
          }
        />
        <article className="statement print-document">
          <h2>{s.settings.agencyName}</h2>
          <p className="subtle-note">DEMO — simulated data</p>
          <h1>Statement of account</h1>
          <p>Statement — not an official receipt/invoice.</p>
          <div className="statement-meta">
            <strong>
              {s.customers.find((c) => c.id === b.customerId)?.name}
            </strong>
            <span>
              {b.ref} · {new Date().toLocaleDateString("en-PH")}
            </span>
          </div>
          <table>
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
                  <strong>{money(f.balance)}</strong>
                </td>
              </tr>
            </tbody>
          </table>
          <h3>Installment schedule</h3>
          <table>
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
                    <td>{i.dueDate}</td>
                    <td>{money(i.amountCentavos)}</td>
                  </tr>
                ))}
            </tbody>
          </table>
          <h3>Payment history</h3>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Reference</th>
                <th>Method</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {s.payments
                .filter((p) => p.bookingId === b.id)
                .map((p) => (
                  <tr key={p.id}>
                    <td>{p.receivedAt}</td>
                    <td>{p.receiptNo}</td>
                    <td>{p.method}</td>
                    <td>{money(p.amountCentavos)}</td>
                  </tr>
                ))}
            </tbody>
          </table>
          <p className="subtle-note">
            Illustrative amounts. Entries recorded manually. No real payment is
            processed.
          </p>
        </article>
      </>
    );
  }
  return (
    <>
      <PageHeader
        title="Payments & receivables"
        description="A clear view of what's paid, what's due, and what needs a follow-up."
      />
      <div className="receivables-banner">
        <div className="receivables-icon">
          <WalletCards size={25} />
        </div>
        <div>
          <p>OUTSTANDING RECEIVABLES</p>
          <strong
            data-testid="kpi-receivables"
            data-centavos={kpis(s).receivables}
          >
            {money(kpis(s).receivables)}
          </strong>
        </div>
        <span>
          Across{" "}
          {
            s.bookings.filter(
              (b) => b.status !== "Cancelled" && financials(s, b).balance > 0,
            ).length
          }{" "}
          active bookings
        </span>
      </div>
      <div className="toolbar">
        <div className="toolbar-left">
          {["All", "Unpaid", "Partially Paid", "Fully Paid", "Overdue"].map(
            (x) => (
              <button
                key={x}
                className={`chip ${status === x ? "active" : ""}`}
                onClick={() => setStatus(x)}
              >
                {x}
              </button>
            ),
          )}
        </div>
        <span className="subtle-note">Manual ledger · PHP</span>
      </div>
      <div className="panel table-wrap">
        <table>
          <thead>
            <tr>
              <th>Booking / customer</th>
              <th>Total</th>
              <th>Paid</th>
              <th>Balance</th>
              <th>Next due</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((b) => {
              const f = financials(s, b);
              return (
                <tr
                  key={b.id}
                  className={f.status === "Overdue" ? "overdue-row" : ""}
                >
                  <td>
                    <Link href={`/bookings/view?id=${b.id}`}>
                      <strong>
                        {s.customers.find((c) => c.id === b.customerId)?.name}
                      </strong>
                      <p className="subtle-note">{b.ref}</p>
                    </Link>
                  </td>
                  <td>
                    <MoneyCell value={f.total} />
                  </td>
                  <td>
                    <MoneyCell value={f.paid} />
                  </td>
                  <td>
                    <strong
                      className={f.status === "Overdue" ? "danger-text" : ""}
                    >
                      <MoneyCell value={f.balance} />
                    </strong>
                  </td>
                  <td>{f.nextDue?.dueDate ?? "Settled"}</td>
                  <td>
                    <StatusBadge status={f.status} />
                  </td>
                  <td>
                    <div className="row-actions">
                      <Button
                        size="icon"
                        variant="outline"
                        aria-label={`Record payment for ${b.ref}`}
                        disabled={f.balance <= 0}
                        onClick={() => setPayment(b.id)}
                      >
                        <Plus />
                      </Button>
                      <Link
                        href={`/payments?statement=${b.id}`}
                        aria-label={`Statement for ${b.ref}`}
                      >
                        <Button variant="ghost" size="icon">
                          <Printer />
                        </Button>
                      </Link>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!rows.length && <EmptyState />}
      </div>
      <p className="list-footnote">
        Statements are not official receipts or invoices. All entries are
        simulated.
      </p>
      {payment && (
        <PaymentDialog
          bookingId={payment}
          open={!!payment}
          onClose={() => setPayment("")}
        />
      )}
    </>
  );
}
