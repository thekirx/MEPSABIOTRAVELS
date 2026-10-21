"use client";
import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { addDays, addMonths, format, parseISO } from "date-fns";
import { useTravelStore } from "@/store";
import { financials, destination } from "@/store/selectors";
import { bookingLabel } from "@/domain/labels";
import { quoteTotals } from "@/domain/quote";
import { money } from "@/domain/money";
import {
  bookingStatuses,
  serviceStatuses,
  type BookingService,
  type Traveler,
} from "@/domain/types";
import {
  HeadBlock,
  DetailLayout,
  Sheet,
  KeyValues,
  StatusChip,
  Meter,
} from "@/components/blocks";
import {
  EmptyState,
  NoteForm,
  notify,
  DeadlineChip,
} from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PaymentDialog } from "@/features/payments/payment-dialog";
import { TravelerDialog } from "./booking-dialogs";
function ServiceRow({
  bookingId,
  service: x,
}: {
  bookingId: string;
  service: BookingService;
}) {
  const s = useTravelStore();
  const [ref, setRef] = useState(x.supplierRef ?? "");
  return (
    <tr data-testid="service-row">
      <td>
        <b>{x.category}</b>
        <small>{x.description}</small>
      </td>
      <td>{x.supplierName}</td>
      <td>
        <label>
          <span className="control-label">Service status</span>
          <select
            aria-label="Service status"
            value={x.status}
            onChange={(e) =>
              notify(
                () =>
                  s.updateServiceStatus(
                    bookingId,
                    x.id,
                    e.target.value as BookingService["status"],
                    ref,
                    x.deadline,
                  ),
                "Service status recorded manually (simulated)",
              )
            }
          >
            {serviceStatuses.map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
        </label>
      </td>
      <td>
        <label>
          <span className="control-label">Supplier reference</span>
          <Input
            aria-label="Supplier reference"
            placeholder="Not yet"
            value={ref}
            onChange={(e) => setRef(e.target.value)}
            onBlur={() => {
              if (ref !== (x.supplierRef ?? ""))
                notify(
                  () =>
                    s.updateServiceStatus(
                      bookingId,
                      x.id,
                      x.status,
                      ref,
                      x.deadline,
                    ),
                  "Reference saved manually",
                );
            }}
          />
        </label>
      </td>
      <td>
        <label>
          <span className="control-label">Deadline</span>
          <Input
            aria-label="Service deadline"
            type="datetime-local"
            value={x.deadline ?? ""}
            onChange={(e) =>
              notify(
                () =>
                  s.updateServiceStatus(
                    bookingId,
                    x.id,
                    x.status,
                    ref,
                    e.target.value,
                  ),
                "Deadline updated",
              )
            }
          />
        </label>
        <DeadlineChip date={x.deadline} />
      </td>
    </tr>
  );
}
export function BookingDetails() {
  const s = useTravelStore(),
    params = useSearchParams(),
    router = useRouter();
  const [pay, setPay] = useState(false),
    [traveler, setTraveler] = useState<Traveler | undefined>(),
    [travelerOpen, setTravelerOpen] = useState(false);
  const b = s.bookings.find((b) => b.id === params.get("id"));
  if (!b) return <EmptyState text="Trip not found." />;
  const q = b.quotationSnapshot,
    f = financials(s, b),
    t = quoteTotals(q),
    customer = s.customers.find((c) => c.id === b.customerId),
    pkg = s.packages.find((p) => p.id === q.packageId),
    plan = s.installments.filter((i) => i.bookingId === b.id);
  const createVisa = (traveler: Traveler) =>
    notify(() => {
      const id = s.createVisaCase(b.id, traveler.id);
      router.push(`/visas?case=${id}`);
    }, "Visa case opened (demo)");
  return (
    <>
      <Link className="back" href={`/bookings/view?id=${b.id}`}>
        ← Trip summary
      </Link>
      <HeadBlock
        tag={`Trip · ${b.ref}`}
        title={`${destination(s, q)} · ${customer?.name}`}
        facts={[
          {
            label: "Dates",
            value: `${format(parseISO(q.departDate), "EEE d MMM")} – ${format(parseISO(q.returnDate), "EEE d MMM")}`,
          },
          { label: "Travelers", value: `${b.travelers.length} people` },
          { label: "Price (locked)", value: money(f.total) },
          {
            label: "Still to collect",
            value: (
              <span data-testid="booking-balance">{money(f.balance)}</span>
            ),
          },
        ]}
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
              onClick={() => setPay(true)}
            >
              Record payment
            </Button>
          </>
        }
      />
      <DetailLayout
        sections={[
          { id: "overview", label: "Overview" },
          { id: "travelers", label: "Travelers", count: b.travelers.length },
          { id: "suppliers", label: "Suppliers", count: b.services.length },
          { id: "payments", label: "Payments" },
          { id: "itinerary", label: "Itinerary" },
          { id: "visa", label: "Visa" },
          { id: "history", label: "History" },
        ]}
      >
        <Sheet
          id="overview"
          title="Overview"
          action={<StatusChip>{bookingLabel(b.status)}</StatusChip>}
        >
          <KeyValues
            items={[
              {
                label: "Customer",
                value: (
                  <Link
                    href={`/customers/view?id=${b.customerId}`}
                    className="linkish"
                  >
                    {customer?.name}
                  </Link>
                ),
              },
              {
                label: "Handled by",
                value: s.agents.find((a) => a.id === b.assignedAgentId)?.name,
              },
              { label: "Came from", value: customer?.source },
              { label: "Package", value: pkg?.name ?? "Custom trip" },
              { label: "Booked", value: b.createdAt },
              {
                label: "From quote",
                value: (
                  <Link
                    className="linkish"
                    href={`/quotations/view?id=${q.id}`}
                  >
                    {q.ref} · v{q.version}
                  </Link>
                ),
              },
            ]}
          />
          <div className="form-grid new-section">
            <label className="field">
              <span>Booking status</span>
              <select
                aria-label="Booking status"
                value={b.status}
                onChange={(e) =>
                  notify(() =>
                    s.updateBooking(b.id, {
                      status: e.target.value as typeof b.status,
                    }),
                  )
                }
              >
                {bookingStatuses.map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Assigned agent</span>
              <select
                aria-label="Assigned agent"
                value={b.assignedAgentId}
                onChange={(e) =>
                  notify(() =>
                    s.updateBooking(b.id, { assignedAgentId: e.target.value }),
                  )
                }
              >
                {s.agents.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="staff-only new-section">
            <h3>
              Price breakdown <small>Locked when the quote was accepted</small>
            </h3>
            <div className="table-wrap">
              <table className="t">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Supplier</th>
                    <th>Cost</th>
                    <th>Charged</th>
                    <th>Line total</th>
                  </tr>
                </thead>
                <tbody>
                  {q.lines.map((l) => (
                    <tr key={l.id}>
                      <td>{l.description}</td>
                      <td>{l.supplierName}</td>
                      <td>{money(l.costCentavos)}</td>
                      <td>
                        {l.basis === "per_pax"
                          ? `Per person × ${q.paxCount}`
                          : "Once per group"}
                      </td>
                      <td>
                        {money(
                          l.costCentavos *
                            (l.basis === "per_pax" ? q.paxCount : 1),
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={4}>Our cost</td>
                    <td>{money(t.netCost)}</td>
                  </tr>
                  <tr>
                    <td colSpan={4}>
                      Customer pays · {money(t.perPax)} per person
                    </td>
                    <td>{money(t.selling)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
            <p>
              Markup {q.markupPct}% · Discount {money(q.discountCentavos)} ·
              Profit {money(t.grossProfit)}
            </p>
          </div>
        </Sheet>
        <Sheet
          id="travelers"
          title="Travelers"
          action={
            <Button
              variant="outline"
              onClick={() => {
                setTraveler(undefined);
                setTravelerOpen(true);
              }}
            >
              Add traveler
            </Button>
          }
        >
          <div className="table-wrap">
            <table className="t">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Birth date</th>
                  <th>Passport</th>
                  <th>Visa</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {b.travelers.map((tr) => {
                  const warning =
                    !tr.passportExpiry ||
                    parseISO(tr.passportExpiry) <
                      addMonths(parseISO(q.returnDate), 6);
                  const visa = s.visas.find(
                    (v) => v.bookingId === b.id && v.travelerId === tr.id,
                  );
                  return (
                    <tr key={tr.id} data-testid="traveler-row">
                      <td>
                        <b>{tr.fullName}</b>
                        {/^(Guest|Traveler)\s+\d+$/i.test(tr.fullName) && (
                          <small>Name needed</small>
                        )}
                      </td>
                      <td>{tr.birthDate || "Needed"}</td>
                      <td>
                        {tr.passportExpiry || "Needed"}
                        {warning && (
                          <small className="danger-text">
                            {tr.passportExpiry
                              ? "Expires less than 6 months after return"
                              : "Passport details required"}
                          </small>
                        )}
                      </td>
                      <td>
                        {tr.visaRequired ? (
                          <Button
                            variant="outline"
                            onClick={() => createVisa(tr)}
                          >
                            {visa ? "Open visa case" : "Create visa case"}
                          </Button>
                        ) : (
                          "Not required"
                        )}
                      </td>
                      <td>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setTraveler(tr);
                            setTravelerOpen(true);
                          }}
                        >
                          Edit details
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Sheet>
        <Sheet
          id="suppliers"
          title="Suppliers"
          note="References recorded manually · simulated"
        >
          <div className="table-wrap">
            <table className="t supplier-table">
              <thead>
                <tr>
                  <th>Service</th>
                  <th>Supplier</th>
                  <th>Status</th>
                  <th>Reference</th>
                  <th>Deadline</th>
                </tr>
              </thead>
              <tbody>
                {b.services.map((x) => (
                  <ServiceRow key={x.id} bookingId={b.id} service={x} />
                ))}
              </tbody>
            </table>
          </div>
        </Sheet>
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
                onClick={() => setPay(true)}
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
                {plan.map((i, index) => {
                  const prior = plan
                    .slice(0, index)
                    .reduce((sum, x) => sum + x.amountCentavos, 0);
                  const paid = Math.min(
                    i.amountCentavos,
                    Math.max(0, f.paid - prior),
                  );
                  const left = i.amountCentavos - paid,
                    late =
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
                      <td>{p.receivedAt}</td>
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
        <Sheet
          id="itinerary"
          title="Itinerary"
          note="As shown on the accepted quote"
        >
          <ul className="timeline">
            {q.itineraryDays.map((day, i) => (
              <li key={i}>
                <time>
                  Day {i + 1} ·{" "}
                  {format(addDays(parseISO(q.departDate), i), "EEE d MMM")}
                </time>
                <span>{day}</span>
              </li>
            ))}
          </ul>
        </Sheet>
        <Sheet id="visa" title="Visa">
          {b.travelers
            .filter((t) => t.visaRequired)
            .map((tr) => {
              const v = s.visas.find(
                (v) => v.bookingId === b.id && v.travelerId === tr.id,
              );
              return (
                <div key={tr.id} className="callout">
                  <div>
                    <b>{tr.fullName}</b>
                    <p>
                      {v ? v.stage : "Start a case to track the requirements."}{" "}
                      Nothing is sent to an embassy.
                    </p>
                  </div>
                  <Button variant="outline" onClick={() => createVisa(tr)}>
                    {v ? "Open visa case" : "Create visa case"}
                  </Button>
                </div>
              );
            })}
          {!b.travelers.some((t) => t.visaRequired) && (
            <p>No visa required for these travelers.</p>
          )}
        </Sheet>
        <Sheet id="history" title="History">
          <ul className="notes-list">
            {b.notes.map((n, i) => (
              <li key={i}>{n}</li>
            ))}
          </ul>
          <NoteForm onAdd={(n) => s.addBookingNote(b.id, n)} />
        </Sheet>
      </DetailLayout>
      <PaymentDialog
        bookingId={b.id}
        open={pay}
        onClose={() => setPay(false)}
      />
      <TravelerDialog
        booking={b}
        traveler={traveler}
        open={travelerOpen}
        onClose={() => setTravelerOpen(false)}
      />
    </>
  );
}
