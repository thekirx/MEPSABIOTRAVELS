"use client";
import Link from "next/link";
import { differenceInHours, format } from "date-fns";
import { ArrowUpRight, Inbox } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { money } from "@/domain/money";
import { toast } from "sonner";
export function notify(action: () => void, message = "Changes saved") {
  try {
    action();
    toast.success(message);
  } catch (e) {
    toast.error(e instanceof Error ? e.message : "Unable to save changes.");
  }
}
export function StatusBadge({ status }: { status: string }) {
  const tone = /Overdue|Denied|Lost|Cancelled|Declined/.test(status)
    ? "danger"
    : /Fully Paid|Approved|Released|Won|Confirmed|Issued|Accepted|Complete/.test(
          status,
        )
      ? "positive"
      : /Hold|Pending|Negotiating|Collecting|Unpaid/.test(status)
        ? "warning"
        : "neutral";
  return (
    <Badge variant="outline" className={`status ${tone}`}>
      {status}
    </Badge>
  );
}
export function MoneyCell({ value }: { value: number }) {
  return <span className="money">{money(value)}</span>;
}
export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      <div className="heading-actions">{action}</div>
    </div>
  );
}
export function EmptyState({
  text = "No records to show.",
}: {
  text?: string;
}) {
  return (
    <div className="empty">
      <Inbox size={28} />
      <p>{text}</p>
    </div>
  );
}
export function DeadlineChip({ date }: { date?: string }) {
  if (!date) return <span className="muted">No deadline</span>;
  const h = differenceInHours(new Date(date), new Date());
  return (
    <Badge
      variant="outline"
      className={`status ${h < 0 ? "danger" : h < 72 ? "warning" : "neutral"}`}
    >
      {h < 0 ? "Past deadline · " : h < 48 ? "Due soon · " : ""}
      {format(new Date(date), "MMM d, h:mm a")}
    </Badge>
  );
}
export function KpiCard({
  label,
  value,
  href,
  icon: Icon,
  hint,
}: {
  label: string;
  value: React.ReactNode;
  href: string;
  icon: React.ElementType;
  hint: string;
}) {
  return (
    <Link className="kpi" href={href}>
      <div className="kpi-top">
        <span>{label}</span>
        <Icon size={18} />
      </div>
      <strong>{value}</strong>
      <div className="kpi-bottom">
        <span>{hint}</span>
        <ArrowUpRight size={14} />
      </div>
    </Link>
  );
}
export function Modal({
  open,
  onOpenChange,
  title,
  description,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {description ?? "All changes apply to this simulated demo only."}
          </DialogDescription>
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
}
export function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  );
}
export function Select({
  label,
  value,
  onChange,
  options,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: readonly string[];
  disabled?: boolean;
}) {
  return (
    <select
      aria-label={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
    >
      {options.map((o) => (
        <option key={o}>{o}</option>
      ))}
    </select>
  );
}
export function NoteForm({ onAdd }: { onAdd: (note: string) => void }) {
  return (
    <form
      className="inline-form"
      onSubmit={(e) => {
        e.preventDefault();
        const form = e.currentTarget;
        const note = String(new FormData(form).get("note") ?? "");
        if (note.trim()) {
          notify(() => onAdd(note), "Note added");
          form.reset();
        }
      }}
    >
      <Input
        name="note"
        aria-label="Add note"
        placeholder="Add an internal note…"
        required
      />
      <Button type="submit" variant="outline">
        Add note
      </Button>
    </form>
  );
}
