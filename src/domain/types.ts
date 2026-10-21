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
  "Facebook Messenger",
  "Walk-in",
  "Viber",
  "Referral",
  "Website",
] as const;
export const methods = [
  "Bank Transfer",
  "GCash",
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
  id: string;
  ref: string;
  leadId: string;
  customerId: string;
  packageId?: string;
  departDate: string;
  returnDate: string;
  paxCount: number;
  lines: QuoteLine[];
  markupPct: number;
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
  settings: { agencyName: string; logoText: string };
  agents: Agent[];
  customers: Customer[];
  leads: Lead[];
  packages: Package[];
  quotations: Quotation[];
  bookings: Booking[];
  payments: Payment[];
  installments: Installment[];
  visas: VisaCase[];
};
