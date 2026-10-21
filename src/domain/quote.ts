import type {Quotation} from './types';
export function quoteTotals(q:Quotation){const netCost=q.lines.reduce((sum,l)=>sum+l.costCentavos*(l.basis==='per_pax'?q.paxCount:1),0);const selling=Math.round(netCost*(1+q.markupPct/100))-q.discountCentavos;return {netCost,selling,grossProfit:selling-netCost,perPax:Math.round(selling/q.paxCount)}}
