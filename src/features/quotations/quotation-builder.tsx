"use client";
import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Printer,
  Check,
  Send,
  Compass,
  Lock,
  Eye,
  Save,
} from "lucide-react";
import { useTravelStore } from "@/store";
import { quoteTotals } from "@/domain/quote";
import { money, centavos } from "@/domain/money";
import { categories, type Quotation, type QuoteLine } from "@/domain/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  PageHeader,
  StatusBadge,
  Field,
  EmptyState,
  notify,
} from "@/components/shared";
import { toast } from "sonner";
export function QuotationBuilder() {
  const params = useSearchParams(),
    s = useTravelStore(),
    router = useRouter();
  const q = s.quotations.find((q) => q.id === params.get("id"));
  const [customerView, setCustomerView] = useState(true);
  if (!q)
    return (
      <EmptyState text="Quotation not found. Open a quotation from the list." />
    );
  const readOnly = q.status === "Accepted",
    totals = quoteTotals(q),
    customer = s.customers.find((c) => c.id === q.customerId),
    pkg = s.packages.find((p) => p.id === q.packageId);
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
      <Link href="/quotations" className="back-link no-print">
        <ArrowLeft size={14} />
        All quotations
      </Link>
      <PageHeader
        title={q.ref}
        description={`${customer?.name} · ${q.paxCount} travelers · Version ${q.version}`}
        action={
          <>
            <StatusBadge status={q.status} />
            <Button variant="outline" onClick={() => window.print()}>
              <Printer />
              Print / Save as PDF
            </Button>
          </>
        }
      />
      {readOnly && (
        <div className="accepted-banner no-print">
          <Lock size={16} /> Accepted quotation · This snapshot is read-only.
          <Link
            href={`/bookings/view?id=${s.bookings.find((b) => b.quotationId === q.id)?.id}`}
            className="text-link"
          >
            Open booking →
          </Link>
        </div>
      )}
      <div className="quote-layout">
        <div className="section-stack quote-editor no-print">
          <section className="panel">
            <div className="panel-header">
              <h2>Trip details</h2>
              <span className="step-label">01</span>
            </div>
            <div className="panel-body form-grid">
              <Field label="Start from a package">
                <select
                  aria-label="Package"
                  disabled={readOnly}
                  value={q.packageId ?? ""}
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
                    const base = Math.round(p.basePricePerPaxCentavos / 1.1);
                    update({
                      packageId: p.id,
                      itineraryDays: p.itineraryDays,
                      lines: [
                        {
                          id: `${q.id}-package`,
                          category: "Other",
                          description: p.name,
                          supplierName: "Wanderlight Travel (fictional)",
                          costCentavos: base,
                          basis: "per_pax",
                        },
                      ],
                    });
                  }}
                >
                  <option value="">Blank / custom trip</option>
                  {s.packages.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Travelers">
                <Input
                  aria-label="Travelers"
                  type="number"
                  min="1"
                  max="100"
                  value={q.paxCount}
                  disabled={readOnly}
                  onChange={(e) => update({ paxCount: Number(e.target.value) })}
                />
              </Field>
              <Field label="Departure">
                <Input
                  aria-label="Departure"
                  type="date"
                  value={q.departDate}
                  disabled={readOnly}
                  onChange={(e) => update({ departDate: e.target.value })}
                />
              </Field>
              <Field label="Return">
                <Input
                  aria-label="Return"
                  type="date"
                  value={q.returnDate}
                  disabled={readOnly}
                  onChange={(e) => update({ returnDate: e.target.value })}
                />
              </Field>
            </div>
          </section>
          <section className="panel">
            <div className="panel-header">
              <h2>Build the experience</h2>
              <span className="step-label">02</span>
            </div>
            <div className="quote-lines">
              {q.lines.map((l, i) => (
                <div className="quote-line" key={l.id}>
                  <div className="line-heading">
                    <span className="line-num">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <select
                      aria-label={`Line ${i + 1} category`}
                      value={l.category}
                      disabled={readOnly}
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
                    {!readOnly && (
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Remove line ${i + 1}`}
                        onClick={() =>
                          update({
                            lines: q.lines.filter((x) => x.id !== l.id),
                          })
                        }
                      >
                        <Trash2 />
                      </Button>
                    )}
                  </div>
                  <Input
                    aria-label={`Line ${i + 1} description`}
                    value={l.description}
                    disabled={readOnly}
                    onChange={(e) =>
                      line(l.id, { description: e.target.value })
                    }
                  />
                  <Input
                    aria-label={`Line ${i + 1} supplier`}
                    value={l.supplierName}
                    disabled={readOnly}
                    onChange={(e) =>
                      line(l.id, { supplierName: e.target.value })
                    }
                  />
                  <div className="line-pricing">
                    <Field label="Cost (PHP)">
                      <Input
                        aria-label={`Line ${i + 1} cost`}
                        type="number"
                        min="0"
                        step="0.01"
                        value={l.costCentavos / 100}
                        disabled={readOnly}
                        onChange={(e) =>
                          line(l.id, { costCentavos: centavos(e.target.value) })
                        }
                      />
                    </Field>
                    <Field label="Basis">
                      <select
                        aria-label={`Line ${i + 1} basis`}
                        disabled={readOnly}
                        value={l.basis}
                        onChange={(e) =>
                          line(l.id, {
                            basis: e.target.value as QuoteLine["basis"],
                          })
                        }
                      >
                        <option value="per_pax">Per traveler</option>
                        <option value="per_group">Per group</option>
                      </select>
                    </Field>
                  </div>
                </div>
              ))}
            </div>
            {!readOnly && (
              <div className="panel-body">
                <Button
                  variant="outline"
                  className="w-full"
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
                  <Plus />
                  Add line item
                </Button>
              </div>
            )}
          </section>
          <section className="panel">
            <div className="panel-header">
              <h2>Pricing & validity</h2>
              <span className="step-label">03</span>
            </div>
            <div className="panel-body">
              <div className="form-grid">
                <Field label="Markup (%)">
                  <Input
                    aria-label="Markup (%)"
                    type="number"
                    min="0"
                    step="0.1"
                    value={q.markupPct}
                    disabled={readOnly}
                    onChange={(e) =>
                      update({ markupPct: Number(e.target.value) })
                    }
                  />
                </Field>
                <Field label="Discount (PHP)">
                  <Input
                    aria-label="Discount (PHP)"
                    type="number"
                    min="0"
                    value={q.discountCentavos / 100}
                    disabled={readOnly}
                    onChange={(e) =>
                      update({ discountCentavos: centavos(e.target.value) })
                    }
                  />
                </Field>
                <Field label="Valid until">
                  <Input
                    aria-label="Valid until"
                    type="date"
                    value={q.validUntil}
                    disabled={readOnly}
                    onChange={(e) => update({ validUntil: e.target.value })}
                  />
                </Field>
              </div>
              <div className="margin-panel staff-only">
                <div>
                  <span>Net supplier cost</span>
                  <strong>{money(totals.netCost)}</strong>
                </div>
                <div>
                  <span>Gross profit</span>
                  <strong className="positive-text">
                    {money(totals.grossProfit)}
                  </strong>
                </div>
                <p>Staff only · never included in customer printouts</p>
              </div>
            </div>
          </section>
          <section className="panel">
            <div className="panel-header">
              <h2>Day-by-day itinerary</h2>
            </div>
            <div className="panel-body">
              <Field label="One day per line">
                <textarea
                  aria-label="Day-by-day itinerary"
                  rows={8}
                  value={q.itineraryDays.join("\n")}
                  disabled={readOnly}
                  onChange={(e) =>
                    update({ itineraryDays: e.target.value.split("\n") })
                  }
                />
              </Field>
            </div>
          </section>
          <div className="quote-actions">
            <Button
              variant="outline"
              disabled={readOnly}
              onClick={() => toast.success("Quotation saved locally")}
            >
              <Save />
              Save
            </Button>
            <Button
              variant="outline"
              disabled={readOnly}
              onClick={() =>
                notify(
                  () => s.markQuotationSent(q.id),
                  "Quotation marked as sent (demo)",
                )
              }
            >
              <Send />
              Mark as Sent
            </Button>
            <Button
              disabled={readOnly || !q.lines.length}
              onClick={() =>
                notify(() => {
                  const id = s.acceptQuotation(q.id);
                  router.push(`/bookings/view?id=${id}`);
                }, "Demo booking created")
              }
            >
              <Check />
              Accept & convert to booking
            </Button>
          </div>
        </div>
        <div className="quote-preview-wrap">
          <div className="preview-toolbar no-print">
            <span>
              <Eye size={14} />
              Live document preview
            </span>
            <label>
              <input
                type="checkbox"
                checked={customerView}
                onChange={(e) => setCustomerView(e.target.checked)}
              />
              Customer view
            </label>
          </div>
          <article className="quote-document print-document">
            <div className="document-brand">
              <span>
                <Compass size={27} />
              </span>
              <div>
                <strong>{s.settings.agencyName}</strong>
                <small>Your next journey starts here.</small>
              </div>
              <span className="document-demo">DEMO</span>
            </div>
            <div className="document-rule" />
            <div className="document-title">
              <span>YOUR PERSONALIZED JOURNEY</span>
              <h2>{pkg?.name ?? "Your custom escape"}</h2>
              <p>Prepared for {customer?.name}</p>
            </div>
            <div className="trip-summary">
              <div>
                <small>TRAVEL DATES</small>
                <strong>
                  {q.departDate} — {q.returnDate}
                </strong>
              </div>
              <div>
                <small>TRAVELERS</small>
                <strong>{q.paxCount} guests</strong>
              </div>
            </div>
            <table className="preview-lines">
              <thead>
                <tr>
                  <th>Your experience</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {q.lines.map((l) => (
                  <tr key={l.id}>
                    <td>
                      <strong>{l.category}</strong>
                    </td>
                    <td>{l.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!customerView && (
              <div className="staff-only margin-panel">
                <div>
                  <span>Net cost</span>
                  {money(totals.netCost)}
                </div>
                <div>
                  <span>Markup {q.markupPct}% · Gross profit</span>
                  {money(totals.grossProfit)}
                </div>
              </div>
            )}
            <div className="price-box">
              <div>
                <span>Total trip investment</span>
                <strong data-testid="preview-total">
                  {money(totals.selling)}
                </strong>
              </div>
              <p>
                {money(totals.perPax)} per traveler{" "}
                <span>· Illustrative pricing</span>
              </p>
            </div>
            <section className="document-section">
              <h3>Your itinerary</h3>
              {q.itineraryDays.map((d, i) => (
                <div key={i} className="itinerary-day">
                  <span>{String(i + 1).padStart(2, "0")}</span>
                  <p>{d}</p>
                </div>
              ))}
            </section>
            <div className="document-columns">
              <section className="document-section">
                <h3>Included</h3>
                <ul>
                  {(pkg?.inclusions ?? ["Services listed above"]).map((t) => (
                    <li key={t}>{t}</li>
                  ))}
                </ul>
              </section>
              <section className="document-section">
                <h3>Not included</h3>
                <ul>
                  {(pkg?.exclusions ?? ["Personal expenses"]).map((t) => (
                    <li key={t}>{t}</li>
                  ))}
                </ul>
              </section>
            </div>
            <section className="document-terms">
              <strong>A few things to know</strong>
              <p>
                30% deposit due within 3 days of acceptance. Balance due 30 days
                before departure. Valid until {q.validUntil}.
              </p>
              <p>
                Rates subject to availability until ticketed. All services and
                payments in this demo are simulated.
              </p>
            </section>
            <div className="document-bottom">
              <span>
                {q.ref} · v{q.version}
              </span>
              <span>Prepared with Optrizo TravelOS</span>
            </div>
          </article>
        </div>
      </div>
    </>
  );
}
