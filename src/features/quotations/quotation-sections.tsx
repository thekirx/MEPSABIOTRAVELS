"use client";
import { useTravelStore } from "@/store";
import { quoteTotals, insuranceLine } from "@/domain/quote";
import { money } from "@/domain/money";
import { categories, type Quotation, type QuoteLine } from "@/domain/types";
import { Sheet } from "@/components/blocks";
import { Field } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
type Props = {
  q: Quotation;
  locked: boolean;
  update: (patch: Partial<Quotation>) => void;
};
export function QuoteTripSection({ q, locked, update }: Props) {
  const s = useTravelStore();
  return (
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
              // Insurance stays on every trip, whatever the package.
              const insurance = q.lines.filter(
                (l) => l.category === "Insurance",
              );
              if (!insurance.length)
                insurance.push(insuranceLine(`${q.id}-ins-${q.version}`));
              if (!p) {
                update({
                  packageId: undefined,
                  itineraryDays: [],
                  lines: insurance,
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
                    costCentavos: Math.round(p.basePricePerPaxCentavos / 1.1),
                    basis: "per_pax",
                  },
                  ...insurance,
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
  );
}
export function QuoteServicesSection({ q, locked, update }: Props) {
  const t = quoteTotals(q);
  const line = (id: string, patch: Partial<QuoteLine>) =>
    update({
      lines: q.lines.map((l) => (l.id === id ? { ...l, ...patch } : l)),
    });
  return (
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
                        costCentavos: Math.round(Number(e.target.value) * 100),
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
                    l.costCentavos * (l.basis === "per_pax" ? q.paxCount : 1),
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
  );
}
