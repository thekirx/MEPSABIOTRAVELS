"use client";
import { addMonths, parseISO } from "date-fns";
import { useTravelStore } from "@/store";
import { displayDate } from "@/domain/dates";
import type { Booking, Traveler } from "@/domain/types";
import { Sheet } from "@/components/blocks";
import { Button } from "@/components/ui/button";
export function BookingTravelers({
  booking: b,
  onEdit,
  onCreateVisa,
}: {
  booking: Booking;
  onEdit: (traveler?: Traveler) => void;
  onCreateVisa: (traveler: Traveler) => void;
}) {
  const s = useTravelStore(),
    q = b.quotationSnapshot;
  return (
    <Sheet
      id="travelers"
      title="Travelers"
      action={
        <Button variant="outline" onClick={() => onEdit()}>
          Add traveler
        </Button>
      }
    >
      <div className="table-wrap">
        <table className="t">
          <thead>
            <tr>
              <th>Name</th>
              <th>Birth date</th>
              <th>Passport</th>
              <th>Visa</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {b.travelers.map((tr) => {
              const warning =
                !tr.passportExpiry ||
                parseISO(tr.passportExpiry) <
                  addMonths(parseISO(q.returnDate), 6);
              const visa = s.visas.find(
                (v) => v.bookingId === b.id && v.travelerId === tr.id,
              );
              return (
                <tr key={tr.id} data-testid="traveler-row">
                  <td>
                    <b>{tr.fullName}</b>
                    {/^(Guest|Traveler)\s+\d+$/i.test(tr.fullName) && (
                      <small>Name needed</small>
                    )}
                  </td>
                  <td>{tr.birthDate ? displayDate(tr.birthDate) : "Needed"}</td>
                  <td>
                    {tr.passportExpiry
                      ? displayDate(tr.passportExpiry)
                      : "Needed"}
                    {warning && (
                      <small className="danger-text">
                        {tr.passportExpiry
                          ? "Expires less than 6 months after return"
                          : "Passport details required"}
                      </small>
                    )}
                  </td>
                  <td>
                    {tr.visaRequired ? (
                      <Button
                        variant="outline"
                        onClick={() => onCreateVisa(tr)}
                      >
                        {visa ? "Open visa case" : "Create visa case"}
                      </Button>
                    ) : (
                      "Not required"
                    )}
                  </td>
                  <td>
                    <Button variant="outline" onClick={() => onEdit(tr)}>
                      Edit details
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Sheet>
  );
}
