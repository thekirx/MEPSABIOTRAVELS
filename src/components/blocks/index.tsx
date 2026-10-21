"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { money } from "@/domain/money";
import { destinationCode, destinationCity } from "@/domain/places";
import { differenceInCalendarDays, format, parseISO } from "date-fns";
export function Block({
  variant = "white",
  tag,
  title,
  children,
  action,
  className = "",
  ...props
}: {
  variant?: "char" | "lime" | "red" | "white" | "done";
  tag?: string;
  title?: string;
  children?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
} & React.HTMLAttributes<HTMLElement>) {
  return (
    <section {...props} className={`block ${variant} ${className}`}>
      {tag && <span className="tag">{tag}</span>}
      {title && <h3>{title}</h3>}
      {children}
      {action && <div className="block-actions">{action}</div>}
    </section>
  );
}
export function BigNumber({
  value,
  ...props
}: { value: number } & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div {...props} className={`big num ${props.className ?? ""}`}>
      {money(value)}
    </div>
  );
}
export function StatusChip({
  tone = "wait",
  children,
}: {
  tone?: "late" | "next" | "ok" | "wait" | "dark";
  children: React.ReactNode;
}) {
  return (
    <span className={`chip ${tone}`}>
      <i />
      {children}
    </span>
  );
}
export function LuggageTag({
  destination,
  date,
  name,
  people,
  status,
  tone,
  href,
}: {
  destination: string;
  date: string;
  name: string;
  people: number;
  status: string;
  tone: "late" | "ok" | "wait";
  href: string;
}) {
  return (
    <Link href={href} className="lug">
      <span className="code">{destinationCode(destination)}</span>
      <strong className="city">{destinationCity(destination)}</strong>
      <span className="when">
        {format(parseISO(date), "EEE d MMM")} · in{" "}
        {differenceInCalendarDays(parseISO(date), new Date())} days
      </span>
      <span className="who">
        {name}
        {people > 1 ? ` + ${people - 1}` : ""}
      </span>
      <span className={`strip ${tone}`}>
        <i />
        {status}
      </span>
    </Link>
  );
}
export function StageBlock({
  count,
  label,
  helper,
  active,
  onClick,
}: {
  count: number;
  label: string;
  helper: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button className="stage" aria-pressed={active} onClick={onClick}>
      <span className="n">{count}</span>
      <b>{label}</b>
      <span>{helper}</span>
    </button>
  );
}
export function HeadBlock({
  tag,
  title,
  facts,
  action,
}: {
  tag?: string;
  title: string;
  facts?: { label: string; value: React.ReactNode }[];
  action?: React.ReactNode;
}) {
  return (
    <header className="head-block">
      <div>
        {tag && <span className="tag">{tag}</span>}
        <h1>{title}</h1>
        {facts && (
          <div className="facts">
            {facts.map((f) => (
              <div key={f.label}>
                {f.label}
                <b>{f.value}</b>
              </div>
            ))}
          </div>
        )}
      </div>
      {action && <div className="acts">{action}</div>}
    </header>
  );
}
export function DetailLayout({
  sections,
  children,
}: {
  sections: { id: string; label: string; count?: number }[];
  children: React.ReactNode;
}) {
  const [active, setActive] = useState(sections[0]?.id ?? "");
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries
          .filter((e) => e.isIntersecting)
          .sort(
            (a, b) => a.boundingClientRect.top - b.boundingClientRect.top,
          )[0];
        if (first) setActive(first.target.id);
      },
      { rootMargin: "-100px 0px -45% 0px" },
    );
    for (const s of sections) {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, [sections]);
  return (
    <div className="detail">
      <nav className="subnav" aria-label="Sections">
        {sections.map((s) => (
          <a
            href={`#${s.id}`}
            key={s.id}
            className={active === s.id ? "on" : ""}
            onClick={() => setActive(s.id)}
          >
            {s.label}
            {s.count !== undefined && <small>{s.count}</small>}
          </a>
        ))}
      </nav>
      <div className="sections">{children}</div>
    </div>
  );
}
export function Sheet({
  id,
  title,
  note,
  action,
  children,
}: {
  id: string;
  title: string;
  note?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="sheet">
      <header className="sheet-h">
        <h2>{title}</h2>
        {note && <span className="note">{note}</span>}
        {action && <div className="right">{action}</div>}
      </header>
      {children}
    </section>
  );
}
export function KeyValues({
  items,
}: {
  items: { label: string; value: React.ReactNode }[];
}) {
  return (
    <div className="kv">
      {items.map((i) => (
        <div key={i.label}>
          {i.label}
          <b>{i.value}</b>
        </div>
      ))}
    </div>
  );
}
export function Meter({ paid, total }: { paid: number; total: number }) {
  return (
    <div
      className="meter"
      role="meter"
      aria-label="Payment progress"
      aria-valuenow={paid}
      aria-valuemin={0}
      aria-valuemax={total}
    >
      <span
        style={{
          width: `${total > 0 ? Math.min(100, (paid / total) * 100) : 0}%`,
        }}
      />
    </div>
  );
}
