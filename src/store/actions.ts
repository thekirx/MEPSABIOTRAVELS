import type { StateCreator } from "zustand";
import type {
  DemoData,
  Lead,
  LeadStage,
  Quotation,
  Traveler,
  BookingService,
  Payment,
  PayslipRecord,
  VisaCase,
  Customer,
  Booking,
} from "@/domain/types";
import { buildSeed, checklistItems } from "@/seed";
import { quoteTotals, insuranceLine } from "@/domain/quote";
import { bookingFinancials } from "@/domain/payments";
import { addDays, format, isMatch } from "date-fns";
import { persistGate } from "./persist-gate";
const date = (offset = 0) => format(addDays(new Date(), offset), "yyyy-MM-dd");
export type Actions = {
  hydrated: boolean;
  setHydrated: () => void;
  resetDemo: () => void;
  createLead: (
    customer: Customer | Omit<Customer, "id" | "createdAt">,
    data: Pick<
      Lead,
      "destination" | "travelMonth" | "paxCount" | "assignedAgentId"
    >,
  ) => string;
  updateLeadStage: (id: string, stage: LeadStage) => void;
  addLeadNote: (id: string, note: string) => void;
  createQuotation: (leadId: string) => string;
  updateQuotation: (id: string, patch: Partial<Quotation>) => void;
  markQuotationSent: (id: string) => void;
  acceptQuotation: (id: string) => string;
  addTraveler: (bookingId: string, traveler: Omit<Traveler, "id">) => void;
  updateTraveler: (
    bookingId: string,
    id: string,
    patch: Partial<Traveler>,
  ) => void;
  updateServiceStatus: (
    bookingId: string,
    id: string,
    status: BookingService["status"],
    ref?: string,
    deadline?: string,
  ) => void;
  updateBooking: (
    id: string,
    patch: Partial<Pick<Booking, "status" | "assignedAgentId">>,
  ) => void;
  addBookingNote: (id: string, note: string) => void;
  recordPayment: (
    bookingId: string,
    amount: number,
    method: Payment["method"],
    note: string,
  ) => void;
  createVisaCase: (bookingId: string, travelerId: string) => string;
  toggleVisaChecklist: (id: string, index: number) => void;
  updateVisaStage: (id: string, stage: VisaCase["stage"]) => void;
  updateVisaDates: (
    id: string,
    submittedAt: string,
    expectedDecision: string,
  ) => void;
  addVisaNote: (id: string, note: string) => void;
  updateSettings: (settings: DemoData["settings"]) => void;
  setCurrentAgent: (id: string) => void;
  /** Client approves on their link and pays the deposit (simulated). */
  approveOnline: (
    quoteId: string,
    method: Payment["method"],
  ) => { bookingId: string; receiptNo: string };
  updatePay: (
    agentId: string,
    monthlyBaseCentavos: number,
    commissionPct: number,
  ) => void;
  addCashAdvance: (
    agentId: string,
    amountCentavos: number,
    note: string,
  ) => void;
  approvePayday: (period: string, slips: PayslipRecord[]) => void;
};
export type TravelStore = DemoData & Actions;
const clone = <T>(v: T): T => structuredClone(v);
export const createActions: StateCreator<TravelStore, [], [], Actions> = (
  set,
  get,
) => ({
  hydrated: false,
  setHydrated: () => set({ hydrated: true }),
  resetDemo: () => set({ ...buildSeed(), hydrated: true }),
  createLead: (customer, data) => {
    if (
      !data.destination.trim() ||
      !Number.isInteger(data.paxCount) ||
      data.paxCount < 1
    )
      throw new Error("Destination and positive traveler count required.");
    const id = `l${get().leads.length + 1}`;
    const c =
      "id" in customer
        ? customer
        : {
            ...customer,
            id: `c${get().customers.length + 1}`,
            createdAt: date(),
          };
    set((s) => ({
      customers: s.customers.some((x) => x.id === c.id)
        ? s.customers
        : [...s.customers, c],
      leads: [
        ...s.leads,
        {
          ...data,
          id,
          customerId: c.id,
          stage: "New Inquiry",
          createdAt: date(),
          lastContactAt: date(),
          notes: [],
        },
      ],
    }));
    return id;
  },
  updateLeadStage: (id, stage) =>
    set((s) => ({
      leads: s.leads.map((l) =>
        l.id === id ? { ...l, stage, lastContactAt: date() } : l,
      ),
    })),
  addLeadNote: (id, note) => {
    if (!note.trim()) return;
    set((s) => ({
      leads: s.leads.map((l) =>
        l.id === id
          ? { ...l, notes: [...l.notes, note], lastContactAt: date() }
          : l,
      ),
    }));
  },
  createQuotation: (leadId) => {
    const l = get().leads.find((x) => x.id === leadId);
    if (!l) throw new Error("Select an inquiry first.");
    const id = `q${get().quotations.length + 1}`;
    const q: Quotation = {
      id,
      ref: `HTT-Q-2026-${String(142 + get().quotations.length).padStart(4, "0")}`,
      leadId,
      customerId: l.customerId,
      departDate: date(45),
      returnDate: date(50),
      paxCount: l.paxCount,
      lines: [
        {
          id: `${id}-air`,
          category: "Airfare",
          description: "Round-trip economy airfare",
          supplierName: "Airline",
          costCentavos: 0,
          basis: "per_pax",
        },
        insuranceLine(`${id}-ins`),
      ],
      markupPerPaxCentavos: 100000,
      discountCentavos: 0,
      validUntil: date(7),
      status: "Draft",
      version: 1,
      createdAt: date(),
      itineraryDays: [],
    };
    set((s) => ({ quotations: [...s.quotations, q] }));
    return id;
  },
  updateQuotation: (id, patch) => {
    const q = get().quotations.find((x) => x.id === id);
    if (!q || q.status === "Accepted")
      throw new Error("Accepted quotations are read-only.");
    const next = {
      ...q,
      ...patch,
      ...("markupPerPaxCentavos" in patch && { markupPct: undefined }),
      id: q.id,
      status: q.status,
      version: q.version + 1,
      editHistory: [
        ...(q.editHistory ?? []),
        {
          version: q.version + 1,
          at: new Date().toISOString(),
          summary: `Updated ${Object.keys(patch).join(", ")}`,
        },
      ].slice(-20),
    };
    if (
      ![next.departDate, next.returnDate, next.validUntil].every((value) =>
        isMatch(value, "yyyy-MM-dd"),
      ) ||
      !Number.isInteger(next.paxCount) ||
      next.paxCount < 1 ||
      next.paxCount > 100 ||
      (next.markupPerPaxCentavos !== undefined &&
        (!Number.isSafeInteger(next.markupPerPaxCentavos) ||
          next.markupPerPaxCentavos < 0)) ||
      (next.markupPct !== undefined &&
        (!Number.isFinite(next.markupPct) || next.markupPct < 0)) ||
      (next.flightScreenshots?.length ?? 0) > 4 ||
      !Number.isSafeInteger(next.discountCentavos) ||
      next.discountCentavos < 0 ||
      next.lines.some(
        (l) => !Number.isSafeInteger(l.costCentavos) || l.costCentavos < 0,
      ) ||
      quoteTotals(next).selling < 0 ||
      next.returnDate < next.departDate
    )
      throw new Error("Check dates, travelers, markup and amounts.");
    set((s) => ({
      quotations: s.quotations.map((x) => (x.id === id ? next : x)),
    }));
  },
  markQuotationSent: (id) => {
    const q = get().quotations.find((x) => x.id === id);
    if (!q || q.status === "Accepted" || quoteTotals(q).selling <= 0)
      throw new Error("Add a priced line before sending.");
    set((s) => ({
      quotations: s.quotations.map((x) =>
        x.id === id ? { ...x, status: "Sent" } : x,
      ),
      leads: s.leads.map((l) =>
        l.id === q.leadId ? { ...l, stage: "Quoted" } : l,
      ),
    }));
  },
  acceptQuotation: (id) => {
    const existing = get().bookings.find((b) => b.quotationId === id);
    if (existing) return existing.id;
    const q = get().quotations.find((x) => x.id === id);
    if (
      !q ||
      !["Draft", "Sent"].includes(q.status) ||
      quoteTotals(q).selling <= 0
    )
      throw new Error("Only priced active quotations can be accepted.");
    const snapshot = clone({ ...q, status: "Accepted" as const });
    const bid = `b${get().bookings.length + 1}`,
      total = quoteTotals(q).selling,
      deposit = Math.round(total * 0.3);
    const b: Booking = {
      id: bid,
      ref: `HTT-B-2026-${String(81 + get().bookings.length).padStart(4, "0")}`,
      quotationId: id,
      quotationSnapshot: snapshot,
      customerId: q.customerId,
      travelers: Array.from({ length: q.paxCount }, (_, i) => ({
        id: `${bid}-t${i + 1}`,
        fullName: `Traveler ${i + 1}`,
        birthDate: "",
        passportExpiry: "",
        visaRequired: q.packageId === "pkg1" || q.packageId === "pkg2",
      })),
      services: q.lines.map((l, i) => ({
        id: `${bid}-s${i}`,
        category: l.category,
        description: l.description,
        supplierName: l.supplierName,
        status: "Requested",
      })),
      status: "Pending Confirmation",
      assignedAgentId:
        q.assignedAgentId ??
        get().leads.find((l) => l.id === q.leadId)!.assignedAgentId,
      notes: [
        "Quotation accepted in demo. Services requested; no real booking made.",
      ],
      createdAt: date(),
    };
    const balanceDate = format(
      addDays(new Date(q.departDate + "T12:00:00"), -30),
      "yyyy-MM-dd",
    );
    set((s) => ({
      quotations: s.quotations.map((x) => (x.id === id ? snapshot : x)),
      leads: s.leads.map((l) =>
        l.id === q.leadId ? { ...l, stage: "Won" } : l,
      ),
      bookings: [...s.bookings, b],
      installments: [
        ...s.installments,
        {
          id: `${bid}-deposit`,
          bookingId: bid,
          label: "30% deposit",
          dueDate: date(3),
          amountCentavos: deposit,
        },
        {
          id: `${bid}-balance`,
          bookingId: bid,
          label: "Final balance",
          dueDate: balanceDate,
          amountCentavos: total - deposit,
        },
      ],
    }));
    return bid;
  },
  addTraveler: (bookingId, t) => {
    if (!t.fullName.trim()) throw new Error("Traveler name required.");
    set((s) => ({
      bookings: s.bookings.map((b) =>
        b.id === bookingId
          ? {
              ...b,
              travelers: [
                ...b.travelers,
                { ...t, id: `${b.id}-t${b.travelers.length + 1}` },
              ],
            }
          : b,
      ),
    }));
  },
  updateTraveler: (bookingId, id, patch) =>
    set((s) => ({
      bookings: s.bookings.map((b) =>
        b.id === bookingId
          ? {
              ...b,
              travelers: b.travelers.map((t) =>
                t.id === id ? { ...t, ...patch, id: t.id } : t,
              ),
            }
          : b,
      ),
    })),
  updateServiceStatus: (bookingId, id, status, ref, deadline) => {
    if (status === "Issued" && !ref?.trim())
      throw new Error("Enter a simulated ticket / confirmation number first.");
    set((s) => ({
      bookings: s.bookings.map((b) =>
        b.id === bookingId
          ? {
              ...b,
              services: b.services.map((x) =>
                x.id === id ? { ...x, status, supplierRef: ref, deadline } : x,
              ),
              notes: [
                ...b.notes,
                `${date()}: Service ${status.toLowerCase()} — recorded manually (simulated).`,
              ],
            }
          : b,
      ),
    }));
  },
  updateBooking: (id, patch) =>
    set((s) => ({
      bookings: s.bookings.map((b) => (b.id === id ? { ...b, ...patch } : b)),
    })),
  addBookingNote: (id, note) => {
    if (!note.trim()) return;
    set((s) => ({
      bookings: s.bookings.map((b) =>
        b.id === id ? { ...b, notes: [...b.notes, `${date()}: ${note}`] } : b,
      ),
    }));
  },
  recordPayment: (bookingId, amountCentavos, method, note) => {
    const s = get(),
      b = s.bookings.find((b) => b.id === bookingId);
    if (!b) throw new Error("Booking not found.");
    const f = bookingFinancials(b, s.payments, s.installments);
    if (
      b.status === "Cancelled" ||
      !Number.isSafeInteger(amountCentavos) ||
      amountCentavos <= 0 ||
      amountCentavos > f.balance
    )
      throw new Error("Enter a positive amount no greater than the balance.");
    set((s) => ({
      payments: [
        ...s.payments,
        {
          id: `pay${s.payments.length + 1}`,
          bookingId,
          amountCentavos,
          method,
          receivedAt: date(),
          receiptNo: `DEMO-P-${101 + s.payments.length}`,
          note,
        },
      ],
      bookings: s.bookings.map((b) =>
        b.id === bookingId
          ? {
              ...b,
              notes: [
                ...b.notes,
                `${date()}: Simulated payment recorded manually.`,
              ],
            }
          : b,
      ),
    }));
  },
  createVisaCase: (bookingId, travelerId) => {
    const existing = get().visas.find(
      (v) => v.bookingId === bookingId && v.travelerId === travelerId,
    );
    if (existing) return existing.id;
    const b = get().bookings.find((b) => b.id === bookingId);
    if (!b?.travelers.some((t) => t.id === travelerId))
      throw new Error("Traveler not found.");
    const id = `v${get().visas.length + 1}`;
    set((s) => ({
      visas: [
        ...s.visas,
        {
          id,
          bookingId,
          travelerId,
          country:
            s.packages.find((p) => p.id === b.quotationSnapshot.packageId)
              ?.destination ?? "Japan",
          type: "Tourist · agency-lodged",
          stage: "Collecting Requirements",
          checklist: checklistItems.map((item) => ({ item, done: false })),
          assignedAgentId: "a5",
          notes: ["Demo case created. No application submitted."],
        },
      ],
    }));
    return id;
  },
  toggleVisaChecklist: (id, index) =>
    set((s) => ({
      visas: s.visas.map((v) =>
        v.id === id
          ? {
              ...v,
              checklist: v.checklist.map((c, i) =>
                i === index ? { ...c, done: !c.done } : c,
              ),
            }
          : v,
      ),
    })),
  updateVisaStage: (id, stage) =>
    set((s) => ({
      visas: s.visas.map((v) => (v.id === id ? { ...v, stage } : v)),
    })),
  updateVisaDates: (id, submittedAt, expectedDecision) =>
    set((s) => ({
      visas: s.visas.map((v) =>
        v.id === id ? { ...v, submittedAt, expectedDecision } : v,
      ),
    })),
  addVisaNote: (id, note) => {
    if (!note.trim()) return;
    set((s) => ({
      visas: s.visas.map((v) =>
        v.id === id ? { ...v, notes: [...v.notes, note] } : v,
      ),
    }));
  },
  setCurrentAgent: (id) => {
    if (!get().agents.some((a) => a.id === id))
      throw new Error("Choose a staff member.");
    set({ currentAgentId: id });
  },
  approveOnline: (quoteId, method) => {
    const q = get().quotations.find((x) => x.id === quoteId);
    if (!q) throw new Error("This quotation link is not valid.");
    if (q.status !== "Draft" && q.status !== "Sent")
      throw new Error("This quotation can no longer be approved.");
    if (q.validUntil < date())
      throw new Error("This quotation has expired. Ask us for a new one.");
    // Save booking, payment and approval together as one change.
    persistGate.paused = true;
    const before = get();
    let bookingId: string;
    try {
      bookingId = get().acceptQuotation(quoteId);
      const deposit = get().installments.find(
        (i) => i.bookingId === bookingId && i.label === "30% deposit",
      )!;
      get().recordPayment(
        bookingId,
        deposit.amountCentavos,
        method,
        `Deposit paid online by the client via ${method} (simulated).`,
      );
      const at = new Date().toISOString();
      set((s) => ({
        quotations: s.quotations.map((x) =>
          x.id === quoteId ? { ...x, clientApprovedAt: at } : x,
        ),
        bookings: s.bookings.map((b) =>
          b.id === bookingId
            ? {
                ...b,
                quotationSnapshot: {
                  ...b.quotationSnapshot,
                  clientApprovedAt: at,
                },
                // Deposit is in: hold the fare and give Ticketing a deadline.
                services: b.services.map((x) =>
                  x.category === "Airfare" && x.status === "Requested"
                    ? {
                        ...x,
                        status: "On Hold" as const,
                        deadline: `${date(1)}T17:00:00`,
                      }
                    : x,
                ),
                notes: [
                  ...b.notes,
                  `${date()}: Client approved the quote online and paid the deposit (simulated).`,
                ],
              }
            : b,
        ),
      }));
    } catch (e) {
      set(before, true); // undo the half-finished booking
      throw e;
    } finally {
      persistGate.paused = false;
    }
    // One write with the final state.
    set((s) => ({ ...s }));
    return {
      bookingId,
      receiptNo: get().payments[get().payments.length - 1].receiptNo,
    };
  },
  updatePay: (agentId, monthlyBaseCentavos, commissionPct) => {
    if (
      !Number.isSafeInteger(monthlyBaseCentavos) ||
      monthlyBaseCentavos < 0 ||
      !Number.isFinite(commissionPct) ||
      commissionPct < 0 ||
      commissionPct > 50
    )
      throw new Error(
        "Enter a base pay of ₱0 or more and a commission of 0–50%.",
      );
    set((s) => ({
      agents: s.agents.map((a) =>
        a.id === agentId ? { ...a, monthlyBaseCentavos, commissionPct } : a,
      ),
    }));
  },
  addCashAdvance: (agentId, amountCentavos, note) => {
    if (!Number.isSafeInteger(amountCentavos) || amountCentavos <= 0)
      throw new Error("Enter an amount above ₱0.");
    set((s) => ({
      cashAdvances: [
        ...s.cashAdvances,
        {
          id: `adv${s.cashAdvances.length + 1}`,
          agentId,
          amountCentavos,
          date: date(),
          note: note.trim() || "Cash advance",
        },
      ],
    }));
  },
  approvePayday: (period, slips) => {
    const s = get();
    if (s.agents.find((a) => a.id === s.currentAgentId)?.role !== "Owner")
      throw new Error("Only the owner can approve payday.");
    if (s.paydays.some((p) => p.period === period)) return;
    set({
      paydays: [
        ...s.paydays,
        {
          period,
          approvedAt: new Date().toISOString(),
          approvedBy: s.currentAgentId,
          slips,
        },
      ],
    });
  },
  updateSettings: (settings) => {
    if (!settings.agencyName.trim() || !settings.logoText.trim())
      throw new Error("Agency name and logo text are required.");
    set({ settings });
  },
});
