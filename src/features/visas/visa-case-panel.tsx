"use client";
import Link from "next/link";
import { ArrowUpRight, CheckCircle2, CalendarDays } from "lucide-react";
import { useTravelStore } from "@/store";
import { visaStages, type VisaCase } from "@/domain/types";
import { Sheet as PageSheet } from "@/components/blocks";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Field, NoteForm, notify } from "@/components/shared";
export function VisaCasePanel({
  v,
  travelerName,
  onClose,
}: {
  v: VisaCase;
  travelerName: string;
  onClose: () => void;
}) {
  const s = useTravelStore();
  return (
    <PageSheet
      id="selected-case"
      title={travelerName}
      note={`${v.country} · ${v.type}`}
      action={
        <button className="btn ghost small" onClick={onClose}>
          Close
        </button>
      }
    >
      {v && (
        <div className="case-body">
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
    </PageSheet>
  );
}
