"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { differenceInDays, parseISO } from "date-fns";
import {
  Plus,
  Columns3,
  List,
  MessagesSquare,
  Users,
  MapPin,
  Mail,
  Phone,
  FileText,
  ArrowUpRight,
} from "lucide-react";
import { useTravelStore } from "@/store";
import { customerBalance, pipelineCounts } from "@/store/selectors";
import { leadStages, sources, type Customer } from "@/domain/types";
import { money } from "@/domain/money";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  PageHeader,
  StatusBadge,
  Field,
  Modal,
  NoteForm,
  EmptyState,
  notify,
} from "@/components/shared";
function NewInquiry({ open, onClose }: { open: boolean; onClose: () => void }) {
  const s = useTravelStore();
  const [customer, setCustomer] = useState(""),
    [query, setQuery] = useState("");
  return (
    <Modal
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
      title="New inquiry"
      description="Start a conversation. Keep every detail together."
    >
      <form
        className="section-stack"
        onSubmit={(e) => {
          e.preventDefault();
          const d = new FormData(e.currentTarget);
          const c = s.customers.find((c) => c.id === customer) ?? {
            name: String(d.get("name")),
            phone: String(d.get("phone") ?? "0900 000 0000"),
            email: String(d.get("email") ?? "demo@example.com"),
            city: String(d.get("city") ?? "Metro Manila"),
            source: String(d.get("source")) as Customer["source"],
          };
          notify(
            () =>
              s.createLead(c, {
                destination: String(d.get("destination")),
                travelMonth: String(d.get("month")),
                paxCount: Number(d.get("pax")),
                assignedAgentId: String(d.get("agent")),
              }),
            "Inquiry added",
          );
          onClose();
        }}
      >
        <Field label="Find an existing customer">
          <Input
            aria-label="Find customer"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name…"
          />
          <select
            aria-label="Existing customer"
            value={customer}
            onChange={(e) => setCustomer(e.target.value)}
          >
            <option value="">Create a new customer</option>
            {s.customers
              .filter((c) => c.name.toLowerCase().includes(query.toLowerCase()))
              .map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
          </select>
        </Field>
        {!customer && (
          <div className="form-grid">
            <Field label="Customer name">
              <Input name="name" required placeholder="Synthetic demo name" />
            </Field>
            <Field label="Phone">
              <Input name="phone" defaultValue="0900 000 0000" required />
            </Field>
            <Field label="Email">
              <Input
                name="email"
                type="email"
                defaultValue="demo@example.com"
                required
              />
            </Field>
            <Field label="City">
              <Input name="city" defaultValue="Metro Manila" required />
            </Field>
          </div>
        )}
        <div className="form-grid">
          <Field label="Destination">
            <Input name="destination" required placeholder="e.g. Japan" />
          </Field>
          <Field label="Travel month">
            <Input
              type="month"
              name="month"
              required
              defaultValue={s.leads[0].travelMonth}
            />
          </Field>
          <Field label="Travelers">
            <Input
              type="number"
              name="pax"
              min="1"
              max="100"
              required
              defaultValue="2"
            />
          </Field>
          <Field label="Source">
            <select name="source">
              {sources.map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </Field>
          <Field label="Assigned agent">
            <select name="agent">
              {s.agents.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <div className="dialog-actions">
          <Button variant="outline" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">Create inquiry</Button>
        </div>
      </form>
    </Modal>
  );
}
export function Inquiries() {
  const s = useTravelStore(),
    router = useRouter(),
    params = useSearchParams();
  const [view, setView] = useState(params.get("view") ?? "board"),
    [newOpen, setNewOpen] = useState(params.get("new") === "1"),
    [search, setSearch] = useState("");
  const selected = params.get("customer") ?? "";
  const setSelected = (id: string) => {
    const query = new URLSearchParams(params.toString());
    if (id) query.set("customer", id);
    else query.delete("customer");
    router.replace(`/inquiries?${query.toString()}`, { scroll: false });
  };
  const customer = s.customers.find((c) => c.id === selected),
    counts = pipelineCounts(s);
  const rows = s.leads.filter((l) =>
    `${s.customers.find((c) => c.id === l.customerId)?.name} ${l.destination}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );
  const createQuote = (id: string) =>
    notify(() => {
      const q = s.createQuotation(id);
      router.push(`/quotations/view?id=${q}`);
    }, "Quotation draft created");
  const stageSelect = (id: string, stage: string) => (
    <select
      className="lead-stage"
      aria-label="Lead stage"
      value={stage}
      onChange={(e) =>
        notify(
          () =>
            s.updateLeadStage(
              id,
              e.target.value as (typeof leadStages)[number],
            ),
          "Pipeline stage updated",
        )
      }
    >
      {leadStages.map((x) => (
        <option key={x}>{x}</option>
      ))}
    </select>
  );
  return (
    <>
      <PageHeader
        title="Inquiries"
        description="From the first hello to a journey they'll remember."
        action={
          <Button onClick={() => setNewOpen(true)}>
            <Plus />
            New inquiry
          </Button>
        }
      />
      <div className="toolbar">
        <div className="inquiry-search">
          <MessagesSquare size={15} />
          <Input
            aria-label="Search inquiries"
            placeholder="Search name or destination…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="view-toggle">
          <button
            className={view === "board" ? "active" : ""}
            onClick={() => setView("board")}
          >
            <Columns3 size={14} />
            Pipeline
          </button>
          <button
            className={view === "table" ? "active" : ""}
            onClick={() => setView("table")}
          >
            <List size={14} />
            Table
          </button>
        </div>
      </div>
      {view === "board" ? (
        <div className="kanban">
          {leadStages.map((stage) => (
            <section className="kanban-column" key={stage}>
              <header>
                <span
                  className={`stage-dot stage-${stage.replaceAll(" ", "").toLowerCase()}`}
                />
                <h2>{stage}</h2>
                <span>{counts[stage]}</span>
              </header>
              <div className="kanban-cards">
                {rows
                  .filter((l) => l.stage === stage)
                  .map((l) => {
                    const c = s.customers.find((c) => c.id === l.customerId)!,
                      days = differenceInDays(
                        new Date(),
                        parseISO(l.lastContactAt),
                      );
                    return (
                      <article key={l.id} className="lead-card">
                        <div className="lead-source">
                          <MessagesSquare size={12} />
                          <span>{c.source}</span>
                        </div>
                        <button
                          className="customer-name"
                          onClick={() => setSelected(c.id)}
                        >
                          {c.name}
                        </button>
                        <p className="lead-destination">
                          <MapPin size={12} />
                          {l.destination}
                        </p>
                        <div className="lead-meta">
                          <span>
                            <Users size={12} />
                            {l.paxCount} pax
                          </span>
                          <span>{l.travelMonth}</span>
                        </div>
                        <div className="lead-footer">
                          <span
                            className={`last-contact ${days > 3 ? "stale" : ""}`}
                          >
                            {days === 0 ? "Today" : `${days}d ago`}
                          </span>
                          <span className="mini-avatar">
                            {
                              s.agents.find((a) => a.id === l.assignedAgentId)
                                ?.initials
                            }
                          </span>
                        </div>
                        {stageSelect(l.id, l.stage)}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="create-quote-link"
                          onClick={() => createQuote(l.id)}
                        >
                          <FileText />
                          Create quotation
                        </Button>
                      </article>
                    );
                  })}
                {!rows.some((l) => l.stage === stage) && (
                  <div className="kanban-empty">No inquiries</div>
                )}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className="panel table-wrap">
          <table>
            <thead>
              <tr>
                <th>Customer</th>
                <th>Destination</th>
                <th>Pax</th>
                <th>Source</th>
                <th>Agent</th>
                <th>Stage</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map((l) => (
                <tr key={l.id}>
                  <td>
                    <button
                      className="customer-name"
                      onClick={() => setSelected(l.customerId)}
                    >
                      {s.customers.find((c) => c.id === l.customerId)?.name}
                    </button>
                  </td>
                  <td>{l.destination}</td>
                  <td>{l.paxCount}</td>
                  <td>
                    {s.customers.find((c) => c.id === l.customerId)?.source}
                  </td>
                  <td>
                    {s.agents.find((a) => a.id === l.assignedAgentId)?.initials}
                  </td>
                  <td>{stageSelect(l.id, l.stage)}</td>
                  <td>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => createQuote(l.id)}
                    >
                      Create quotation
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!rows.length && <EmptyState />}
        </div>
      )}
      <div className="list-footnote">
        <MessagesSquare size={14} />
        Sources are recorded manually. This demo is not connected to Facebook or
        Messenger.
      </div>
      <NewInquiry open={newOpen} onClose={() => setNewOpen(false)} />
      <Sheet
        open={!!customer}
        onOpenChange={(v) => {
          if (!v) setSelected("");
        }}
      >
        <SheetContent className="customer-sheet">
          <SheetHeader>
            <div className="drawer-avatar">
              {customer?.name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2)}
            </div>
            <SheetTitle>{customer?.name}</SheetTitle>
            <SheetDescription>
              {customer?.source} · Customer profile
            </SheetDescription>
          </SheetHeader>
          {customer && (
            <div className="drawer-body">
              <div className="contact-details">
                <p>
                  <Phone size={14} />
                  {customer.phone}
                </p>
                <p>
                  <Mail size={14} />
                  {customer.email}
                </p>
                <p>
                  <MapPin size={14} />
                  {customer.city}
                </p>
              </div>
              <div className="customer-balance">
                <span>Outstanding balance</span>
                <strong data-testid="customer-balance">
                  {money(customerBalance(s, customer.id))}
                </strong>
              </div>
              <h3>Inquiry history</h3>
              {s.leads
                .filter((l) => l.customerId === customer.id)
                .map((l) => (
                  <div className="drawer-record" key={l.id}>
                    <div className="drawer-record-heading">
                      <strong>
                        {l.destination} · {l.paxCount} pax
                      </strong>
                      <StatusBadge status={l.stage} />
                    </div>
                    <p className="subtle-note">
                      {l.travelMonth} ·{" "}
                      {s.agents.find((a) => a.id === l.assignedAgentId)?.name}
                    </p>
                    <div className="drawer-notes">
                      {l.notes.map((n, i) => (
                        <p key={i}>{n}</p>
                      ))}
                    </div>
                    <NoteForm onAdd={(n) => s.addLeadNote(l.id, n)} />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => createQuote(l.id)}
                    >
                      <Plus />
                      Create quotation
                    </Button>
                  </div>
                ))}
              <h3>Quotations</h3>
              {s.quotations
                .filter((q) => q.customerId === customer.id)
                .map((q) => (
                  <Link
                    key={q.id}
                    className="drawer-link"
                    href={`/quotations/view?id=${q.id}`}
                  >
                    <div>
                      <strong>{q.ref}</strong>
                      <small>{q.status}</small>
                    </div>
                    <ArrowUpRight size={15} />
                  </Link>
                ))}
              <h3>Bookings</h3>
              {s.bookings
                .filter((b) => b.customerId === customer.id)
                .map((b) => (
                  <Link
                    key={b.id}
                    className="drawer-link"
                    href={`/bookings/view?id=${b.id}`}
                  >
                    <strong>{b.ref}</strong>
                    <ArrowUpRight size={15} />
                  </Link>
                ))}
              {!s.bookings.some((b) => b.customerId === customer.id) && (
                <p className="muted">No bookings yet.</p>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
