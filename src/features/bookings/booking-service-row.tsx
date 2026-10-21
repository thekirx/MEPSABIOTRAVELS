"use client";
import { useState } from "react";
import { useTravelStore } from "@/store";
import { serviceStatuses, type BookingService } from "@/domain/types";
import { notify, DeadlineChip } from "@/components/shared";
import { Input } from "@/components/ui/input";
export function ServiceRow({
  bookingId,
  service: x,
}: {
  bookingId: string;
  service: BookingService;
}) {
  const s = useTravelStore();
  const [ref, setRef] = useState(x.supplierRef ?? "");
  return (
    <tr data-testid="service-row">
      <td>
        <b>{x.category}</b>
        <small>{x.description}</small>
      </td>
      <td>{x.supplierName}</td>
      <td>
        <label>
          <span className="control-label">Service status</span>
          <select
            aria-label="Service status"
            value={x.status}
            onChange={(e) =>
              notify(
                () =>
                  s.updateServiceStatus(
                    bookingId,
                    x.id,
                    e.target.value as BookingService["status"],
                    ref,
                    x.deadline,
                  ),
                "Service status recorded manually (simulated)",
              )
            }
          >
            {serviceStatuses.map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
        </label>
      </td>
      <td>
        <label>
          <span className="control-label">Supplier reference</span>
          <Input
            aria-label="Supplier reference"
            placeholder="Not yet"
            value={ref}
            onChange={(e) => setRef(e.target.value)}
            onBlur={() => {
              if (ref !== (x.supplierRef ?? ""))
                notify(
                  () =>
                    s.updateServiceStatus(
                      bookingId,
                      x.id,
                      x.status,
                      ref,
                      x.deadline,
                    ),
                  "Reference saved manually",
                );
            }}
          />
        </label>
      </td>
      <td>
        <label>
          <span className="control-label">Deadline</span>
          <Input
            aria-label="Service deadline"
            type="datetime-local"
            value={x.deadline ?? ""}
            onChange={(e) =>
              notify(
                () =>
                  s.updateServiceStatus(
                    bookingId,
                    x.id,
                    x.status,
                    ref,
                    e.target.value,
                  ),
                "Deadline updated",
              )
            }
          />
        </label>
        <DeadlineChip date={x.deadline} />
      </td>
    </tr>
  );
}
