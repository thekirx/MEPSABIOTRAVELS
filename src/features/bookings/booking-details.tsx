"use client";
import { displayNote } from "@/domain/dates";
import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { addDays, format, parseISO } from "date-fns";
import { useTravelStore } from "@/store";
import { financials, destination } from "@/store/selectors";
import { money } from "@/domain/money";
import type { Traveler } from "@/domain/types";
import { HeadBlock, DetailLayout, Sheet } from "@/components/blocks";
import { EmptyState, NoteForm, notify } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { PaymentDialog } from "@/features/payments/payment-dialog";
import { TravelerDialog } from "./booking-dialogs";
import { ServiceRow } from "./booking-service-row";
import { BookingOverview } from "./booking-overview";
import { BookingTravelers } from "./booking-travelers";
import { BookingPayments } from "./booking-payments";
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
    customer = s.customers.find((c) => c.id === b.customerId);
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
        <BookingOverview booking={b} />
        <BookingTravelers
          booking={b}
          onEdit={(tr) => {
            setTraveler(tr);
            setTravelerOpen(true);
          }}
          onCreateVisa={createVisa}
        />
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
        <BookingPayments booking={b} onPayment={() => setPay(true)} />
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
              <li key={i}>{displayNote(n)}</li>
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
