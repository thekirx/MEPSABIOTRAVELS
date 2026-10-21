import type { Quotation, QuoteLine } from "./types";
/** Default travel insurance cost per traveler (₱1,500), editable on each quote. */
export const defaultInsuranceCentavos = 150000;
export const insuranceLine = (id: string): QuoteLine => ({
  id,
  category: "Insurance",
  description: "Travel insurance",
  supplierName: "Travel insurer",
  costCentavos: defaultInsuranceCentavos,
  basis: "per_pax",
});
export const hasInsurance = (q: Pick<Quotation, "lines">) =>
  q.lines.some((l) => l.category === "Insurance");
export function quoteTotals(q: Quotation) {
  const netCost = q.lines.reduce(
    (sum, l) => sum + l.costCentavos * (l.basis === "per_pax" ? q.paxCount : 1),
    0,
  );
  const markup =
    q.markupPerPaxCentavos !== undefined
      ? q.markupPerPaxCentavos * q.paxCount
      : Math.round(netCost * ((q.markupPct ?? 0) / 100));
  const selling = netCost + markup - q.discountCentavos;
  return {
    netCost,
    markup,
    selling,
    grossProfit: selling - netCost,
    perPax: Math.round(selling / q.paxCount),
  };
}
/** Markup per traveler in centavos, for showing and editing. */
export const markupPerPax = (q: Quotation) =>
  q.markupPerPaxCentavos ?? Math.round(quoteTotals(q).markup / q.paxCount);
