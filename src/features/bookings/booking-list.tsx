"use client";
import Link from "next/link";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { differenceInCalendarDays, parseISO } from "date-fns";
import { useTravelStore } from "@/store";
import {
  destination,
  financials,
  kpis,
  tripSteps,
  tripStatus,
} from "@/store/selectors";
import { destinationCity, destinationCode } from "@/domain/places";
import { displayDate, daysUntil } from "@/domain/dates";
import { money } from "@/domain/money";
import { bookingLabel } from "@/domain/labels";
import { Block, BigNumber, StatusChip, Meter } from "@/components/blocks";
import { EmptyState } from "@/components/shared";
import type { Booking } from "@/domain/types";

export function BookingList() {
  const s = useTravelStore(),
    params = useSearchParams();
  const [filter, setFilter] = useState(params.get("filter") ?? "All");
  const [search, setSearch] = useState("");
  const stats = kpis(s),
    active = s.bookings.filter((b) => b.status !== "Cancelled");
  const leaving = (b: Booking) => {
    const days = differenceInCalendarDays(
      parseISO(b.quotationSnapshot.departDate),
      new Date(),
    );
    return b.status !== "Cancelled" && days >= 0 && days <= 30;
  };
  const matches = (b: Booking, value: string) => {
    if (value === "Needs action")
      return (
        b.status !== "Cancelled" && tripSteps(s, b).some((step) => !step.done)
      );
    if (value === "Leaving in 30 days" || value === "Upcoming")
      return leaving(b);
    if (value === "Payment late")
      return b.status !== "Cancelled" && financials(s, b).status === "Overdue";
    if (value === "Waiting on suppliers")
      return (
        b.status !== "Cancelled" &&
        b.services.some(
          (x) => !["Confirmed", "Issued", "Cancelled"].includes(x.status),
        )
      );
    if (value === "This month")
      return (
        b.status !== "Cancelled" &&
        b.createdAt.startsWith(new Date().toISOString().slice(0, 7))
      );
    return value === "All" || b.status === value;
  };
  const rows = s.bookings.filter(
    (b) =>
      matches(b, filter) &&
      `${b.ref} ${destination(s, b.quotationSnapshot)} ${s.customers.find((c) => c.id === b.customerId)?.name}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  const late = active
    .filter((b) => financials(s, b).status === "Overdue")
    .reduce((sum, b) => sum + financials(s, b).balance, 0);
  return (
    <>
      <Link className="back" href="/dashboard">
        ← Home
      </Link>
      <section className="hello">
        <div>
          <h1>All trips</h1>
          <p>Every booking, what&apos;s paid, and what it needs next.</p>
        </div>
        <Link className="btn lime" href="/quotations">
          + New booking from a quote
        </Link>
      </section>
      <section className="stats">
        <Block tag="Trips booked">
          <div className="big num">{active.length}</div>
          <p>
            This month:{" "}
            <strong data-testid="kpi-bookings">{stats.bookingsMonth}</strong>
          </p>
        </Block>
        <Block tag="Leaving in 30 days">
          <div className="big num">{active.filter(leaving).length}</div>
        </Block>
        <Block tag="Still to collect">
          <BigNumber value={stats.receivables} />
        </Block>
        <Block variant="red" tag="Late">
          <BigNumber value={late} />
        </Block>
      </section>
      <div className="filters" aria-label="Trip filters">
        {[
          "All",
          "Needs action",
          "Leaving in 30 days",
          "Payment late",
          "Waiting on suppliers",
        ].map((value) => (
          <button
            key={value}
            className={filter === value ? "on" : ""}
            aria-pressed={filter === value}
            onClick={() => setFilter(value)}
          >
            {value} <b>{s.bookings.filter((b) => matches(b, value)).length}</b>
          </button>
        ))}
        <label className="list-search">
          <span>Find a name or place</span>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
      </div>
      <section className="sheet table-wrap">
        <table className="t trip-table">
          <thead>
            <tr>
              <th>Trip</th>
              <th>Customer</th>
              <th>Leaves</th>
              <th>Status</th>
              <th className="r">Total</th>
              <th>Paid</th>
              <th>Next step</th>
              <th>Agent</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((b) => {
              const f = financials(s, b),
                place = destination(s, b.quotationSnapshot),
                next = tripSteps(s, b).find((step) => !step.done);
              const agent = s.agents.find((a) => a.id === b.assignedAgentId),
                status = tripStatus(s, b);
              return (
                <tr key={b.id}>
                  <td>
                    <Link
                      className="trip-link"
                      href={`/bookings/view?id=${b.id}`}
                    >
                      <span className="trip-code">
                        {destinationCode(place)}
                      </span>
                      <span>
                        <b>{destinationCity(place)}</b>
                        <small>{b.ref}</small>
                      </span>
                    </Link>
                  </td>
                  <td>
                    <b>
                      {s.customers.find((c) => c.id === b.customerId)?.name}
                    </b>
                    <small>
                      {b.travelers.length} people · {b.travelers.length} pax
                    </small>
                  </td>
                  <td>
                    <b>
                      {displayDate(b.quotationSnapshot.departDate, "EEE d MMM")}
                    </b>
                    <small>{daysUntil(b.quotationSnapshot.departDate)}</small>
                  </td>
                  <td>
                    <StatusChip
                      tone={b.status === "Cancelled" ? "wait" : status.tone}
                    >
                      {bookingLabel(b.status)}
                    </StatusChip>
                  </td>
                  <td className="r num">{money(f.total)}</td>
                  <td className="paidbar">
                    <span className="num">
                      {money(f.paid)} ·{" "}
                      {f.total ? Math.round((f.paid / f.total) * 100) : 0}%
                    </span>
                    <Meter paid={f.paid} total={f.total} />
                  </td>
                  <td>
                    <Link
                      href={`/bookings/view?id=${b.id}`}
                      className="next-link"
                    >
                      <StatusChip
                        tone={
                          next?.deadlineLabel || f.status === "Overdue"
                            ? "late"
                            : next
                              ? "wait"
                              : "ok"
                        }
                      >
                        {b.status === "Cancelled"
                          ? "Trip closed"
                          : (next?.title ?? "Ready to fly")}
                      </StatusChip>
                    </Link>
                    <small>{next?.deadlineLabel ?? next?.detail}</small>
                  </td>
                  <td>
                    <span className="agent-dot" title={agent?.name}>
                      {agent?.initials}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!rows.length && <EmptyState text="No trips match this search." />}
      </section>
      <p className="list-footnote">
        Services and ticket references are recorded manually in this demo.
      </p>
    </>
  );
}
