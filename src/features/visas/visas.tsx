"use client";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  BookUser,
  ArrowUpRight,
  CheckCircle2,
  CalendarDays,
} from "lucide-react";
import { useTravelStore } from "@/store";
import { visaCounts } from "@/store/selectors";
import { visaStages, type VisaCase } from "@/domain/types";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  PageHeader,
  StatusBadge,
  EmptyState,
  Field,
  NoteForm,
  notify,
} from "@/components/shared";
export function Visas() {
  const s = useTravelStore(),
    params = useSearchParams();
  const [stage, setStage] = useState("All"),
    [selected, setSelected] = useState(params.get("case") ?? "");
  const counts = visaCounts(s),
    rows = s.visas.filter((v) => stage === "All" || v.stage === stage),
    v = s.visas.find((v) => v.id === selected);
  const traveler = (v: VisaCase) =>
    s.bookings
      .find((b) => b.id === v.bookingId)
      ?.travelers.find((t) => t.id === v.travelerId);
  return (
    <>
      <PageHeader
        title="Visa tracker"
        description="Less chasing paperwork. More confidence at every step."
      />
      <div className="visa-notice">
        <BookUser size={17} />
        <p>
          Agency-lodged tourist applications · Statuses are recorded manually.
          No applications are submitted in this demo.
        </p>
      </div>
      <div className="visa-filters">
        <button
          className={`chip ${stage === "All" ? "active" : ""}`}
          onClick={() => setStage("All")}
        >
          All cases ({s.visas.length})
        </button>
        {visaStages.map((x) => (
          <button
            className={`chip ${stage === x ? "active" : ""}`}
            key={x}
            onClick={() => setStage(x)}
          >
            {x} ({counts[x]})
          </button>
        ))}
      </div>
      <div className="panel table-wrap">
        <table>
          <thead>
            <tr>
              <th>Traveler</th>
              <th>Country / type</th>
              <th>Requirements</th>
              <th>Stage</th>
              <th>Expected decision</th>
              <th>Agent</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((v) => (
              <tr key={v.id}>
                <td>
                  <button
                    className="customer-name"
                    onClick={() => setSelected(v.id)}
                  >
                    {traveler(v)?.fullName}
                  </button>
                  <p className="subtle-note">
                    {s.bookings.find((b) => b.id === v.bookingId)?.ref}
                  </p>
                </td>
                <td>
                  <strong>{v.country}</strong>
                  <p className="subtle-note">{v.type}</p>
                </td>
                <td>
                  <div className="checklist-fraction">
                    <span>
                      {v.checklist.filter((x) => x.done).length} /{" "}
                      {v.checklist.length} complete
                    </span>
                    <div>
                      <i
                        style={{
                          width: `${(v.checklist.filter((x) => x.done).length / v.checklist.length) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                </td>
                <td>
                  <StatusBadge status={v.stage} />
                </td>
                <td>{v.expectedDecision ?? "Not set"}</td>
                <td>
                  <span className="mini-avatar">
                    {s.agents.find((a) => a.id === v.assignedAgentId)?.initials}
                  </span>
                </td>
                <td>
                  <button
                    className="text-link"
                    aria-label={`Open visa case for ${traveler(v)?.fullName}`}
                    onClick={() => setSelected(v.id)}
                  >
                    <ArrowUpRight size={15} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!rows.length && <EmptyState text="No visa cases at this stage." />}
      </div>
      <p className="list-footnote">
        All traveler data is synthetic. Do not enter real passport information.
      </p>
      <Sheet
        open={!!v}
        onOpenChange={(open) => {
          if (!open) setSelected("");
        }}
      >
        <SheetContent className="customer-sheet">
          <SheetHeader>
            <div className="drawer-avatar">
              <BookUser size={23} />
            </div>
            <SheetTitle>{v ? traveler(v)?.fullName : ""}</SheetTitle>
            <SheetDescription>
              {v?.country} · {v?.type}
            </SheetDescription>
          </SheetHeader>
          {v && (
            <div className="drawer-body">
              <Field label="Application stage">
                <select
                  aria-label="Visa stage"
                  value={v.stage}
                  onChange={(e) =>
                    notify(
                      () =>
                        s.updateVisaStage(
                          v.id,
                          e.target.value as VisaCase["stage"],
                        ),
                      "Visa stage recorded (simulated)",
                    )
                  }
                >
                  {visaStages.map((x) => (
                    <option key={x}>{x}</option>
                  ))}
                </select>
              </Field>
              <h3>Requirements checklist</h3>
              <div className="visa-checklist">
                {v.checklist.map((c, i) => (
                  <label key={c.item}>
                    <Checkbox
                      checked={c.done}
                      onCheckedChange={() =>
                        notify(
                          () => s.toggleVisaChecklist(v.id, i),
                          "Checklist updated",
                        )
                      }
                      aria-label={c.item}
                    />
                    <span className={c.done ? "done" : ""}>{c.item}</span>
                  </label>
                ))}
              </div>
              {v.checklist.every((c) => c.done) &&
                v.stage === "Collecting Requirements" && (
                  <div className="requirements-complete">
                    <CheckCircle2 size={17} />
                    <div>
                      <strong>All requirements complete</strong>
                      <p>Ready to move this case to Complete.</p>
                    </div>
                  </div>
                )}
              <h3>
                <CalendarDays size={14} />
                Key dates
              </h3>
              <div className="form-grid">
                <Field label="Submitted (simulated)">
                  <Input
                    type="date"
                    aria-label="Submitted date"
                    value={v.submittedAt ?? ""}
                    onChange={(e) =>
                      notify(
                        () =>
                          s.updateVisaDates(
                            v.id,
                            e.target.value,
                            v.expectedDecision ?? "",
                          ),
                        "Date saved",
                      )
                    }
                  />
                </Field>
                <Field label="Expected decision">
                  <Input
                    type="date"
                    aria-label="Expected decision"
                    value={v.expectedDecision ?? ""}
                    onChange={(e) =>
                      notify(
                        () =>
                          s.updateVisaDates(
                            v.id,
                            v.submittedAt ?? "",
                            e.target.value,
                          ),
                        "Date saved",
                      )
                    }
                  />
                </Field>
              </div>
              <h3>Notes</h3>
              <div className="drawer-notes">
                {v.notes.map((n, i) => (
                  <p key={i}>{n}</p>
                ))}
              </div>
              <NoteForm onAdd={(n) => s.addVisaNote(v.id, n)} />
              <Link
                className="text-link visa-booking-link"
                href={`/bookings/view?id=${v.bookingId}`}
              >
                Open related booking <ArrowUpRight size={14} />
              </Link>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
