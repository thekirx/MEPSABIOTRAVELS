"use client";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { addDays, format, parseISO } from "date-fns";
import { useTravelStore } from "@/store";
import { destination } from "@/store/selectors";
import { destinationCity } from "@/domain/places";
import { quoteTotals, hasInsurance } from "@/domain/quote";
import { money } from "@/domain/money";
import type { Payment } from "@/domain/types";
import { Button } from "@/components/ui/button";

const payOptions: { method: Payment["method"]; label: string; note: string }[] =
  [
    { method: "GCash", label: "GCash", note: "Pay from your GCash wallet" },
    { method: "Maya", label: "Maya", note: "Pay from your Maya wallet" },
    {
      method: "Card (manual)",
      label: "Credit or debit card",
      note: "Visa, Mastercard",
    },
    {
      method: "Bank Transfer",
      label: "Online bank transfer",
      note: "BPI, BDO, UnionBank and more",
    },
  ];

const long = (d: string) => format(parseISO(d), "EEE d MMM yyyy");

/** What the client sees when they open the link in their quote email. */
export function ClientApproval() {
  const s = useTravelStore(),
    params = useSearchParams();
  const q = s.quotations.find((x) => x.id === params.get("id"));
  const [step, setStep] = useState<"review" | "pay" | "paying">("review"),
    [method, setMethod] = useState<Payment["method"]>("GCash"),
    [agree, setAgree] = useState(false),
    [error, setError] = useState(""),
    [ask, setAsk] = useState(false);

  if (!q)
    return (
      <section className="client-card client-center">
        <h1>This link isn&apos;t valid</h1>
        <p>Please use the link in your quotation email, or contact us.</p>
      </section>
    );

  const customer = s.customers.find((c) => c.id === q.customerId),
    first = customer?.name.split(" ")[0] ?? "there",
    agentId =
      q.assignedAgentId ??
      s.leads.find((l) => l.id === q.leadId)?.assignedAgentId,
    agent = s.agents.find((a) => a.id === agentId),
    city = destinationCity(destination(s, q)),
    pkg = s.packages.find((p) => p.id === q.packageId),
    t = quoteTotals(q),
    booking = s.bookings.find((b) => b.quotationId === q.id);

  if (booking) {
    const paid = s.payments.filter((p) => p.bookingId === booking.id);
    const online = q.clientApprovedAt
      ? paid.find((p) => p.note?.includes("online"))
      : undefined;
    return (
      <section className="client-card client-center" aria-live="polite">
        <p className="client-check" aria-hidden="true">
          ✓
        </p>
        <h1>{online ? `You're booked, ${first}!` : "This trip is booked"}</h1>
        <p>
          {city} · {long(q.departDate)} to {long(q.returnDate)} · {q.paxCount}{" "}
          people
        </p>
        <dl className="client-facts">
          <div>
            <dt>Booking reference</dt>
            <dd>{booking.ref}</dd>
          </div>
          {online && (
            <>
              <div>
                <dt>Deposit paid</dt>
                <dd>
                  {money(online.amountCentavos)} · {online.method}
                </dd>
              </div>
              <div>
                <dt>Receipt</dt>
                <dd>{online.receiptNo}</dd>
              </div>
            </>
          )}
        </dl>
        <div className="client-next">
          <h2>What happens next</h2>
          <ol>
            <li>We issue your plane tickets and confirm your hotel.</li>
            <li>
              We email you to collect each traveler&apos;s passport details.
            </li>
            <li>
              The balance is due by{" "}
              {long(format(addDays(parseISO(q.departDate), -30), "yyyy-MM-dd"))}
              .
            </li>
          </ol>
        </div>
        <p className="client-small">
          Questions? {agent?.name ?? "Our team"} · reservations@meptravel.com
        </p>
      </section>
    );
  }

  const expired =
    q.status === "Expired" ||
    q.status === "Declined" ||
    q.validUntil < format(new Date(), "yyyy-MM-dd");
  if (expired)
    return (
      <section className="client-card client-center">
        <h1>This quotation has expired</h1>
        <p>
          Fares change quickly. Reply to our email or contact{" "}
          {agent?.name ?? "us"} at reservations@meptravel.com for an updated
          quote.
        </p>
      </section>
    );

  // Inclusions not already listed under "What's included".
  const listed = new Set(q.lines.map((l) => l.description.toLowerCase()));
  const extras = (q.inclusions ?? pkg?.inclusions ?? []).filter(
    (v) => v.trim() && !listed.has(v.trim().toLowerCase()),
  );
  const deposit = Math.round(t.selling * 0.3),
    balanceDue = format(addDays(parseISO(q.departDate), -30), "yyyy-MM-dd"),
    shots = q.flightScreenshots ?? [];

  const pay = () => {
    setError("");
    setStep("paying");
    // A short pause stands in for the payment provider's screen.
    window.setTimeout(() => {
      try {
        s.approveOnline(q.id, method);
        window.scrollTo({ top: 0 });
      } catch (e) {
        setError((e as Error).message);
        setStep("pay");
      }
    }, 1200);
  };

  return (
    <div className="client-layout">
      <article className="client-card">
        <p className="client-eyebrow">
          Quotation {q.ref} · for {customer?.name}
        </p>
        <h1>
          Hi {first}, here&apos;s your {city} trip
        </h1>
        <p className="client-sub">
          {long(q.departDate)} to {long(q.returnDate)} · {q.paxCount}{" "}
          {q.paxCount === 1 ? "person" : "people"}
          {pkg ? ` · ${pkg.name}` : ""}
        </p>

        {(q.flightDetails?.trim() || shots.length > 0) && (
          <section className="client-flights">
            <h2>
              Your flights <small>Not yet ticketed · fares may change</small>
            </h2>
            {q.flightDetails?.trim() && (
              <p className="doc-flight-text">{q.flightDetails.trim()}</p>
            )}
            {shots.map((src, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={i} src={src} alt={`Flight details ${i + 1}`} />
            ))}
          </section>
        )}

        <section>
          <h2>What&apos;s included</h2>
          <ul className="client-list">
            {q.lines.map((l) => (
              <li key={l.id}>{l.description}</li>
            ))}
          </ul>
        </section>
        <div className="client-two">
          {extras.length > 0 && (
            <section>
              <h3>Also included</h3>
              <ul className="client-list small">
                {extras.map((v, i) => (
                  <li key={i}>{v}</li>
                ))}
              </ul>
            </section>
          )}
          <section>
            <h3>Not included</h3>
            <ul className="client-list small muted">
              {(q.exclusions ?? pkg?.exclusions ?? ["Personal expenses"]).map(
                (v, i) => (
                  <li key={i}>{v}</li>
                ),
              )}
            </ul>
          </section>
        </div>
        {q.itineraryDays.length > 0 && (
          <details className="client-itinerary">
            <summary>Day-by-day plan ({q.itineraryDays.length} days)</summary>
            {q.itineraryDays.map((d, i) => (
              <p key={i}>
                <b>Day {i + 1}</b> {d}
              </p>
            ))}
          </details>
        )}
      </article>

      <aside className="client-pay" aria-label="Price and approval">
        <div className="client-price">
          <span>Total for {q.paxCount}</span>
          <b data-testid="client-total">{money(t.selling)}</b>
          <span>{money(t.perPax)} per person</span>
          {hasInsurance(q) && (
            <p className="client-ins">✓ Travel insurance included</p>
          )}
        </div>
        <dl className="client-facts">
          <div>
            <dt>Deposit today (30%)</dt>
            <dd>{money(deposit)}</dd>
          </div>
          <div>
            <dt>Balance due by</dt>
            <dd>{long(balanceDue)}</dd>
          </div>
          <div>
            <dt>Price valid until</dt>
            <dd>{long(q.validUntil)}</dd>
          </div>
        </dl>

        {step === "review" && (
          <div className="client-actions">
            <Button className="client-main-btn" onClick={() => setStep("pay")}>
              Approve &amp; pay {money(deposit)} deposit
            </Button>
            <Button variant="outline" onClick={() => setAsk(!ask)}>
              Ask {agent?.name.split(" ")[0] ?? "us"} a question
            </Button>
            {ask && (
              <p className="client-small">
                Reply to your quotation email, or write to{" "}
                <b>reservations@meptravel.com</b>. {agent?.name ?? "Our team"}{" "}
                is handling your trip.
              </p>
            )}
          </div>
        )}

        {step !== "review" && (
          <form
            className="client-actions"
            onSubmit={(e) => {
              e.preventDefault();
              if (!agree) {
                setError("Please confirm you've read the trip details.");
                return;
              }
              pay();
            }}
          >
            <fieldset className="pay-methods" disabled={step === "paying"}>
              <legend>How would you like to pay?</legend>
              {payOptions.map((o) => (
                <label key={o.method} className="pay-option">
                  <input
                    type="radio"
                    name="method"
                    value={o.method}
                    checked={method === o.method}
                    onChange={() => setMethod(o.method)}
                  />
                  <span>
                    <b>{o.label}</b>
                    <small>{o.note}</small>
                  </span>
                </label>
              ))}
            </fieldset>
            <label className="agree">
              <input
                type="checkbox"
                checked={agree}
                disabled={step === "paying"}
                onChange={(e) => {
                  setAgree(e.target.checked);
                  setError("");
                }}
              />
              <span>
                I&apos;ve read the flights, inclusions and payment terms, and I
                approve this quotation.
              </span>
            </label>
            {error && (
              <p className="danger-text" role="alert">
                {error}
              </p>
            )}
            <Button
              type="submit"
              className="client-main-btn"
              disabled={step === "paying"}
            >
              {step === "paying"
                ? "Processing payment…"
                : `Pay ${money(deposit)} (demo)`}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={step === "paying"}
              onClick={() => {
                setStep("review");
                setError("");
              }}
            >
              Back
            </Button>
            <p className="client-small">
              Demo only. No money is charged. In the real portal this opens the
              secure payment page.
            </p>
          </form>
        )}
      </aside>
      {step === "review" && (
        <div className="client-sticky">
          <span>
            <b>{money(t.selling)}</b>
            <small>Deposit {money(deposit)}</small>
          </span>
          <Button
            className="client-main-btn"
            onClick={() => {
              setStep("pay");
              window.requestAnimationFrame(() =>
                document
                  .querySelector(".client-pay")
                  ?.scrollIntoView({ behavior: "smooth", block: "start" }),
              );
            }}
          >
            Approve &amp; pay
          </Button>
        </div>
      )}
    </div>
  );
}
