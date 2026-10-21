import { expect, it } from "vitest";
import { buildSeed } from "@/seed";
import { destination, visaCounts } from "@/store/selectors";
it("seeds six distinct visa cases only on Japan and Korea travelers with matching countries", () => {
  const s = buildSeed(new Date(2026, 9, 21));
  const eligible = s.bookings.filter((b) =>
    ["Japan", "South Korea"].includes(destination(s, b.quotationSnapshot)),
  );
  expect(eligible.map((b) => b.id)).toEqual(["b1", "b6", "b7"]);
  expect(eligible.flatMap((b) => b.travelers)).toHaveLength(8);
  for (const b of s.bookings)
    expect(
      b.travelers.every((t) => t.visaRequired === eligible.includes(b)),
    ).toBe(true);
  expect(s.visas).toHaveLength(6);
  expect(
    new Set(s.visas.map((v) => `${v.bookingId}:${v.travelerId}`)).size,
  ).toBe(6);
  expect(new Set(s.visas.map((v) => v.bookingId))).toEqual(
    new Set(["b1", "b6", "b7"]),
  );
  for (const v of s.visas) {
    const b = s.bookings.find((b) => b.id === v.bookingId)!;
    expect(v.country).toBe(destination(s, b.quotationSnapshot));
    expect(b.travelers.find((t) => t.id === v.travelerId)?.visaRequired).toBe(
      true,
    );
  }
  expect(visaCounts(s)).toMatchObject({
    "Collecting Requirements": 3,
    "Under Review": 1,
    Approved: 1,
    Released: 1,
  });
});
