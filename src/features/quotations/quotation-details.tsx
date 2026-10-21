"use client";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";
import { useTravelStore } from "@/store";
import { quoteTotals } from "@/domain/quote";
import { money } from "@/domain/money";
import { categories, type Quotation, type QuoteLine } from "@/domain/types";
import { HeadBlock, DetailLayout, Sheet, KeyValues } from "@/components/blocks";
import { Field, EmptyState, notify } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { QuotationDocument } from "./quotation-document";
export function QuotationDetails() {
  const s = useTravelStore(),
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
  const line = (id: string, patch: Partial<QuoteLine>) =>
    update({
      lines: q.lines.map((l) => (l.id === id ? { ...l, ...patch } : l)),
    });
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
            { label: "Valid until", value: q.validUntil },
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
          <Sheet
            id="trip"
            title="Trip"
            note={locked ? "Accepted · read-only" : "Changes save as you type"}
          >
            <div className="form-grid">
              <Field label="Package">
                <select
                  aria-label="Package"
                  value={q.packageId ?? ""}
                  disabled={locked}
                  onChange={(e) => {
                    const p = s.packages.find((p) => p.id === e.target.value);
                    if (!p) {
                      update({
                        packageId: undefined,
                        itineraryDays: [],
                        lines: [],
                      });
                      return;
                    }
                    update({
                      packageId: p.id,
                      itineraryDays: p.itineraryDays,
                      inclusions: p.inclusions,
                      exclusions: p.exclusions,
                      lines: [
                        {
                          id: `${q.id}-pkg`,
                          category: "Other",
                          description: p.name,
                          supplierName: "Wanderlight Travel (fictional)",
                          costCentavos: Math.round(
                            p.basePricePerPaxCentavos / 1.1,
                          ),
                          basis: "per_pax",
                        },
                      ],
                    });
                  }}
                >
                  <option value="">Custom trip</option>
                  {s.packages.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Travelers">
                <Input
                  type="number"
                  min="1"
                  max="100"
                  value={q.paxCount}
                  disabled={locked}
                  onChange={(e) => update({ paxCount: Number(e.target.value) })}
                />
              </Field>
              <Field label="Departure">
                <Input
                  type="date"
                  value={q.departDate}
                  disabled={locked}
                  onChange={(e) => update({ departDate: e.target.value })}
                />
              </Field>
              <Field label="Return">
                <Input
                  type="date"
                  value={q.returnDate}
                  disabled={locked}
                  onChange={(e) => update({ returnDate: e.target.value })}
                />
              </Field>
              <Field label="Valid until">
                <Input
                  type="date"
                  value={q.validUntil}
                  disabled={locked}
                  onChange={(e) => update({ validUntil: e.target.value })}
                />
              </Field>
              <Field label="Handled by">
                <select
                  disabled={locked}
                  value={
                    q.assignedAgentId ??
                    s.leads.find((l) => l.id === q.leadId)?.assignedAgentId
                  }
                  onChange={(e) => update({ assignedAgentId: e.target.value })}
                >
                  {s.agents.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
          </Sheet>
          <Sheet
            id="services"
            title="Services"
            note="Costs and suppliers are staff only"
            action={
              <Button
                variant="outline"
                disabled={locked}
                onClick={() =>
                  update({
                    lines: [
                      ...q.lines,
                      {
                        id: `${q.id}-line-${q.version}`,
                        category: "Other",
                        description: "New service",
                        supplierName: "Fictional supplier",
                        costCentavos: 0,
                        basis: "per_pax",
                      },
                    ],
                  })
                }
              >
                + Add service
              </Button>
            }
          >
            <div className="table-wrap">
              <table className="t quote-services-editor">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>What</th>
                    <th>Supplier</th>
                    <th>Cost (PHP)</th>
                    <th>Charged</th>
                    <th>Total</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {q.lines.map((l, i) => (
                    <tr key={l.id}>
                      <td>
                        <select
                          aria-label={`Line ${i + 1} category`}
                          disabled={locked}
                          value={l.category}
                          onChange={(e) =>
                            line(l.id, {
                              category: e.target.value as QuoteLine["category"],
                            })
                          }
                        >
                          {categories.map((c) => (
                            <option key={c}>{c}</option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <Input
                          aria-label={`Line ${i + 1} description`}
                          disabled={locked}
                          value={l.description}
                          onChange={(e) =>
                            line(l.id, { description: e.target.value })
                          }
                        />
                      </td>
                      <td>
                        <Input
                          aria-label={`Line ${i + 1} supplier`}
                          disabled={locked}
                          value={l.supplierName}
                          onChange={(e) =>
                            line(l.id, { supplierName: e.target.value })
                          }
                        />
                      </td>
                      <td>
                        <Input
                          aria-label={`Line ${i + 1} cost`}
                          type="number"
                          min="0"
                          step=".01"
                          disabled={locked}
                          value={l.costCentavos / 100}
                          onChange={(e) =>
                            line(l.id, {
                              costCentavos: Math.round(
                                Number(e.target.value) * 100,
                              ),
                            })
                          }
                        />
                      </td>
                      <td>
                        <select
                          aria-label={`Line ${i + 1} basis`}
                          value={l.basis}
                          disabled={locked}
                          onChange={(e) =>
                            line(l.id, {
                              basis: e.target.value as QuoteLine["basis"],
                            })
                          }
                        >
                          <option value="per_pax">Per person</option>
                          <option value="per_group">Once</option>
                        </select>
                      </td>
                      <td>
                        {money(
                          l.costCentavos *
                            (l.basis === "per_pax" ? q.paxCount : 1),
                        )}
                      </td>
                      <td>
                        <Button
                          aria-label={`Remove line ${i + 1}`}
                          variant="ghost"
                          disabled={locked}
                          onClick={() =>
                            update({
                              lines: q.lines.filter((x) => x.id !== l.id),
                            })
                          }
                        >
                          ×
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={5}>Our cost</td>
                    <td>{money(t.netCost)}</td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          </Sheet>
          <Sheet id="price" title="Price">
            <div className="form-grid">
              <div className="section-stack">
                <Field label="Markup (%)">
                  <Input
                    type="number"
                    min="0"
                    value={q.markupPct}
                    disabled={locked}
                    onChange={(e) =>
                      update({ markupPct: Number(e.target.value) })
                    }
                  />
                </Field>
                <div className="filters">
                  {[8, 10, 12, 15].map((v) => (
                    <button
                      key={v}
                      className="chip wait"
                      disabled={locked}
                      onClick={() => update({ markupPct: v })}
                    >
                      {v}%
                    </button>
                  ))}
                </div>
                <Field label="Discount (PHP)">
                  <Input
                    type="number"
                    min="0"
                    value={q.discountCentavos / 100}
                    disabled={locked}
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
                    { label: "Our cost", value: money(t.netCost) },
                    {
                      label: `Markup ${q.markupPct}%`,
                      value: money(t.selling + q.discountCentavos - t.netCost),
                    },
                    { label: "Discount", value: money(q.discountCentavos) },
                    { label: "Customer pays", value: money(t.selling) },
                    { label: "Per person", value: money(t.perPax) },
                    {
                      label: "Deposit (30%)",
                      value: money(Math.round(t.selling * 0.3)),
                    },
                  ]}
                />
                <p className="staff-only positive-text">
                  Our profit: {money(t.grossProfit)}
                </p>
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
              Created {q.createdAt} · Current version {q.version}
            </p>
            <ul className="timeline">
              {(q.editHistory ?? [])
                .slice()
                .reverse()
                .map((h) => (
                  <li key={h.version}>
                    <time>{format(parseISO(h.at), "d MMM, h:mm a")}</time>
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
