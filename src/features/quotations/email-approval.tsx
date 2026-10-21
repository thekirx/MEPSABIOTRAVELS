"use client";
import { useState } from "react";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";
import { useTravelStore } from "@/store";
import { destination } from "@/store/selectors";
import { destinationCity } from "@/domain/places";
import { quoteTotals, hasInsurance } from "@/domain/quote";
import { money } from "@/domain/money";
import type { Quotation } from "@/domain/types";
import { Modal, Field } from "@/components/shared";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

function draft(
  q: Quotation,
  s: ReturnType<typeof useTravelStore.getState>,
): { to: string; subject: string; body: string } {
  const customer = s.customers.find((c) => c.id === q.customerId);
  const agentId =
    q.assignedAgentId ??
    s.leads.find((l) => l.id === q.leadId)?.assignedAgentId;
  const agent = s.agents.find((a) => a.id === agentId);
  const first = customer?.name.split(" ")[0] ?? "there";
  const t = quoteTotals(q);
  const city = destinationCity(destination(s, q));
  const dates = `${format(parseISO(q.departDate), "d MMM")} to ${format(parseISO(q.returnDate), "d MMM yyyy")}`;
  const body = [
    `Hi ${first},`,
    "",
    `Thank you for your inquiry. Here is your quotation for ${city}, ${dates}, for ${q.paxCount} ${q.paxCount === 1 ? "person" : "people"}.`,
    ...(q.flightDetails?.trim()
      ? ["", "Your flights:", q.flightDetails.trim()]
      : []),
    "",
    `Total: ${money(t.selling)} (${money(t.perPax)} per person)${hasInsurance(q) ? ", travel insurance included" : ""}.`,
    `Deposit (30%): ${money(Math.round(t.selling * 0.3))}, due within 3 days of approval.`,
    `This quotation is valid until ${format(parseISO(q.validUntil), "d MMM yyyy")}. Fares can change until tickets are issued.`,
    "",
    "The full quotation with your flight details is attached as a PDF.",
    'Please reply "Approved" and we will secure your booking.',
    "",
    "Thank you,",
    agent?.name ?? "",
    s.settings.agencyName,
  ].join("\n");
  return {
    to: customer?.email ?? "",
    subject: `Your ${city} quotation · ${q.ref}`,
    body,
  };
}

export function EmailApprovalDialog({
  q,
  open,
  onOpenChange,
}: {
  q: Quotation;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const s = useTravelStore();
  // Mounted only while open, so the draft always matches the current quote.
  const [mail, setMail] = useState(() => draft(q, s));
  const sent = () => {
    if (q.status !== "Draft") return;
    try {
      s.markQuotationSent(q.id);
      toast.success("Quote marked as sent");
    } catch (e) {
      toast.error((e as Error).message);
    }
  };
  const href = `mailto:${encodeURI(mail.to.trim())}?subject=${encodeURIComponent(mail.subject)}&body=${encodeURIComponent(mail.body)}`;
  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Email for approval"
      description="Save the quote as a PDF, attach it, and send. The customer replies to approve."
    >
      <div className="section-stack email-approval">
        <Field label="To">
          <Input
            aria-label="Email to"
            value={mail.to}
            onChange={(e) => setMail({ ...mail, to: e.target.value })}
          />
        </Field>
        <Field label="Subject">
          <Input
            aria-label="Email subject"
            value={mail.subject}
            onChange={(e) => setMail({ ...mail, subject: e.target.value })}
          />
        </Field>
        <Field label="Message">
          <textarea
            aria-label="Email message"
            rows={12}
            value={mail.body}
            onChange={(e) => setMail({ ...mail, body: e.target.value })}
          />
        </Field>
        <ol className="email-steps">
          <li>
            <button className="linkish" onClick={() => window.print()}>
              Save the quote as PDF
            </button>{" "}
            (choose &ldquo;Save as PDF&rdquo; in the print window).
          </li>
          <li>Open the email, attach the PDF, and send.</li>
        </ol>
        <div className="dialog-actions">
          <Button
            variant="outline"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(mail.body);
                toast.success("Message copied. Paste it into your email.");
                sent();
              } catch {
                toast.error("Couldn't copy. Select the message and copy it.");
              }
            }}
          >
            Copy message
          </Button>
          <a
            className="btn"
            href={href}
            onClick={() => {
              sent();
              onOpenChange(false);
            }}
          >
            Open email
          </a>
        </div>
      </div>
    </Modal>
  );
}
