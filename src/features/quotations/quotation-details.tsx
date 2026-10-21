"use client";
import { displayDate } from "@/domain/dates";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { useTravelStore } from "@/store";
import { quoteTotals, markupPerPax } from "@/domain/quote";
import { money } from "@/domain/money";
import { type Quotation } from "@/domain/types";
import { HeadBlock, DetailLayout, Sheet, KeyValues } from "@/components/blocks";
import { Field, EmptyState, notify } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { QuoteTripSection, QuoteServicesSection } from "./quotation-sections";
import { QuotationDocument } from "./quotation-document";
import { QuoteFlightsSection } from "./quote-flights";
import { MarkupPicker } from "./markup-picker";
import { useMe } from "@/store/use-me";
export function QuotationDetails() {
  const s = useTravelStore(),
    { canPrice, canSeeMargins } = useMe(),
    params = useSearchParams();
  const q = s.quotations.find((q) => q.id === params.get("id"));
  if (!q) return <EmptyState text="Quotation not found." />;
  const locked = q.status === "Accepted",
    customer = s.customers.find((c) => c.id === q.customerId),
    pkg = s.packages.find((p) => p.id === q.packageId),
    t = quoteTotals(q);
  const update = (patch: Partial<Quotation>) => {
    try {
      s.updateQuotation(q.id, patch);
    } catch (e) {
      toast.error((e as Error).message);
    }
  };
  return (
    <>
      <Link href={`/quotations/view?id=${q.id}`} className="back no-print">
        ← Quote summary
      </Link>
      <div className="no-print">
        <HeadBlock
          tag={`Quote · ${q.ref} · Version ${q.version}`}
          title={`${pkg?.name ?? "Custom trip"} for ${customer?.name}`}
          facts={[
            { label: "Status", value: q.status },
            { label: "Valid until", value: displayDate(q.validUntil) },
            { label: "Travelers", value: `${q.paxCount} people` },
            { label: "Customer pays", value: money(t.selling) },
          ]}
          action={
            <>
              <Link
                className="btn ghost small"
                href={`/quotations/view?id=${q.id}`}
              >
                See customer copy
              </Link>
              <Button
                disabled={locked}
                onClick={() => toast.success("Quotation saved locally")}
              >
                Save
              </Button>
            </>
          }
        />
      </div>
      <div className="no-print">
        <DetailLayout
          sections={[
            { id: "trip", label: "Trip" },
            {
              id: "flights",
              label: "Flights",
              count: q.flightScreenshots?.length,
            },
            { id: "services", label: "Services", count: q.lines.length },
            { id: "price", label: "Price" },
            {
              id: "itinerary",
              label: "Itinerary",
              count: q.itineraryDays.length,
            },
            { id: "included", label: "Included" },
            { id: "terms", label: "Terms" },
            { id: "versions", label: "Versions" },
          ]}
        >
          <QuoteTripSection q={q} locked={locked} update={update} />
          <QuoteFlightsSection q={q} locked={locked} update={update} />
          <QuoteServicesSection q={q} locked={locked} update={update} />
          <Sheet id="price" title="Price">
            <div className="form-grid">
              <div className="section-stack">
                {canSeeMargins && (
                  <Field label="Markup per person">
                    <MarkupPicker
                      q={q}
                      locked={locked || !canPrice}
                      onChange={(v) => update({ markupPerPaxCentavos: v })}
                    />
                  </Field>
                )}
                <Field label="Discount (PHP)">
                  <Input
                    type="number"
                    min="0"
                    value={q.discountCentavos / 100}
                    disabled={locked || !canPrice}
                    onChange={(e) =>
                      update({
                        discountCentavos: Math.round(
                          Number(e.target.value) * 100,
                        ),
                      })
                    }
                  />
                </Field>
                <Field label="Payment plan">
                  <Input
                    readOnly
                    value="30% deposit; balance 30 days before departure"
                  />
                </Field>
              </div>
              <div className="quote-price-summary">
                <KeyValues
                  items={[
                    ...(canSeeMargins
                      ? [
                          { label: "Our cost", value: money(t.netCost) },
                          {
                            label: `Markup (${money(markupPerPax(q))} × ${q.paxCount})`,
                            value: money(t.markup),
                          },
                        ]
                      : []),
                    { label: "Discount", value: money(q.discountCentavos) },
                    { label: "Customer pays", value: money(t.selling) },
                    { label: "Per person", value: money(t.perPax) },
                    {
                      label: "Deposit (30%)",
                      value: money(Math.round(t.selling * 0.3)),
                    },
                  ]}
                />
                {canSeeMargins && (
                  <p className="staff-only positive-text">
                    Our profit: {money(t.grossProfit)}
                  </p>
                )}
              </div>
            </div>
          </Sheet>
          <Sheet id="itinerary" title="Itinerary">
            <div className="section-stack">
              {q.itineraryDays.map((day, i) => (
                <Field key={i} label={`Day ${i + 1}`}>
                  <Input
                    value={day}
                    disabled={locked}
                    onChange={(e) =>
                      update({
                        itineraryDays: q.itineraryDays.map((v, j) =>
                          i === j ? e.target.value : v,
                        ),
                      })
                    }
                  />
                </Field>
              ))}
              <Button
                variant="outline"
                disabled={locked}
                onClick={() =>
                  update({ itineraryDays: [...q.itineraryDays, "New day"] })
                }
              >
                + Add day
              </Button>
            </div>
          </Sheet>
          <Sheet id="included" title="Included and not included">
            <div className="form-grid">
              <Field label="Included — one item per line">
                <textarea
                  disabled={locked}
                  rows={6}
                  value={(q.inclusions ?? pkg?.inclusions ?? []).join("\n")}
                  onChange={(e) =>
                    update({ inclusions: e.target.value.split("\n") })
                  }
                />
              </Field>
              <Field label="Not included — one item per line">
                <textarea
                  disabled={locked}
                  rows={6}
                  value={(q.exclusions ?? pkg?.exclusions ?? []).join("\n")}
                  onChange={(e) =>
                    update({ exclusions: e.target.value.split("\n") })
                  }
                />
              </Field>
            </div>
          </Sheet>
          <Sheet id="terms" title="Terms on the customer's copy">
            <Field label="Payment terms">
              <textarea
                disabled={locked}
                value={
                  q.terms ??
                  "30% deposit due within 3 days of acceptance. Balance due 30 days before departure."
                }
                onChange={(e) => update({ terms: e.target.value })}
              />
            </Field>
            <p className="subtle-note">
              Rates subject to availability until ticketed. Validity is always
              included in the customer document.
            </p>
          </Sheet>
          <Sheet id="versions" title="Versions and history">
            <p>
              Created {displayDate(q.createdAt)} · Current version {q.version}
            </p>
            <ul className="timeline">
              {(q.editHistory ?? [])
                .slice()
                .reverse()
                .map((h) => (
                  <li key={h.version}>
                    <time>{displayDate(h.at, "EEE d MMM, h:mm a")}</time>
                    <span>
                      Version {h.version} · {h.summary}
                    </span>
                  </li>
                ))}
            </ul>
            <div className="dialog-actions">
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
              <button className="btn" onClick={() => window.print()}>
                Print / Save as PDF
              </button>
            </div>
          </Sheet>
        </DetailLayout>
      </div>
      <div className="editor-print-copy">
        <QuotationDocument quote={q} />
      </div>
    </>
  );
}
