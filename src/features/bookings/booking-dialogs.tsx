"use client";
import { toast } from "sonner";
import { format, isMatch } from "date-fns";
import { useTravelStore } from "@/store";
import type { Booking, Traveler } from "@/domain/types";
import { FormDialog, type FormField } from "@/components/blocks/form-dialog";
const checkName = (v: string) =>
  v.trim().length < 2 || /^(Guest|Traveler)\s+\d+$/i.test(v.trim())
    ? "Enter a full synthetic demo name."
    : undefined;
const checkDate = (v: string) =>
  !isMatch(v, "yyyy-MM-dd") ? "Enter a valid date." : undefined;
export function TravelerDialog({
  booking,
  traveler,
  open,
  onClose,
}: {
  booking: Booking;
  traveler?: Traveler;
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
      title={traveler ? "Edit traveler" : "Add traveler"}
      submit={traveler ? "Save traveler" : "Add traveler"}
      description="Use synthetic demo details only. Passport validity is checked against the return date."
      fields={[
        {
          name: "name",
          label: "Full name",
          value: traveler?.fullName ?? "",
          validate: checkName,
        },
        {
          name: "birth",
          label: "Date of birth",
          type: "date",
          value: traveler?.birthDate ?? "",
          validate: (v) =>
            checkDate(v) ||
            (v > format(new Date(), "yyyy-MM-dd")
              ? "Birth date cannot be in the future."
              : undefined),
        },
        {
          name: "expiry",
          label: "Passport expiry",
          type: "date",
          value: traveler?.passportExpiry ?? "",
          validate: checkDate,
        },
        {
          name: "visa",
          label: "Visa required",
          options: ["Yes", "No"],
          value:
            (traveler?.visaRequired ??
            booking.travelers.some((t) => t.visaRequired))
              ? "Yes"
              : "No",
        },
      ]}
      onSubmit={(v) => {
        const patch = {
          fullName: v.name.trim(),
          birthDate: v.birth,
          passportExpiry: v.expiry,
          visaRequired: v.visa === "Yes",
        };
        if (traveler) s.updateTraveler(booking.id, traveler.id, patch);
        else s.addTraveler(booking.id, patch);
        toast.success("Traveler details saved.");
      }}
    />
  );
}
export function AllTravelersDialog({
  booking,
  open,
  onClose,
}: {
  booking: Booking;
  open: boolean;
  onClose: () => void;
}) {
  const s = useTravelStore();
  const fields: FormField[] = booking.travelers.flatMap((t, i) => [
    {
      name: `name-${t.id}`,
      label: `Traveler ${i + 1} full name`,
      value: t.fullName,
      validate: checkName,
    },
    {
      name: `birth-${t.id}`,
      label: `Traveler ${i + 1} date of birth`,
      type: "date",
      value: t.birthDate,
      validate: checkDate,
    },
    {
      name: `expiry-${t.id}`,
      label: `Traveler ${i + 1} passport expiry`,
      type: "date",
      value: t.passportExpiry,
      validate: checkDate,
    },
  ]);
  return (
    <FormDialog
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
      title="Everyone's passport details"
      description="Use synthetic names and dates. No real passport information."
      submit="Save travelers"
      fields={fields}
      onSubmit={(v) => {
        booking.travelers.forEach((t) =>
          s.updateTraveler(booking.id, t.id, {
            fullName: v[`name-${t.id}`].trim(),
            birthDate: v[`birth-${t.id}`],
            passportExpiry: v[`expiry-${t.id}`],
          }),
        );
        toast.success("Traveler details saved.");
      }}
    />
  );
}
export function SupplierReferencesDialog({
  booking,
  mode,
  open,
  onClose,
}: {
  booking: Booking;
  mode: "Confirmed" | "Issued";
  open: boolean;
  onClose: () => void;
}) {
  const s = useTravelStore();
  const services = booking.services.filter(
    (x) =>
      x.status !== "Cancelled" &&
      (mode === "Issued"
        ? x.category === "Airfare" && x.status !== "Issued"
        : !["Confirmed", "Issued"].includes(x.status)),
  );
  return (
    <FormDialog
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
      title={mode === "Issued" ? "Record plane tickets" : "Supplier references"}
      description="These confirmations are recorded manually. No real tickets or reservations are issued."
      submit={mode === "Issued" ? "Mark tickets issued" : "Mark all confirmed"}
      fields={services.map((x) => ({
        name: x.id,
        label: `${x.category} · ${x.supplierName}`,
        value: x.supplierRef ?? "",
        validate: (v) =>
          !v.trim() ? "Type the supplier reference first." : undefined,
        optional: true,
      }))}
      onSubmit={(v) => {
        services.forEach((x) =>
          s.updateServiceStatus(booking.id, x.id, mode, v[x.id], x.deadline),
        );
        toast.success(
          mode === "Issued"
            ? "Tickets recorded manually (simulated)."
            : "Supplier references confirmed (simulated).",
        );
      }}
    />
  );
}
