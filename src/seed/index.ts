import { addDays, addMonths, format, startOfDay } from "date-fns";
import type { DemoData, Quotation, Booking } from "@/domain/types";
import { leadStages, sources } from "@/domain/types";
import { schemaVersion } from "@/store/migrate";
import { quoteTotals, insuranceLine } from "@/domain/quote";
export const checklistItems = [
  "Passport (valid at least 6 months)",
  "Completed application form",
  "Recent photo",
  "Bank certificate",
  "ITR / certificate of employment",
  "Travel itinerary",
  "Proof of accommodation",
];
/** Illustrative monthly pay and commission rules for the demo staff. */
export const demoPayRules: Record<
  string,
  { monthlyBaseCentavos: number; commissionPct: number }
> = {
  a2: { monthlyBaseCentavos: 2200000, commissionPct: 5 },
  a3: { monthlyBaseCentavos: 2000000, commissionPct: 5 },
  a4: { monthlyBaseCentavos: 2000000, commissionPct: 0 },
  a5: { monthlyBaseCentavos: 1800000, commissionPct: 0 },
};
const demoPay = (list: DemoData["agents"]) =>
  list.map((a) => ({ ...a, ...demoPayRules[a.id] }));
export function buildSeed(today = new Date()): DemoData {
  const day = startOfDay(today);
  const date = (offset: number) => format(addDays(day, offset), "yyyy-MM-dd");
  const names = [
    "Andrea Reyes",
    "Miguel Santos",
    "Camille Dela Cruz",
    "Paolo Mendoza",
    "Sofia Lim",
    "Rafael Garcia",
    "Bianca Navarro",
    "Gabriel Tan",
    "Patricia Flores",
    "Marco Villanueva",
    "Isabel Ramos",
    "Daniel Aquino",
    "Nicole Castillo",
    "Luis Bautista",
    "Alyssa Cruz",
    "Carlo Mercado",
    "Mikaela Torres",
    "Joshua Rivera",
    "Beatriz Santiago",
    "Enzo Valdez",
    "Julia Salazar",
    "Adrian Lorenzo",
    "Clara Domingo",
    "Noah Fernandez",
  ];
  const agents: DemoData["agents"] = [
    { id: "a1", name: "Isabel Santos", initials: "IS", role: "Owner" },
    ...demoPay([
      { id: "a2", name: "Katrina Ramos", initials: "KR", role: "Sales" },
      { id: "a3", name: "Nico Flores", initials: "NF", role: "Sales" },
      { id: "a4", name: "Luis Tan", initials: "LT", role: "Ticketing" },
      { id: "a5", name: "Mara Cruz", initials: "MC", role: "Visa" },
    ]),
  ];
  const destinations = [
    "Japan",
    "South Korea",
    "Hong Kong",
    "Singapore",
    "El Nido, Palawan",
    "Boracay",
  ];
  const packages = destinations.map((destination, i) => ({
    id: `pkg${i + 1}`,
    name: [
      "Tokyo–Osaka 6D5N",
      "Seoul Discovery 5D4N",
      "Hong Kong Escape 4D3N",
      "Singapore City Break 4D3N",
      "El Nido Island Days 4D3N",
      "Boracay Beach Retreat 4D3N",
    ][i],
    destination,
    nights: i === 0 ? 5 : i === 1 ? 4 : 3,
    basePricePerPaxCentavos: [
      5500000, 4200000, 2800000, 3100000, 2200000, 1800000,
    ][i],
    inclusions: [
      "Round-trip economy airfare",
      "Twin-sharing hotel accommodation",
      "Daily breakfast",
      "Scheduled tours and airport transfers",
      "Travel insurance",
    ],
    exclusions: [
      "Personal expenses",
      "Travel taxes unless listed",
      "Visa fees unless listed",
    ],
    itineraryDays:
      i === 0
        ? [
            "Arrive in Tokyo · airport transfer and hotel check-in",
            "Tokyo city tour · Asakusa, Shibuya and Meiji Shrine",
            "Mt. Fuji day trip · Lake Kawaguchiko",
            "Travel to Osaka · evening at Dotonbori",
            "Kyoto discovery · Fushimi Inari and Arashiyama",
            "Free time · airport transfer and departure",
          ]
        : [
            "Arrival and hotel check-in",
            "Guided city or island experience",
            "Free day to explore",
            "Check-out and return flight",
          ],
  }));
  const customers = names.map((name, i) => ({
    id: `c${i + 1}`,
    name,
    phone: `0900 000 ${String(i + 1).padStart(4, "0")}`,
    email: `${name.toLowerCase().replaceAll(" ", ".")}@example.com`,
    city: ["Quezon City", "Makati", "Pasig", "Cebu City"][i % 4],
    source: sources[i % sources.length],
    createdAt: date(-60 + i),
  }));
  const leads = names.slice(0, 18).map((_, i) => ({
    id: `l${i + 1}`,
    customerId: `c${i + 1}`,
    destination: destinations[i % 6],
    travelMonth: format(addDays(day, 45 + i * 2), "yyyy-MM"),
    paxCount: i === 0 ? 4 : 2 + (i % 3),
    budgetCentavos: (i === 0 ? 220000 : 80000 + i * 5000) * 100,
    stage: i === 0 ? ("Negotiating" as const) : leadStages[i % 6],
    assignedAgentId: `a${2 + (i % 2)}`,
    notes:
      i === 0
        ? [
            "Interested in Tokyo–Osaka for the family. Requested a flexible deposit plan.",
          ]
        : ["Illustrative inquiry — follow up on travel dates."],
    createdAt: date(-18 + i),
    lastContactAt: date(-(i % 7)),
  }));
  const quotations: Quotation[] = Array.from({ length: 8 }, (_, i) => ({
    id: `q${i + 1}`,
    ref: `HTT-Q-2026-${String(142 + i).padStart(4, "0")}`,
    leadId: `l${i + 1}`,
    customerId: `c${i + 1}`,
    packageId: `pkg${(i % 6) + 1}`,
    departDate: date(i === 0 ? 45 : 10 + i * 5),
    returnDate: date(i === 0 ? 50 : 14 + i * 5),
    paxCount: i === 0 ? 4 : 2 + (i % 3),
    lines: [
      {
        id: `ql${i}-1`,
        category: "Airfare",
        description: "Round-trip economy airfare",
        supplierName: "Skyline Wings (fictional)",
        costCentavos: i === 0 ? 2000000 : 1000000 + i * 50000,
        basis: "per_pax",
      },
      {
        id: `ql${i}-2`,
        category: "Hotel",
        description:
          i === 0
            ? "Tokyo & Osaka · 5 nights, twin sharing"
            : "Hotel accommodation with breakfast",
        supplierName: "Maple Stays (fictional)",
        costCentavos: i === 0 ? 1500000 : 800000,
        basis: "per_pax",
      },
      {
        id: `ql${i}-3`,
        category: "Tour",
        description: "Guided experiences and admission fees",
        supplierName: "Wanderlight Tours (fictional)",
        costCentavos: i === 0 ? 750000 : 400000,
        basis: "per_pax",
      },
      {
        id: `ql${i}-4`,
        category: "Transfer",
        description: "Private airport and city transfers",
        supplierName: "Haru Mobility (fictional)",
        costCentavos: i === 0 ? 3000000 : 1000000,
        basis: "per_group",
      },
      insuranceLine(`ql${i}-5`),
    ],
    // Fixed peso markup per traveler. Andrea's quote stays at ₱220,000.
    markupPerPaxCentavos: i === 0 ? 350000 : 150000 + (i % 3) * 50000,
    discountCentavos: 0,
    validUntil: date(i === 0 ? 3 : 2 + i),
    status: i === 0 ? "Sent" : "Accepted",
    version: 1,
    createdAt: date(-12 - i),
    itineraryDays: packages[i % 6].itineraryDays,
    ...(i === 0 && {
      flightDetails: [
        "Skyline Wings (fictional) · 4 adults · economy · 20 kg checked bag each",
        `Going · ${format(addDays(day, 45), "EEE d MMM")} · SW 412 Manila 08:05 → Tokyo Narita 13:30 · direct`,
        `Return · ${format(addDays(day, 50), "EEE d MMM")} · SW 921 Osaka Kansai 15:10 → Taipei 17:20, connecting SW 205 Taipei 18:40 → Manila 21:00`,
      ].join("\n"),
      flightScreenshots: ["/demo/flight-options-q1.png"],
    }),
  }));
  const bookings: Booking[] = quotations.slice(1).map((q, i) => ({
    id: `b${i + 1}`,
    ref: `HTT-B-2026-${String(81 + i).padStart(4, "0")}`,
    quotationId: q.id,
    quotationSnapshot: structuredClone(q),
    customerId: q.customerId,
    travelers: Array.from({ length: q.paxCount }, (_, j) => ({
      id: `t${i + 1}-${j + 1}`,
      fullName: j === 0 ? customers[i + 1].name : `Guest ${j + 1}`,
      birthDate: "1992-06-15",
      passportExpiry: date(i === 1 ? 90 : 900),
      visaRequired: ["Japan", "South Korea"].includes(
        packages.find((p) => p.id === q.packageId)?.destination ?? "",
      ),
    })),
    services: q.lines.map((l, j) => ({
      id: `svc${i}-${j}`,
      category: l.category,
      description: l.description,
      supplierName: l.supplierName,
      status:
        i === 0 && j === 0
          ? "On Hold"
          : i % 2 === 0
            ? "Confirmed"
            : "Requested",
      deadline: i === 0 && j === 0 ? `${date(1)}T17:00:00` : undefined,
    })),
    status: i % 2 === 0 ? "Confirmed" : "Pending Confirmation",
    assignedAgentId: `a${2 + (i % 2)}`,
    notes: ["Demo booking created. All services are simulated."],
    createdAt: format(
      addMonths(addDays(day, -i), -Math.floor(i / 2)),
      "yyyy-MM-dd",
    ),
  }));
  const installments = bookings.flatMap((b, i) => {
    const total = quoteTotals(b.quotationSnapshot).selling,
      deposit = Math.round(total * 0.3);
    return [
      {
        id: `ins${i}-1`,
        bookingId: b.id,
        label: "30% deposit",
        dueDate: date(i === 1 ? -7 : 3),
        amountCentavos: deposit,
      },
      {
        id: `ins${i}-2`,
        bookingId: b.id,
        label: "Final balance",
        dueDate: date(i === 1 ? -2 : 12 + i * 5),
        amountCentavos: total - deposit,
      },
    ];
  });
  const payments = bookings
    .filter((_, i) => i !== 1)
    .map((b, i) => ({
      id: `pay${i}`,
      bookingId: b.id,
      amountCentavos: Math.round(
        quoteTotals(b.quotationSnapshot).selling * 0.3,
      ),
      method: "Bank Transfer" as const,
      receivedAt: date(-2),
      receiptNo: `DEMO-P-${101 + i}`,
      note: "Simulated payment recorded manually",
    }));
  const visaTravelers = bookings
    .filter((b) => b.travelers.some((t) => t.visaRequired))
    .flatMap((b) =>
      b.travelers.slice(0, 2).map((traveler) => ({ booking: b, traveler })),
    );
  const visas: DemoData["visas"] = visaTravelers.map(
    ({ booking: b, traveler }, i) => {
      return {
        id: `v${i + 1}`,
        bookingId: b.id,
        travelerId: traveler.id,
        country: packages.find((p) => p.id === b.quotationSnapshot.packageId)!
          .destination,
        type: "Tourist · agency-lodged",
        stage:
          i < 3
            ? "Collecting Requirements"
            : i === 3
              ? "Under Review"
              : i === 4
                ? "Approved"
                : "Released",
        checklist: checklistItems.map((item, j) => ({
          item,
          done: i >= 3 || j < i + 2,
        })),
        assignedAgentId: "a5",
        notes: ["Simulated visa file. No application is submitted."],
      };
    },
  );
  return {
    schemaVersion,
    settings: { agencyName: "MEP Sabio Travel", logoText: "MEP" },
    currentAgentId: "a1",
    cashAdvances: [
      {
        id: "adv1",
        agentId: "a2",
        amountCentavos: 100000,
        date: date(0),
        note: "Cash advance (demo)",
      },
    ],
    paydays: [],
    agents,
    customers,
    leads,
    packages,
    quotations,
    bookings,
    payments,
    installments,
    visas,
  };
}
