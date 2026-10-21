"use client";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import { useTravelStore } from "@/store";
import { customerBalance, financials, destination } from "@/store/selectors";
import { quoteTotals } from "@/domain/quote";
import { leadLabel } from "@/domain/labels";
import { money } from "@/domain/money";
import {
  HeadBlock,
  DetailLayout,
  Sheet,
  KeyValues,
  StatusChip,
} from "@/components/blocks";
import { EmptyState, NoteForm, notify } from "@/components/shared";
export function CustomerPage() {
  const s = useTravelStore(),
    params = useSearchParams(),
    router = useRouter();
  const c = s.customers.find((c) => c.id === params.get("id"));
  if (!c) return <EmptyState text="Customer not found." />;
  const leads = s.leads.filter((l) => l.customerId === c.id),
    quotes = s.quotations.filter((q) => q.customerId === c.id),
    bookings = s.bookings.filter((b) => b.customerId === c.id),
    payments = s.payments.filter((p) =>
      bookings.some((b) => b.id === p.bookingId),
    );
  const spend = bookings
    .filter((b) => b.status !== "Cancelled")
    .reduce((sum, b) => sum + quoteTotals(b.quotationSnapshot).selling, 0);
  return (
    <>
      <Link className="back" href="/inquiries">
        ← People asking
      </Link>
      <HeadBlock
        tag={`Customer · since ${format(parseISO(c.createdAt), "d MMM yyyy")}`}
        title={c.name}
        facts={[
          { label: "Came from", value: c.source },
          { label: "Trips", value: `${bookings.length} booked` },
          { label: "Spent", value: money(spend) },
          {
            label: "Still owes",
            value: (
              <span data-testid="customer-balance">
                {money(customerBalance(s, c.id))}
              </span>
            ),
          },
        ]}
        action={
          <>
            <a className="btn ghost small" href="#notes">
              Add note
            </a>
            {leads[0] && (
              <button
                className="btn lime small"
                onClick={() =>
                  notify(() => {
                    const id = s.createQuotation(leads[0].id);
                    router.push(`/quotations/view?id=${id}`);
                  }, "Quote draft created")
                }
              >
                New quote
              </button>
            )}
          </>
        }
      />
      <DetailLayout
        sections={[
          { id: "contact", label: "Contact" },
          { id: "request", label: "Trip request" },
          { id: "quotes", label: "Quotes", count: quotes.length },
          { id: "trips", label: "Trips", count: bookings.length },
          { id: "payments", label: "Payments" },
          { id: "notes", label: "Notes" },
        ]}
      >
        <Sheet id="contact" title="Contact">
          <KeyValues
            items={[
              { label: "Mobile", value: c.phone },
              { label: "Email", value: c.email },
              { label: "City", value: c.city },
              { label: "Came from", value: c.source },
              {
                label: "Handled by",
                value:
                  s.agents.find((a) => a.id === leads[0]?.assignedAgentId)
                    ?.name ?? "Unassigned",
              },
              {
                label: "Customer since",
                value: format(parseISO(c.createdAt), "d MMM yyyy"),
              },
            ]}
          />
        </Sheet>
        <Sheet id="request" title="Trip request">
          {leads.map((l) => (
            <div className="customer-request" key={l.id}>
              <StatusChip tone={l.stage === "Won" ? "ok" : "wait"}>
                {leadLabel(l.stage)}
              </StatusChip>
              <KeyValues
                items={[
                  { label: "Destination", value: l.destination },
                  {
                    label: "When",
                    value: format(parseISO(l.travelMonth + "-01"), "MMMM yyyy"),
                  },
                  { label: "People", value: l.paxCount },
                  {
                    label: "Budget",
                    value: l.budgetCentavos
                      ? money(l.budgetCentavos)
                      : "To discuss",
                  },
                  { label: "First contact", value: l.createdAt },
                  { label: "Last talked", value: l.lastContactAt },
                ]}
              />
            </div>
          ))}
          {!leads.length && <p>No trip requests yet.</p>}
        </Sheet>
        <Sheet id="quotes" title="Quotes">
          <div className="table-wrap">
            <table className="t">
              <thead>
                <tr>
                  <th>Quote</th>
                  <th>Trip</th>
                  <th>Status</th>
                  <th>Price</th>
                </tr>
              </thead>
              <tbody>
                {quotes.map((q) => (
                  <tr key={q.id}>
                    <td>
                      <Link
                        className="linkish"
                        href={`/quotations/view?id=${q.id}`}
                      >
                        {q.ref}
                      </Link>
                      <small>Version {q.version}</small>
                    </td>
                    <td>
                      {destination(s, q)} · {q.paxCount} people
                    </td>
                    <td>
                      <StatusChip>{q.status}</StatusChip>
                    </td>
                    <td>{money(quoteTotals(q).selling)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!quotes.length && <p>No quotes yet.</p>}
        </Sheet>
        <Sheet id="trips" title="Trips">
          <div className="table-wrap">
            <table className="t">
              <thead>
                <tr>
                  <th>Booking</th>
                  <th>Trip</th>
                  <th>Leaves</th>
                  <th>Still owes</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b) => (
                  <tr key={b.id}>
                    <td>
                      <Link
                        href={`/bookings/view?id=${b.id}`}
                        className="linkish"
                      >
                        {b.ref}
                      </Link>
                    </td>
                    <td>
                      {destination(s, b.quotationSnapshot)} ·{" "}
                      {b.travelers.length} people
                    </td>
                    <td>
                      {format(
                        parseISO(b.quotationSnapshot.departDate),
                        "EEE d MMM",
                      )}
                    </td>
                    <td>{money(financials(s, b).balance)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!bookings.length && <p>No trips booked yet.</p>}
        </Sheet>
        <Sheet id="payments" title="Payments">
          <div className="table-wrap">
            <table className="t">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>For</th>
                  <th>Method</th>
                  <th>Reference</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id}>
                    <td>{p.receivedAt}</td>
                    <td>{bookings.find((b) => b.id === p.bookingId)?.ref}</td>
                    <td>{p.method}</td>
                    <td>{p.receiptNo}</td>
                    <td>{money(p.amountCentavos)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={4}>Still owes across active trips</td>
                  <td>{money(customerBalance(s, c.id))}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </Sheet>
        <Sheet id="notes" title="Notes">
          {leads.map((l) => (
            <div key={l.id}>
              <ul className="notes-list">
                {l.notes.map((n, i) => (
                  <li key={i}>{n}</li>
                ))}
              </ul>
              <NoteForm onAdd={(note) => s.addLeadNote(l.id, note)} />
            </div>
          ))}
          {!leads.length && <p>Add an inquiry before recording notes.</p>}
        </Sheet>
      </DetailLayout>
    </>
  );
}
