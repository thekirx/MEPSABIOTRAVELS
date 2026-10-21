"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { addMonths, parseISO, format } from "date-fns";
import {
  ArrowLeft,
  Plus,
  WalletCards,
  Users,
  Plane,
  StickyNote,
  ShieldCheck,
  AlertTriangle,
  Printer,
} from "lucide-react";
import { useTravelStore } from "@/store";
import { financials, destination } from "@/store/selectors";
import {
  bookingStatuses,
  serviceStatuses,
  type BookingService,
  type Traveler,
} from "@/domain/types";
import { money } from "@/domain/money";
import {
  PageHeader,
  StatusBadge,
  DeadlineChip,
  Field,
  Modal,
  NoteForm,
  EmptyState,
  notify,
  MoneyCell,
} from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PaymentDialog } from "@/features/payments/payment-dialog";
function ServiceRow({
  bookingId,
  service,
}: {
  bookingId: string;
  service: BookingService;
}) {
  const s = useTravelStore();
  const [ref, setRef] = useState(service.supplierRef ?? ""),
    [deadline, setDeadline] = useState(service.deadline ?? "");
  return (
    <div className="service-row" data-testid="service-row">
      <div className="service-icon">
        <Plane size={19} />
      </div>
      <div className="service-description">
        <strong>{service.category}</strong>
        <p>{service.description}</p>
        <small>{service.supplierName}</small>
        <DeadlineChip date={service.deadline} />
      </div>
      <div className="service-controls">
        <select
          aria-label="Service status"
          value={service.status}
          onChange={(e) =>
            notify(
              () =>
                s.updateServiceStatus(
                  bookingId,
                  service.id,
                  e.target.value as BookingService["status"],
                  ref,
                  deadline,
                ),
              "Service status recorded manually (simulated)",
            )
          }
        >
          {serviceStatuses.map((x) => (
            <option key={x}>{x}</option>
          ))}
        </select>
        <Input
          aria-label="Supplier reference"
          placeholder="Simulated confirmation no."
          value={ref}
          onChange={(e) => setRef(e.target.value)}
          onBlur={() => {
            if (ref !== (service.supplierRef ?? ""))
              notify(
                () =>
                  s.updateServiceStatus(
                    bookingId,
                    service.id,
                    service.status,
                    ref,
                    deadline,
                  ),
                "Reference recorded manually",
              );
          }}
        />
        <Input
          aria-label="Service deadline"
          type="datetime-local"
          value={deadline}
          onChange={(e) => {
            setDeadline(e.target.value);
            notify(
              () =>
                s.updateServiceStatus(
                  bookingId,
                  service.id,
                  service.status,
                  ref,
                  e.target.value,
                ),
              "Deadline updated",
            );
          }}
        />
        <small className="subtle-note">
          Reference recorded manually · simulated
        </small>
      </div>
    </div>
  );
}
function TravelerRow({
  bookingId,
  traveler,
  returnDate,
}: {
  bookingId: string;
  traveler: Traveler;
  returnDate: string;
}) {
  const s = useTravelStore(),
    router = useRouter();
  const warning =
    !traveler.passportExpiry ||
    parseISO(traveler.passportExpiry) < addMonths(parseISO(returnDate), 6);
  const change = (patch: Partial<Traveler>) =>
    notify(
      () => s.updateTraveler(bookingId, traveler.id, patch),
      "Traveler details saved",
    );
  const existing = s.visas.find(
    (v) => v.bookingId === bookingId && v.travelerId === traveler.id,
  );
  return (
    <div className="traveler-row" data-testid="traveler-row">
      <div className="form-grid">
        <Field label="Full name">
          <Input
            aria-label="Traveler full name"
            defaultValue={traveler.fullName}
            key={traveler.fullName}
            onBlur={(e) => {
              if (e.target.value !== traveler.fullName && e.target.value.trim())
                change({ fullName: e.target.value });
            }}
          />
        </Field>
        <Field label="Date of birth">
          <Input
            aria-label="Traveler birth date"
            type="date"
            value={traveler.birthDate}
            onChange={(e) => change({ birthDate: e.target.value })}
          />
        </Field>
        <Field label="Passport expiry">
          <Input
            aria-label="Passport expiry"
            type="date"
            value={traveler.passportExpiry}
            onChange={(e) => change({ passportExpiry: e.target.value })}
          />
        </Field>
        <div className="traveler-visa">
          <label>
            <input
              type="checkbox"
              checked={traveler.visaRequired}
              onChange={(e) => change({ visaRequired: e.target.checked })}
            />
            Visa required
          </label>
          {traveler.visaRequired && (
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                notify(
                  () => {
                    const id = s.createVisaCase(bookingId, traveler.id);
                    router.push(`/visas?case=${id}`);
                  },
                  existing ? "Visa case opened" : "Demo visa case created",
                )
              }
            >
              <ShieldCheck />
              {existing ? "Open visa case" : "Create visa case"}
            </Button>
          )}
        </div>
      </div>
      {warning && (
        <p className="passport-warning">
          <AlertTriangle size={13} />
          {traveler.passportExpiry
            ? "Passport expires less than 6 months after return."
            : "Passport details required before travel."}
        </p>
      )}
    </div>
  );
}
export function BookingDetail() {
  const s = useTravelStore(),
    params = useSearchParams();
  const b = s.bookings.find((b) => b.id === params.get("id"));
  const [tab, setTab] = useState("Overview"),
    [payment, setPayment] = useState(false),
    [add, setAdd] = useState(false);
  if (!b)
    return (
      <EmptyState text="Booking not found. Open a booking from the list." />
    );
  const q = b.quotationSnapshot,
    f = financials(s, b),
    customer = s.customers.find((c) => c.id === b.customerId);
  return (
    <>
      <Link href="/bookings" className="back-link">
        <ArrowLeft size={14} />
        All bookings
      </Link>
      <PageHeader
        title={b.ref}
        description={`${customer?.name} · ${destination(s, q)} · ${q.departDate} — ${q.returnDate}`}
        action={
          <>
            <Link href={`/payments?statement=${b.id}`}>
              <Button variant="outline">
                <Printer />
                Statement
              </Button>
            </Link>
            <Button
              onClick={() => setPayment(true)}
              disabled={f.balance <= 0 || b.status === "Cancelled"}
            >
              <Plus />
              Record payment
            </Button>
          </>
        }
      />
      <div className="booking-summary">
        <div>
          <small>BOOKING STATUS</small>
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
        </div>
        <div>
          <small>ASSIGNED TO</small>
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
        </div>
        <div>
          <small>TOTAL TRIP VALUE</small>
          <strong>{money(f.total)}</strong>
        </div>
        <div>
          <small>OUTSTANDING BALANCE</small>
          <strong
            data-testid="booking-balance"
            className={f.status === "Overdue" ? "danger-text" : "positive-text"}
          >
            {money(f.balance)}
          </strong>
          <StatusBadge status={f.status} />
        </div>
      </div>
      <div className="tabs-bar">
        {[
          ["Overview", Plane],
          ["Travelers", Users],
          ["Payments", WalletCards],
          ["Activity", StickyNote],
        ].map(([label, Icon]) => {
          const I = Icon as typeof Plane;
          return (
            <button
              key={String(label)}
              className={tab === label ? "active" : ""}
              onClick={() => setTab(String(label))}
            >
              <I size={14} />
              {String(label)}
            </button>
          );
        })}
      </div>
      <div className="section-stack">
        {tab === "Overview" && (
          <>
            <section className="panel">
              <div className="panel-header">
                <h2>Services & confirmations</h2>
                <span className="subtle-note">All services simulated</span>
              </div>
              <div className="panel-body">
                {b.services.map((service) => (
                  <ServiceRow
                    key={service.id}
                    service={service}
                    bookingId={b.id}
                  />
                ))}
              </div>
            </section>
          </>
        )}
        {(tab === "Overview" || tab === "Travelers") && (
          <section className="panel">
            <div className="panel-header">
              <h2>
                Travelers <span className="muted">({b.travelers.length})</span>
              </h2>
              <Button size="sm" variant="outline" onClick={() => setAdd(true)}>
                <Plus />
                Add traveler
              </Button>
            </div>
            <div className="panel-body">
              {b.travelers.map((t) => (
                <TravelerRow
                  key={t.id}
                  bookingId={b.id}
                  traveler={t}
                  returnDate={q.returnDate}
                />
              ))}
            </div>
          </section>
        )}
        {(tab === "Overview" || tab === "Payments") && (
          <>
            <section className="panel">
              <div className="panel-header">
                <h2>Payment plan</h2>
                <StatusBadge status={f.status} />
              </div>
              <div className="panel-body">
                <div className="payment-progress">
                  <span
                    style={{
                      width: `${Math.min(100, (f.paid / f.total) * 100)}%`,
                    }}
                  />
                </div>
                <div className="payment-progress-label">
                  <span>{money(f.paid)} recorded</span>
                  <span>{money(f.balance)} remaining</span>
                </div>
                <table>
                  <thead>
                    <tr>
                      <th>Installment</th>
                      <th>Due date</th>
                      <th>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {s.installments
                      .filter((i) => i.bookingId === b.id)
                      .map((i) => (
                        <tr data-testid="installment-row" key={i.id}>
                          <td>{i.label}</td>
                          <td>{format(parseISO(i.dueDate), "MMM d, yyyy")}</td>
                          <td>
                            <MoneyCell value={i.amountCentavos} />
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </section>
            <section className="panel">
              <div className="panel-header">
                <h2>Payment history</h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPayment(true)}
                  disabled={f.balance <= 0 || b.status === "Cancelled"}
                >
                  Record payment
                </Button>
              </div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Demo reference</th>
                      <th>Method</th>
                      <th>Amount</th>
                      <th>Note</th>
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
                          <td>
                            <MoneyCell value={p.amountCentavos} />
                          </td>
                          <td>{p.note}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
                {!s.payments.some((p) => p.bookingId === b.id) && (
                  <EmptyState text="No payments recorded yet." />
                )}
              </div>
            </section>
          </>
        )}
        {(tab === "Overview" || tab === "Activity") && (
          <section className="panel">
            <div className="panel-header">
              <h2>Notes & activity</h2>
            </div>
            <div className="panel-body">
              <div className="activity-list">
                {b.notes.map((n, i) => (
                  <p key={i}>
                    <i />
                    {n}
                  </p>
                ))}
              </div>
              <NoteForm onAdd={(note) => s.addBookingNote(b.id, note)} />
            </div>
          </section>
        )}
      </div>
      <PaymentDialog
        bookingId={b.id}
        open={payment}
        onClose={() => setPayment(false)}
      />
      <Modal open={add} onOpenChange={setAdd} title="Add traveler">
        <form
          className="section-stack"
          onSubmit={(e) => {
            e.preventDefault();
            const d = new FormData(e.currentTarget);
            notify(
              () =>
                s.addTraveler(b.id, {
                  fullName: String(d.get("name")),
                  birthDate: String(d.get("birth")),
                  passportExpiry: String(d.get("passport")),
                  visaRequired: d.get("visa") === "on",
                }),
              "Traveler added",
            );
            setAdd(false);
          }}
        >
          <Field label="Full name">
            <Input name="name" required />
          </Field>
          <Field label="Date of birth">
            <Input type="date" name="birth" required />
          </Field>
          <Field label="Passport expiry">
            <Input type="date" name="passport" required />
          </Field>
          <label className="checkbox-label">
            <input type="checkbox" name="visa" />
            Visa required
          </label>
          <Button type="submit">Add traveler</Button>
        </form>
      </Modal>
    </>
  );
}
