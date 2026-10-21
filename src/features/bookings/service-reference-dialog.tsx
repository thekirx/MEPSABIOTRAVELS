"use client";
import { toast } from "sonner";
import { useTravelStore } from "@/store";
import { FormDialog } from "@/components/blocks/form-dialog";

export function ServiceReferenceDialog({
  bookingId,
  serviceId,
  onClose,
  onSaved,
}: {
  bookingId: string;
  serviceId: string;
  onClose: () => void;
  onSaved?: () => void;
}) {
  const s = useTravelStore();
  const service = s.bookings
    .find((b) => b.id === bookingId)
    ?.services.find((x) => x.id === serviceId);
  if (!service) return null;
  const airfare = service.category === "Airfare";
  return (
    <FormDialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title={
        airfare
          ? "Record plane ticket"
          : `Confirm the ${service.category.toLowerCase()}`
      }
      description="Recorded manually. This demo does not issue a real ticket or reservation."
      submit={airfare ? "Mark ticket issued" : "Save reference"}
      fields={[
        {
          name: "reference",
          label: airfare ? "Airline reference" : "Supplier reference",
          value: service.supplierRef ?? "",
          optional: true,
          validate: (value) =>
            !value.trim()
              ? airfare
                ? "Type the airline's reference first. A ticket can't be marked issued without it."
                : "Type the supplier reference first."
              : undefined,
        },
      ]}
      onSubmit={(values) => {
        s.updateServiceStatus(
          bookingId,
          serviceId,
          airfare ? "Issued" : "Confirmed",
          values.reference.trim(),
          airfare ? service.deadline : undefined,
        );
        onSaved?.();
        toast.success(
          airfare
            ? "Ticket recorded manually (simulated)."
            : "Reference recorded manually (simulated).",
        );
      }}
    />
  );
}
