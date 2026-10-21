"use client";
import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { BookUser } from "lucide-react";
import { useTravelStore } from "@/store";
import { visaCounts } from "@/store/selectors";
import { VisaCasePanel } from "./visa-case-panel";
import { visaStages, type VisaCase } from "@/domain/types";
import { displayDate } from "@/domain/dates";
import {
  PageHeader,
  StatusBadge,
  EmptyState,
  notify,
} from "@/components/shared";
export function Visas() {
  const s = useTravelStore(),
    params = useSearchParams(),
    router = useRouter();
  const [stage, setStage] = useState("All");
  const selected = params.get("case") ?? "";
  const setSelected = (id: string) =>
    router.replace(id ? `/visas?case=${id}` : "/visas", { scroll: false });
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
        title="Visas"
        description="Track each traveler’s documents. Nothing is sent to an embassy from here."
      />
      <div className="visa-notice">
        <BookUser size={17} />
        <p>
          Agency-lodged tourist applications · Statuses are recorded manually.
          No applications are submitted in this demo.
        </p>
      </div>
      {s.bookings
        .filter((b) => b.status !== "Cancelled")
        .flatMap((b) =>
          b.travelers
            .filter(
              (t) =>
                t.visaRequired &&
                !s.visas.some(
                  (v) => v.bookingId === b.id && v.travelerId === t.id,
                ),
            )
            .map((t) => (
              <div className="callout" key={t.id}>
                <span>
                  <b>{t.fullName} needs a visa</b> · {b.ref} · leaves{" "}
                  {displayDate(b.quotationSnapshot.departDate, "EEE d MMM")}. No
                  case yet.
                </span>
                <button
                  className="btn small"
                  onClick={() =>
                    notify(
                      () => setSelected(s.createVisaCase(b.id, t.id)),
                      "Visa case opened (demo)",
                    )
                  }
                >
                  Start case for {t.fullName}
                </button>
              </div>
            )),
        )}
      <div className="filters">
        <button
          className={stage === "All" ? "on" : ""}
          onClick={() => setStage("All")}
        >
          All cases ({s.visas.length})
        </button>
        {visaStages.map((x) => (
          <button
            className={stage === x ? "on" : ""}
            key={x}
            onClick={() => setStage(x)}
          >
            {x} ({counts[x]})
          </button>
        ))}
      </div>
      <div className={`visa-split ${v ? "has-case" : ""}`}>
        <div className="sheet table-wrap">
          <table className="t">
            <thead>
              <tr>
                <th>Traveler</th>
                <th>Country / type</th>
                <th>Requirements</th>
                <th>Stage</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((v) => (
                <tr
                  key={v.id}
                  className={v.id === selected ? "selected-row" : ""}
                >
                  <td>
                    <button
                      className="customer-name"
                      onClick={() => setSelected(v.id)}
                    >
                      {traveler(v)?.fullName}
                    </button>
                    <p className="subtle-note">
                      {s.bookings.find((b) => b.id === v.bookingId)?.ref} ·
                      leaves{" "}
                      {displayDate(
                        s.bookings.find((b) => b.id === v.bookingId)
                          ?.quotationSnapshot.departDate,
                        "EEE d MMM",
                      )}
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
                </tr>
              ))}
            </tbody>
          </table>
          {!rows.length && <EmptyState text="No visa cases at this stage." />}
        </div>
        {v && (
          <VisaCasePanel
            v={v}
            travelerName={traveler(v)?.fullName ?? "Visa case"}
            onClose={() => setSelected("")}
          />
        )}
      </div>
      <p className="list-footnote">
        All traveler data is synthetic. Nothing is sent to an embassy from here.
      </p>
    </>
  );
}
