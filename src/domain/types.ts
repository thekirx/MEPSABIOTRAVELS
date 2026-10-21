export const leadStages = [
  "New Inquiry",
  "Contacted",
  "Quoted",
  "Negotiating",
  "Won",
  "Lost",
] as const;
export type LeadStage = (typeof leadStages)[number];
export const quoteStatuses = [
  "Draft",
  "Sent",
  "Accepted",
  "Expired",
  "Declined",
] as const;
export const bookingStatuses = [
  "Pending Confirmation",
  "Confirmed",
  "Ticketed / Documents Issued",
  "Completed",
  "Cancelled",
] as const;
export const serviceStatuses = [
  "Requested",
  "On Hold",
  "Confirmed",
  "Issued",
  "Cancelled",
] as const;
export const visaStages = [
  "Collecting Requirements",
  "Complete",
  "Lodged with Embassy",
  "Under Review",
  "Approved",
  "Denied",
  "Released",
] as const;
export const sources = [
  "Email",
  "Facebook Messenger",
  "Walk-in",
  "Viber",
  "Referral",
  "Website",
] as const;
export const methods = [
  "Bank Transfer",
  "GCash",
  "Maya",
  "Cash",
  "Card (manual)",
] as const;
export const categories = [
  "Airfare",
  "Hotel",
  "Tour",
  "Transfer",
  "Visa Fee",
  "Insurance",
  "Other",
] as const;
export type Agent = {
  id: string;
  name: string;
  initials: string;
  role: "Sales" | "Ticketing" | "Visa" | "Owner";
  /** Monthly base pay in centavos (demo payroll). */
  monthlyBaseCentavos?: number;
  /** Commission as a percent of profit on bookings this person closed. */
  commissionPct?: number;
};
export type CashAdvance = {
  id: string;
  agentId: string;
  amountCentavos: number;
  date: string;
  note: string;
};
/** An approved payday, keyed like "2026-10-2" (second half of October). */
export type PayslipRecord = {
  agentId: string;
  base: number;
  commission: number;
  commissionBookings: { id: string; ref: string; profit: number }[];
  gross: number;
  sss: number;
  philhealth: number;
  pagibig: number;
  tax: number;
  advances: number;
  deductions: number;
  net: number;
};
export type Payday = {
  period: string;
  approvedAt: string;
  approvedBy: string;
  /** Payslips frozen at approval, so later pay changes don't rewrite them. */
  slips: PayslipRecord[];
};
export type Customer = {
  id: string;
  name: string;
  phone: string;
  email: string;
  city: string;
  source: (typeof sources)[number];
  createdAt: string;
};
export type Lead = {
  id: string;
  customerId: string;
  destination: string;
  travelMonth: string;
  paxCount: number;
  budgetCentavos?: number;
  stage: LeadStage;
  assignedAgentId: string;
  notes: string[];
  createdAt: string;
  lastContactAt: string;
};
export type Package = {
  id: string;
  name: string;
  destination: string;
  nights: number;
  basePricePerPaxCentavos: number;
  inclusions: string[];
  exclusions: string[];
  itineraryDays: string[];
};
export type QuoteLine = {
  id: string;
  category: (typeof categories)[number];
  description: string;
  supplierName: string;
  costCentavos: number;
  basis: "per_pax" | "per_group";
  currencyNote?: string;
};
export type Quotation = {
  inclusions?: string[];
  exclusions?: string[];
  terms?: string;
  assignedAgentId?: string;
  editHistory?: { version: number; at: string; summary: string }[];
  id: string;
  ref: string;
  leadId: string;
  customerId: string;
  packageId?: string;
  departDate: string;
  returnDate: string;
  paxCount: number;
  lines: QuoteLine[];
  /** Fixed peso markup added for each traveler, in centavos. */
  markupPerPaxCentavos?: number;
  /** Old percentage markup. Only kept on quotes saved before peso markup. */
  markupPct?: number;
  /** Flight options as the agent found them: airline, flight numbers, times, connections. */
  flightDetails?: string;
  /** Screenshots of the flight details (compressed image data URLs). */
  flightScreenshots?: string[];
  /** Set when the client approved through their approval link. */
  clientApprovedAt?: string;
  discountCentavos: number;
  validUntil: string;
  status: (typeof quoteStatuses)[number];
  version: number;
  createdAt: string;
  itineraryDays: string[];
};
export type Traveler = {
  id: string;
  fullName: string;
  birthDate: string;
  passportExpiry: string;
  visaRequired: boolean;
};
export type BookingService = {
  id: string;
  category: (typeof categories)[number];
  description: string;
  supplierName: string;
  status: (typeof serviceStatuses)[number];
  supplierRef?: string;
  deadline?: string;
};
export type Booking = {
  id: string;
  ref: string;
  quotationId: string;
  quotationSnapshot: Quotation;
  customerId: string;
  travelers: Traveler[];
  services: BookingService[];
  status: (typeof bookingStatuses)[number];
  assignedAgentId: string;
  notes: string[];
  createdAt: string;
};
export type Payment = {
  id: string;
  bookingId: string;
  amountCentavos: number;
  method: (typeof methods)[number];
  receivedAt: string;
  receiptNo: string;
  note?: string;
};
export type Installment = {
  id: string;
  bookingId: string;
  label: string;
  dueDate: string;
  amountCentavos: number;
};
export type VisaCase = {
  id: string;
  bookingId?: string;
  travelerId: string;
  country: string;
  type: string;
  stage: (typeof visaStages)[number];
  checklist: { item: string; done: boolean }[];
  submittedAt?: string;
  expectedDecision?: string;
  assignedAgentId: string;
  notes: string[];
};
export type DemoData = {
  schemaVersion: number;
  settings: { agencyName: string; logoText: string; logoDataUrl?: string };
  /** Who is using the portal right now (demo staff switcher). */
  currentAgentId: string;
  agents: Agent[];
  cashAdvances: CashAdvance[];
  paydays: Payday[];
  customers: Customer[];
  leads: Lead[];
  packages: Package[];
  quotations: Quotation[];
  bookings: Booking[];
  payments: Payment[];
  installments: Installment[];
  visas: VisaCase[];
};
