"use client";
import { lastContactLabel } from "@/domain/dates";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { format, parseISO, differenceInCalendarDays } from "date-fns";
import { toast } from "sonner";
import { useTravelStore } from "@/store";
import { pipelineCounts } from "@/store/selectors";
import { leadStages, sources, type Lead, type LeadStage } from "@/domain/types";
import { leadLabel, leadHelpers } from "@/domain/labels";
import { money } from "@/domain/money";
import { StageBlock } from "@/components/blocks";
import { FormDialog } from "@/components/blocks/form-dialog";
import { Button } from "@/components/ui/button";
import { Modal, EmptyState, notify } from "@/components/shared";
export function NewInquiry({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const s = useTravelStore();
  return (
    <FormDialog
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
      title="Someone new"
      description="Find an existing person by name, or add a synthetic demo customer."
      submit="Create inquiry"
      fields={[
        {
          name: "name",
          label: "Full name",
          validate: (v) =>
            v.trim().length < 2 ? "Type the customer’s full name." : undefined,
        },
        { name: "destination", label: "Destination" },
        {
          name: "pax",
          label: "People",
          type: "number",
          value: "2",
          validate: (v) =>
            !Number.isInteger(Number(v)) || Number(v) < 1 || Number(v) > 50
              ? "Choose between 1 and 50 people."
              : undefined,
        },
        {
          name: "month",
          label: "Travel month",
          type: "month",
          value: s.leads[0].travelMonth,
        },
        {
          name: "source",
          label: "Source",
          options: sources,
          value: "Facebook Messenger",
        },
        {
          name: "agent",
          label: "Assigned agent",
          options: s.agents.map((a) => a.name),
          value: s.agents[1].name,
        },
        {
          name: "phone",
          label: "Phone (optional)",
          optional: true,
          value: "0900 000 0000",
        },
        {
          name: "email",
          label: "Email (optional)",
          optional: true,
          value: "demo@example.com",
          type: "email",
          validate: (v) =>
            v && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
              ? "Enter a valid email."
              : undefined,
        },
        {
          name: "city",
          label: "City (optional)",
          optional: true,
          value: "Metro Manila",
        },
      ]}
      onSubmit={(v) => {
        const existing = s.customers.find(
          (c) => c.name.toLowerCase() === v.name.trim().toLowerCase(),
        );
        s.createLead(
          existing ?? {
            name: v.name.trim(),
            source: v.source as (typeof sources)[number],
            phone: v.phone || "0900 000 0000",
            email: v.email || "demo@example.com",
            city: v.city || "Metro Manila",
          },
          {
            destination: v.destination.trim(),
            travelMonth: v.month,
            paxCount: Number(v.pax),
            assignedAgentId: s.agents.find((a) => a.name === v.agent)!.id,
          },
        );
        toast.success("Inquiry added.");
      }}
    />
  );
}
const openStages = leadStages.slice(0, 4);
const help: Record<string, string> = {
  "New Inquiry": "These people just asked. Reply within a day.",
  Contacted: "You're chatting with these people. Make each one a quote.",
  Quoted: "They have a quote. Check in if you haven't heard back.",
  Negotiating: "These people have a quote. Ask if they're ready to book.",
  closed: "Finished conversations. Reopen someone if they come back.",
};
export function Inquiries() {
  const s = useTravelStore(),
    params = useSearchParams(),
    router = useRouter();
  const [newOpen, setNewOpen] = useState(params.get("new") === "1"),
    [confirm, setConfirm] = useState<{ lead: Lead; stage: LeadStage } | null>(
      null,
    );
  const stage = params.get("stage") ?? "Negotiating",
    table = params.get("view") === "table";
  const counts = pipelineCounts(s);
  const query = (key: string, value: string) => {
    const p = new URLSearchParams(params.toString());
    p.set(key, value);
    router.replace(`/inquiries?${p}`, { scroll: false });
  };
  const customer = params.get("customer");
  useEffect(() => {
    if (customer)
      router.replace(`/customers/view?id=${encodeURIComponent(customer)}`);
  }, [customer, router]);
  if (customer) return <p>Opening customer…</p>;
  const rows = table
    ? s.leads
    : s.leads.filter((l) =>
        stage === "closed"
          ? ["Won", "Lost"].includes(l.stage)
          : l.stage === stage,
      );
  const createQuote = (l: Lead) =>
    notify(() => {
      const id = s.createQuotation(l.id);
      s.updateLeadStage(l.id, "Quoted");
      router.push(`/quotations/view?id=${id}`);
    }, "Quote draft created");
  const more = (l: Lead) => (
    <select
      aria-label="Lead stage"
      value={l.stage}
      onChange={(e) =>
        notify(
          () => s.updateLeadStage(l.id, e.target.value as LeadStage),
          "Step updated",
        )
      }
    >
      {leadStages.map((x) => (
        <option key={x} value={x}>
          {leadLabel(x)}
        </option>
      ))}
    </select>
  );
  const actions = (l: Lead) => {
    const quote = s.quotations.find((q) => q.leadId === l.id);
    if (["Won", "Lost"].includes(l.stage))
      return (
        <Button
          variant="outline"
          onClick={() => s.updateLeadStage(l.id, "Contacted")}
        >
          Reopen
        </Button>
      );
    if (l.stage === "New Inquiry")
      return (
        <button
          className="btn small"
          onClick={() =>
            notify(
              () => s.updateLeadStage(l.id, "Contacted"),
              "First reply logged",
            )
          }
        >
          Log first reply →
        </button>
      );
    if (l.stage === "Contacted")
      return (
        <button className="btn small" onClick={() => createQuote(l)}>
          Make a quote →
        </button>
      );
    if (l.stage === "Quoted")
      return (
        <button
          className="btn small"
          onClick={() =>
            notify(
              () => s.updateLeadStage(l.id, "Negotiating"),
              "Check-in logged",
            )
          }
        >
          Checked in →
        </button>
      );
    if (quote)
      return (
        <Link className="btn small" href={`/quotations/view?id=${quote.id}`}>
          Open quote
        </Link>
      );
    return (
      <>
        <button
          className="btn small"
          onClick={() => setConfirm({ lead: l, stage: "Won" })}
        >
          They booked
        </button>
        <button
          className="btn ghost small"
          onClick={() => setConfirm({ lead: l, stage: "Lost" })}
        >
          Said no
        </button>
      </>
    );
  };
  return (
    <>
      <section className="hello">
        <div>
          <h1>People asking</h1>
          <p>Move each person to the next step.</p>
        </div>
        <button className="btn lime" onClick={() => setNewOpen(true)}>
          + Someone new
        </button>
      </section>
      <nav className="g4" aria-label="Steps">
        {openStages.map((x) => (
          <StageBlock
            key={x}
            count={counts[x]}
            label={leadLabel(x)}
            helper={leadHelpers[x]}
            active={stage === x}
            onClick={() => query("stage", x)}
          />
        ))}
      </nav>
      <div className="people-help">
        <p>{help[stage] ?? help.Negotiating}</p>
        <button
          className="linkish"
          onClick={() => query("view", table ? "cards" : "table")}
        >
          {table ? "Card view" : "Table view"}
        </button>
      </div>
      {table ? (
        <section className="sheet table-wrap">
          <table className="t">
            <thead>
              <tr>
                <th>Person</th>
                <th>Trip</th>
                <th>People</th>
                <th>Source</th>
                <th>Step</th>
                <th>Next</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((l) => (
                <tr key={l.id}>
                  <td>
                    <Link href={`/customers/view?id=${l.customerId}`}>
                      {s.customers.find((c) => c.id === l.customerId)?.name}
                    </Link>
                  </td>
                  <td>{l.destination}</td>
                  <td>{l.paxCount}</td>
                  <td>
                    {s.customers.find((c) => c.id === l.customerId)?.source}
                  </td>
                  <td>{more(l)}</td>
                  <td>{actions(l)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ) : (
        <section className="g2 people-cards" aria-live="polite">
          {rows.map((l) => {
            const c = s.customers.find((c) => c.id === l.customerId)!,
              days = differenceInCalendarDays(
                new Date(),
                parseISO(l.lastContactAt),
              );
            return (
              <article
                className={`person ${l.id === "l1" ? "hot" : ""}`}
                key={l.id}
                data-testid="person-card"
              >
                <h3>
                  <Link href={`/customers/view?id=${c.id}`}>{c.name}</Link>
                </h3>
                <span className="person-budget">
                  {l.budgetCentavos
                    ? money(l.budgetCentavos)
                    : "Budget to discuss"}
                </span>
                <p className="trip">
                  {l.destination} · {l.paxCount} people ·{" "}
                  {format(parseISO(l.travelMonth + "-01"), "MMM")}
                </p>
                <p className={`last ${days >= 5 ? "stale" : ""}`}>
                  {days >= 5
                    ? `No reply in ${days} days`
                    : lastContactLabel(days)}
                </p>
                <div className="acts">
                  {actions(l)}
                  <details className="lead-more">
                    <summary>More</summary>
                    {more(l)}
                    <p className="subtle-note">
                      {c.source} ·{" "}
                      {s.agents.find((a) => a.id === l.assignedAgentId)?.name}
                    </p>
                  </details>
                </div>
              </article>
            );
          })}
          {!rows.length && (
            <EmptyState text="Nobody in this step. You're up to date." />
          )}
        </section>
      )}
      <button
        className="linkish closed-link"
        onClick={() =>
          query("stage", stage === "closed" ? "Negotiating" : "closed")
        }
      >
        {stage === "closed"
          ? "← Back to open steps"
          : `See finished: ${counts.Won} booked, ${counts.Lost} said no →`}
      </button>
      <NewInquiry open={newOpen} onClose={() => setNewOpen(false)} />
      <Modal
        open={!!confirm}
        onOpenChange={(v) => {
          if (!v) setConfirm(null);
        }}
        title={
          confirm?.stage === "Won"
            ? "Mark as booked?"
            : "Close this conversation?"
        }
        description="This changes the inquiry step only. A booking is created from an accepted priced quote."
      >
        <Button
          onClick={() => {
            if (confirm)
              notify(
                () => s.updateLeadStage(confirm.lead.id, confirm.stage),
                "Inquiry updated",
              );
            setConfirm(null);
          }}
        >
          Confirm
        </Button>
      </Modal>
    </>
  );
}
