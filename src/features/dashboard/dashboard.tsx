"use client";
import { useState } from "react";
import Link from "next/link";
import { dueLabel } from "@/domain/dates";
import { useTravelStore } from "@/store";
import {
  homeJobs,
  upcoming,
  destination,
  tripStatus,
  type HomeJob,
} from "@/store/selectors";
import { Block, BigNumber, LuggageTag } from "@/components/blocks";
import { ServiceReferenceDialog } from "@/features/bookings/service-reference-dialog";
import { Modal } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { PaymentDialog } from "@/features/payments/payment-dialog";
function Job({
  job,
  onTicket,
  onPayment,
}: {
  job: HomeJob;
  onTicket: () => void;
  onPayment: () => void;
}) {
  const first = job.customerName.split(" ")[0];
  if (job.type === "payment")
    return (
      <Block
        variant="red"
        className="job"
        tag="Payment late"
        action={<Button onClick={onPayment}>Record payment</Button>}
      >
        <BigNumber value={job.amountCentavos ?? 0} />
        <p>
          Collect from {job.customerName} for their {job.place} trip.
        </p>
      </Block>
    );
  if (job.type === "service") {
    return (
      <Block
        variant="char"
        className="job"
        tag={job.deadline ? dueLabel(job.deadline) : "Needs you now"}
        title={
          job.category === "Airfare"
            ? `Issue ${first}'s plane ticket`
            : `Confirm the ${job.category?.toLowerCase()}`
        }
        action={
          <Button onClick={onTicket}>
            {job.category === "Airfare" ? "Record ticket" : "Add reference"}
          </Button>
        }
      >
        <p>
          {job.place} trip. Record the airline reference before the hold
          expires.
        </p>
      </Block>
    );
  }
  if (job.type === "quote")
    return (
      <Block
        variant="lime"
        className="job"
        tag={`By ${job.tag}`}
        title={`Call ${first} about their ${job.place} quote`}
        action={
          <Link href={job.href} className="btn">
            Open quote
          </Link>
        }
      >
        <p>Ask if they&apos;re ready to book. The quote expires soon.</p>
      </Block>
    );
  return (
    <Block
      variant="white"
      className="job"
      tag="Visa papers"
      title={`${job.missing} visa papers missing for ${first}`}
      action={
        <Link className="btn" href={job.href}>
          Open visas
        </Link>
      }
    >
      <p>Check the requirements for their {job.place} trip.</p>
    </Block>
  );
}
export function Dashboard() {
  const s = useTravelStore(),
    jobs = homeJobs(s);
  const [ticket, setTicket] = useState<HomeJob | null>(null),
    [payment, setPayment] = useState<HomeJob | null>(null),
    [all, setAll] = useState(false),
    [done, setDone] = useState<string[]>([]);
  return (
    <>
      <section className="hello">
        <div>
          <h1>
            Good morning,{" "}
            {s.agents.find((a) => a.role === "Owner")?.name.split(" ")[0] ??
              "there"}
          </h1>
          <p>
            {jobs.length
              ? `You have ${jobs.length} jobs today.`
              : "All done for today. Nice work."}
          </p>
        </div>
        <Link className="btn lime" href="/inquiries?new=1">
          + New inquiry
        </Link>
      </section>
      <section
        className="g3 home-jobs"
        aria-label="Today's jobs"
        aria-live="polite"
      >
        {jobs.slice(0, 3).map((j) => (
          <Job
            key={j.id}
            job={j}
            onTicket={() => setTicket(j)}
            onPayment={() => setPayment(j)}
          />
        ))}
        {!jobs.length && (
          <Block variant="done" tag="✓ Done" title="Everything is up to date">
            <p>You&apos;re ready for the next journey.</p>
          </Block>
        )}
      </section>
      {done.length > 0 && (
        <Block
          variant="done"
          className="session-done"
          tag="✓ Done this session"
        >
          <p>{done[done.length - 1]}</p>
        </Block>
      )}
      {jobs.length > 3 && (
        <button className="linkish jobs-link" onClick={() => setAll(true)}>
          See all {jobs.length} jobs →
        </button>
      )}
      <div className="section-title">
        <h2>Leaving soon</h2>
        <Link href="/bookings">See all trips →</Link>
      </div>
      <section className="g4">
        {upcoming(s)
          .slice(0, 4)
          .map((b) => {
            const status = tripStatus(s, b);
            return (
              <div className="luggage-wrap" key={b.id}>
                <LuggageTag
                  destination={destination(s, b.quotationSnapshot)}
                  date={b.quotationSnapshot.departDate}
                  name={
                    s.customers.find((c) => c.id === b.customerId)?.name ??
                    "Traveler"
                  }
                  people={b.travelers.length}
                  status={status.label}
                  tone={status.tone}
                  href={`/bookings/view?id=${b.id}`}
                />
                {b.services.some(
                  (x) => x.category === "Airfare" && x.status === "Issued",
                ) && (
                  <span className="ticket-recorded">
                    Ticket issued · recorded manually
                  </span>
                )}
              </div>
            );
          })}
      </section>
      <Modal open={all} onOpenChange={setAll} title="All jobs today">
        <div className="all-jobs">
          {jobs.map((j) => (
            <Link key={j.id} href={j.href}>
              <strong>{j.customerName}</strong>
              <span>
                {j.title} · {j.tag}
              </span>
            </Link>
          ))}
        </div>
      </Modal>
      {ticket?.bookingId && ticket.serviceId && (
        <ServiceReferenceDialog
          bookingId={ticket.bookingId}
          serviceId={ticket.serviceId}
          onClose={() => setTicket(null)}
          onSaved={() =>
            setDone([
              ...done,
              `${ticket.customerName}'s ticket reference recorded.`,
            ])
          }
        />
      )}
      {payment?.bookingId && (
        <PaymentDialog
          bookingId={payment.bookingId}
          open
          onClose={() => {
            if (
              !homeJobs(useTravelStore.getState()).some(
                (j) => j.id === payment.id,
              )
            )
              setDone([
                ...done,
                `${payment.customerName}'s overdue payment recorded.`,
              ]);
            setPayment(null);
          }}
        />
      )}
    </>
  );
}
