import { describe, expect, it } from "vitest";
import { dueLabel, lastContactLabel } from "@/domain/dates";
import { buildSeed } from "@/seed";
import { tripSteps } from "@/store/selectors";

describe("shared date copy", () => {
  const now = new Date(2026, 9, 21, 10);
  it("uses natural labels for zero, one and multiple days", () => {
    expect([0, 1, 2].map(lastContactLabel)).toEqual([
      "Talked today",
      "Talked yesterday",
      "Talked 2 days ago",
    ]);
  });
  it("formats today, tomorrow and later weekdays with an optional prefix", () => {
    expect(dueLabel("2026-10-21T17:00:00", now)).toBe("Today, 5 PM");
    expect(dueLabel("2026-10-22T17:00:00", now)).toBe("Tomorrow, 5 PM");
    expect(dueLabel("2026-10-24", now)).toBe("Sat 24 Oct");
    expect(dueLabel("2026-10-24", now, true)).toBe("By Sat 24 Oct");
    expect(dueLabel("2026-10-22T17:30:00", now)).toBe("Tomorrow, 5:30 PM");
  });
});
it("prioritizes Miguel's urgent airfare, then restores normal checklist order", () => {
  const s = buildSeed(),
    b = s.bookings.find((b) => b.id === "b1")!;
  const next = tripSteps(s, b).find((step) => !step.done)!;
  expect(next.title).toBe("Issue Miguel's plane ticket");
  expect(next.deadlineLabel).toBe("Tomorrow, 5 PM");
  expect(next.serviceId).toBe(b.services[0].id);
  b.services[0].status = "Issued";
  b.services[0].supplierRef = "SIM-TKT-7788";
  expect(tripSteps(s, b).find((step) => !step.done)?.id).toBe("passports");
});

import { displayNote } from "@/domain/dates";
it("formats generated history date prefixes without changing note text", () => {
  expect(displayNote("2026-10-21: Service issued — recorded manually.")).toBe(
    "Wed 21 Oct 2026: Service issued — recorded manually.",
  );
  expect(displayNote("Discuss 2026-10-21 with customer")).toBe(
    "Discuss 2026-10-21 with customer",
  );
});
