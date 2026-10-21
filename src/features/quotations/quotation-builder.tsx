"use client";
import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { useTravelStore } from "@/store";
import { destination } from "@/store/selectors";
import { destinationCity } from "@/domain/places";
import {
  quoteTotals,
  hasInsurance,
  insuranceLine,
  defaultInsuranceCentavos,
} from "@/domain/quote";
import { money } from "@/domain/money";
import { Block, BigNumber } from "@/components/blocks";
import { Modal, EmptyState, notify } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { QuotationDocument } from "./quotation-document";
import { MarkupPicker } from "./markup-picker";
import { EmailApprovalDialog } from "./email-approval";
import { useMe } from "@/store/use-me";
export function QuotationBuilder() {
  const s = useTravelStore(),
    { canPrice, canSeeMargins } = useMe(),
    params = useSearchParams(),
    router = useRouter();
  const [confirm, setConfirm] = useState(false),
    [email, setEmail] = useState(false),
    [customerView, setCustomerView] = useState(true);
  const q = s.quotations.find((q) => q.id === params.get("id"));
  if (!q) return <EmptyState text="Quotation not found." />;
  const customer = s.customers.find((c) => c.id === q.customerId)!,
    first = customer.name.split(" ")[0],
    t = quoteTotals(q),
    locked = q.status === "Accepted",
    booking = s.bookings.find((b) => b.quotationId === q.id);
  const setMarkup = (v: number) =>
    notify(
      () => s.updateQuotation(q.id, { markupPerPaxCentavos: v }),
      "Price updated locally",
    );
  const hasFlights = !!(q.flightDetails?.trim() || q.flightScreenshots?.length);
  return (
    <>
      <Link className="back no-print" href="/inquiries">
        ← People asking
      </Link>
      <section className="hello no-print">
        <div>
          <h1>
            {first}&apos;s {destination(s, q)} trip
          </h1>
          <p>
            {destinationCity(destination(s, q))} · {q.paxCount} people ·{" "}
            {format(parseISO(q.departDate), "d MMM")} to{" "}
            {format(parseISO(q.returnDate), "d MMM")}
          </p>
        </div>
      </section>
      <nav className="quote-steps no-print" aria-label="Quote steps">
        <Link href={`/quotations/edit?id=${q.id}#trip`}>✓ 1 · The trip</Link>
        <Link href={`/quotations/edit?id=${q.id}#flights`}>
          {hasFlights ? "✓ 2 · Flights" : "2 · Add flights"}
        </Link>
        <Link href={`/quotations/edit?id=${q.id}#services`}>
          {hasInsurance(q) ? "✓" : ""} 3 · Services &amp; insurance
        </Link>
        <span aria-current="step">4 · Price &amp; send</span>
        <Link
          className="edit-every-detail"
          href={`/quotations/edit?id=${q.id}`}
        >
          Edit every detail →
        </Link>
      </nav>
      <div className="quote-front">
        <div className="section-stack no-print">
          {canSeeMargins ? (
            <Block
              variant="white"
              className="ask staff-only"
              title="How much do we add on top?"
            >
              <p>
                {locked
                  ? "This quote was accepted, so the price is locked."
                  : !canPrice
                    ? "Only Sales and the owner can change the price."
                    : `The trip costs us ${money(t.netCost)}. Add a fixed amount per person. ${first} never sees this.`}
              </p>
              <MarkupPicker
                q={q}
                locked={locked || !canPrice}
                onChange={setMarkup}
              />
              <p className="muted">
                Markup {money(t.markup)} in total for {q.paxCount}{" "}
                {q.paxCount === 1 ? "person" : "people"}.
              </p>
            </Block>
          ) : (
            <Block
              variant="white"
              className="staff-only"
              title="Price set by Sales"
            >
              <p>
                Only Sales and the owner can see costs and change the price.
              </p>
            </Block>
          )}
          {!locked && !hasInsurance(q) && (
            <Block
              variant="red"
              className="staff-only"
              title="No travel insurance yet"
              action={
                <Button
                  variant="outline"
                  disabled={!canPrice}
                  onClick={() =>
                    notify(
                      () =>
                        s.updateQuotation(q.id, {
                          lines: [
                            ...q.lines,
                            insuranceLine(`${q.id}-ins-${q.version}`),
                          ],
                        }),
                      "Travel insurance added",
                    )
                  }
                >
                  Add travel insurance
                </Button>
              }
            >
              <p>
                Every trip should include insurance. Adds{" "}
                {money(defaultInsuranceCentavos)} per person to our cost; edit
                it under Services.
              </p>
            </Block>
          )}
          <Block
            variant="lime"
            className="pays staff-only"
            tag={`${first} pays`}
          >
            <BigNumber value={t.selling} />
            <div className="price-facts">
              <span>
                Each person<b>{money(t.perPax)}</b>
              </span>
              {canSeeMargins && (
                <span>
                  We earn<b>{money(t.grossProfit)}</b>
                </span>
              )}
            </div>
          </Block>
          <Block
            variant="char"
            className="yes"
            title={
              locked ? `✓ Booked · ${first} said yes` : `Did ${first} say yes?`
            }
            action={
              locked ? (
                <Link
                  className="btn lime"
                  href={`/bookings/view?id=${booking?.id}`}
                >
                  Open trip
                </Link>
              ) : (
                <Button
                  aria-label="Accept & convert to booking"
                  disabled={!q.lines.length || t.selling <= 0}
                  onClick={() => setConfirm(true)}
                >
                  Yes, book it
                </Button>
              )
            }
          >
            <p>
              {locked
                ? `Price locked at ${money(t.selling)}.`
                : "We'll book the trip and lock this price."}
            </p>
          </Block>
          <div className="quote-front-tools">
            <Button
              variant="outline"
              disabled={locked}
              onClick={() => toast.success("Quotation saved locally")}
            >
              Save
            </Button>
            <Button
              disabled={locked || t.selling <= 0}
              onClick={() => setEmail(true)}
            >
              Email {first} for approval
            </Button>
            <Button variant="outline" onClick={() => window.print()}>
              Print / Save as PDF
            </Button>
            {!locked && (
              <Link
                className="btn ghost"
                href={`/approve?id=${q.id}`}
                target="_blank"
                rel="noopener"
              >
                Preview client page ↗
              </Link>
            )}
          </div>
        </div>
        <aside className="quote-copy">
          <div className="copy-label no-print">
            What {first} gets{" "}
            <label>
              <input
                type="checkbox"
                checked={customerView}
                onChange={(e) => setCustomerView(e.target.checked)}
              />
              Customer view
            </label>
          </div>
          <QuotationDocument quote={q} />
          {!customerView && canSeeMargins && (
            <p className="staff-only margin-panel">
              Staff net cost {money(t.netCost)} · Profit {money(t.grossProfit)}
            </p>
          )}
        </aside>
      </div>
      {email && (
        <EmailApprovalDialog q={q} open={email} onOpenChange={setEmail} />
      )}
      <Modal
        open={confirm}
        onOpenChange={setConfirm}
        title={`Book ${first}'s trip?`}
        description={`The price locks at ${money(t.selling)} and a demo booking is created with ${q.paxCount} travelers, supplier requests, and a 30% deposit plan.`}
      >
        <div className="dialog-actions">
          <Button variant="outline" onClick={() => setConfirm(false)}>
            Not yet
          </Button>
          <Button
            onClick={() =>
              notify(() => {
                const id = s.acceptQuotation(q.id);
                router.push(`/bookings/view?id=${id}`);
              }, "Demo booking created. Price locked.")
            }
          >
            Yes, book it
          </Button>
        </div>
      </Modal>
    </>
  );
}
