"use client";
import Link from "next/link";
import { useTravelStore } from "@/store";
import { displayDate } from "@/domain/dates";
import { money } from "@/domain/money";
import { quoteTotals } from "@/domain/quote";
import { bookingLabel } from "@/domain/labels";
import { bookingStatuses, type Booking } from "@/domain/types";
import { Sheet, KeyValues, StatusChip } from "@/components/blocks";
import { notify } from "@/components/shared";
export function BookingOverview({ booking: b }: { booking: Booking }) {
  const s = useTravelStore(),
    q = b.quotationSnapshot,
    t = quoteTotals(q);
  const customer = s.customers.find((c) => c.id === b.customerId),
    pkg = s.packages.find((p) => p.id === q.packageId);
  return (
    <Sheet
      id="overview"
      title="Overview"
      action={<StatusChip>{bookingLabel(b.status)}</StatusChip>}
    >
      <KeyValues
        items={[
          {
            label: "Customer",
            value: (
              <Link
                href={`/customers/view?id=${b.customerId}`}
                className="linkish"
              >
                {customer?.name}
              </Link>
            ),
          },
          {
            label: "Handled by",
            value: s.agents.find((a) => a.id === b.assignedAgentId)?.name,
          },
          { label: "Came from", value: customer?.source },
          { label: "Package", value: pkg?.name ?? "Custom trip" },
          { label: "Booked", value: displayDate(b.createdAt) },
          {
            label: "From quote",
            value: (
              <Link className="linkish" href={`/quotations/view?id=${q.id}`}>
                {q.ref} · v{q.version}
              </Link>
            ),
          },
        ]}
      />
      <div className="form-grid new-section">
        <label className="field">
          <span>Booking status</span>
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
        </label>
        <label className="field">
          <span>Assigned agent</span>
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
        </label>
      </div>
      <div className="staff-only new-section">
        <h3>
          Price breakdown <small>Locked when the quote was accepted</small>
        </h3>
        <div className="table-wrap">
          <table className="t">
            <thead>
              <tr>
                <th>Item</th>
                <th>Supplier</th>
                <th>Cost</th>
                <th>Charged</th>
                <th>Line total</th>
              </tr>
            </thead>
            <tbody>
              {q.lines.map((l) => (
                <tr key={l.id}>
                  <td>{l.description}</td>
                  <td>{l.supplierName}</td>
                  <td>{money(l.costCentavos)}</td>
                  <td>
                    {l.basis === "per_pax"
                      ? `Per person × ${q.paxCount}`
                      : "Once per group"}
                  </td>
                  <td>
                    {money(
                      l.costCentavos * (l.basis === "per_pax" ? q.paxCount : 1),
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={4}>Our cost</td>
                <td>{money(t.netCost)}</td>
              </tr>
              <tr>
                <td colSpan={4}>
                  Customer pays · {money(t.perPax)} per person
                </td>
                <td>{money(t.selling)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
        <p>
          Markup {money(t.markup)} · Discount {money(q.discountCentavos)} ·
          Profit {money(t.grossProfit)}
        </p>
      </div>
    </Sheet>
  );
}
