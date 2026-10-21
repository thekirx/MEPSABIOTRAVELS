"use client";
import { toast } from "sonner";
import { useTravelStore } from "@/store";
import { sources } from "@/domain/types";
import { FormDialog } from "@/components/blocks/form-dialog";
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
