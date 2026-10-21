"use client";
import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { useTravelStore } from "@/store";
import { destination } from "@/store/selectors";
import { destinationCity } from "@/domain/places";
import { quoteTotals } from "@/domain/quote";
import { money } from "@/domain/money";
import { Block, BigNumber } from "@/components/blocks";
import { Modal, Field, EmptyState, notify } from "@/components/shared";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { QuotationDocument } from "./quotation-document";
export function QuotationBuilder() {
  const s = useTravelStore(),
    params = useSearchParams(),
    router = useRouter();
  const [confirm, setConfirm] = useState(false),
    [other, setOther] = useState(false),
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
      () => s.updateQuotation(q.id, { markupPct: v }),
      "Price updated locally",
    );
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
        <Link href={`/quotations/edit?id=${q.id}#included`}>
          ✓ 2 · What&apos;s included
        </Link>
        <span aria-current="step">3 · The price</span>
        <Link
          className="edit-every-detail"
          href={`/quotations/edit?id=${q.id}`}
        >
          Edit every detail →
        </Link>
      </nav>
      <div className="quote-front">
        <div className="section-stack no-print">
          <Block
            variant="white"
            className="ask staff-only"
            title="How much do we add on top?"
          >
            <p>
              {locked
                ? "This quote was accepted, so the price is locked."
                : `The trip costs us ${money(t.netCost)}. ${first} never sees this.`}
            </p>
            <div
              className="markup-options"
              role="radiogroup"
              aria-label="Markup"
            >
              {[8, 10, 12, 15].map((v) => (
                <button
                  key={v}
                  role="radio"
                  aria-checked={q.markupPct === v}
                  disabled={locked}
                  onClick={() => setMarkup(v)}
                >
                  {v}%
                </button>
              ))}
            </div>
            <div className="custom-markup">
              <button
                className="linkish"
                disabled={locked}
                onClick={() => setOther(!other)}
              >
                Other…
              </button>
              {other && (
                <Field label="Markup (%)">
                  <Input
                    aria-label="Markup (%)"
                    type="number"
                    min="0"
                    step="0.1"
                    value={q.markupPct}
                    disabled={locked}
                    onChange={(e) => setMarkup(Number(e.target.value))}
                  />
                </Field>
              )}
            </div>
            {other && (
              <p className="muted">
                Use the markup field for any positive percentage.
              </p>
            )}
          </Block>
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
              <span>
                We earn<b>{money(t.grossProfit)}</b>
              </span>
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
              variant="outline"
              disabled={locked}
              onClick={() =>
                notify(
                  () => s.markQuotationSent(q.id),
                  "Quote marked as sent (demo)",
                )
              }
            >
              Mark as Sent
            </Button>
            <Button variant="outline" onClick={() => window.print()}>
              Print / Save as PDF
            </Button>
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
          {!customerView && (
            <p className="staff-only margin-panel">
              Staff net cost {money(t.netCost)} · Profit {money(t.grossProfit)}
            </p>
          )}
        </aside>
      </div>
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
