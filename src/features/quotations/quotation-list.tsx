"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, ArrowUpRight, FileText } from "lucide-react";
import { useTravelStore } from "@/store";
import { quoteTotals } from "@/domain/quote";
import { destination } from "@/store/selectors";
import { Button } from "@/components/ui/button";
import {
  PageHeader,
  StatusBadge,
  MoneyCell,
  Modal,
  Field,
  EmptyState,
} from "@/components/shared";
export function QuotationList() {
  const s = useTravelStore(),
    router = useRouter(),
    params = useSearchParams();
  const [open, setOpen] = useState(false),
    [lead, setLead] = useState("l1"),
    [status, setStatus] = useState(params.get("status") ?? "All");
  const rows = s.quotations.filter(
    (q) => status === "All" || q.status === status,
  );
  return (
    <>
      <PageHeader
        title="Quotations"
        description="Thoughtfully priced trips. Ready for your client's next yes."
        action={
          <Button onClick={() => setOpen(true)}>
            <Plus />
            New quotation
          </Button>
        }
      />
      <div className="toolbar">
        <div className="toolbar-left">
          {["All", "Draft", "Sent", "Accepted"].map((x) => (
            <button
              key={x}
              className={`chip ${status === x ? "active" : ""}`}
              onClick={() => setStatus(x)}
            >
              {x}{" "}
              <span className="muted">
                {x === "All"
                  ? s.quotations.length
                  : s.quotations.filter((q) => q.status === x).length}
              </span>
            </button>
          ))}
        </div>
        <span className="subtle-note">Prices are illustrative, in PHP</span>
      </div>
      <div className="panel table-wrap">
        <table>
          <thead>
            <tr>
              <th>Quotation</th>
              <th>Customer</th>
              <th>Trip</th>
              <th>Travelers</th>
              <th>Selling price</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((q) => (
              <tr key={q.id}>
                <td>
                  <Link href={`/quotations/view?id=${q.id}`}>
                    <strong>{q.ref}</strong>
                  </Link>
                  <p className="subtle-note">Valid until {q.validUntil}</p>
                </td>
                <td>{s.customers.find((c) => c.id === q.customerId)?.name}</td>
                <td>{destination(s, q)}</td>
                <td>{q.paxCount} pax</td>
                <td>
                  <MoneyCell value={quoteTotals(q).selling} />
                </td>
                <td>
                  <StatusBadge status={q.status} />
                </td>
                <td>
                  <Link
                    aria-label={`Open ${q.ref}`}
                    className="text-link"
                    href={`/quotations/view?id=${q.id}`}
                  >
                    <ArrowUpRight size={15} />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!rows.length && <EmptyState />}
      </div>
      <div className="list-footnote">
        <FileText size={14} /> Accepted quotations are frozen to keep your
        booking figures consistent.
      </div>
      <Modal open={open} onOpenChange={setOpen} title="Create a quotation">
        <Field label="Start from an inquiry">
          <select
            aria-label="Quotation inquiry"
            value={lead}
            onChange={(e) => setLead(e.target.value)}
          >
            {s.leads.map((l) => (
              <option key={l.id} value={l.id}>
                {s.customers.find((c) => c.id === l.customerId)?.name} ·{" "}
                {l.destination}
              </option>
            ))}
          </select>
        </Field>
        <Button
          onClick={() => {
            const id = s.createQuotation(lead);
            router.push(`/quotations/view?id=${id}`);
          }}
        >
          Create quotation
        </Button>
      </Modal>
    </>
  );
}
