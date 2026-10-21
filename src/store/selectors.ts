import type { DemoData, Booking } from "@/domain/types";
import { leadStages, visaStages } from "@/domain/types";
import { bookingFinancials } from "@/domain/payments";
import { quoteTotals } from "@/domain/quote";
import {
  format,
  addDays,
  subMonths,
  startOfMonth,
  differenceInHours,
  isMatch,
} from "date-fns";
export const financials = (s: DemoData, b: Booking) =>
  bookingFinancials(b, s.payments, s.installments);
export const customerBalance = (s: DemoData, id: string) =>
  s.bookings
    .filter((b) => b.customerId === id && b.status !== "Cancelled")
    .reduce((sum, b) => sum + financials(s, b).balance, 0);
export const pipelineCounts = (s: DemoData) =>
  Object.fromEntries(
    leadStages.map((stage) => [
      stage,
      s.leads.filter((l) => l.stage === stage).length,
    ]),
  );
export const visaCounts = (s: DemoData) =>
  Object.fromEntries(
    visaStages.map((stage) => [
      stage,
      s.visas.filter((v) => v.stage === stage).length,
    ]),
  );
export const destination = (
  s: DemoData,
  q: { packageId?: string; leadId: string },
) =>
  s.packages.find((p) => p.id === q.packageId)?.destination ??
  s.leads.find((l) => l.id === q.leadId)?.destination ??
  "Custom trip";
export const upcoming = (s: DemoData) =>
  s.bookings
    .filter(
      (b) =>
        b.status !== "Cancelled" &&
        b.quotationSnapshot.departDate >= format(new Date(), "yyyy-MM-dd"),
    )
    .sort((a, b) =>
      a.quotationSnapshot.departDate.localeCompare(
        b.quotationSnapshot.departDate,
      ),
    );
export function kpis(s: DemoData) {
  const month = format(new Date(), "yyyy-MM");
  return {
    openInquiries: s.leads.filter((l) => !["Won", "Lost"].includes(l.stage))
      .length,
    awaitingQuotes: s.quotations.filter((q) => q.status === "Sent").length,
    bookingsMonth: s.bookings.filter(
      (b) => b.createdAt.startsWith(month) && b.status !== "Cancelled",
    ).length,
    receivables: s.bookings
      .filter((b) => b.status !== "Cancelled")
      .reduce((sum, b) => sum + financials(s, b).balance, 0),
    departures: upcoming(s).filter(
      (b) =>
        b.quotationSnapshot.departDate <=
        format(addDays(new Date(), 30), "yyyy-MM-dd"),
    ).length,
  };
}
export function monthlyBookings(s: DemoData) {
  return Array.from({ length: 6 }, (_, i) => {
    const d = subMonths(startOfMonth(new Date()), 5 - i),
      key = format(d, "yyyy-MM");
    return {
      month: format(d, "MMM"),
      value:
        s.bookings
          .filter(
            (b) => b.createdAt.startsWith(key) && b.status !== "Cancelled",
          )
          .reduce(
            (sum, b) => sum + quoteTotals(b.quotationSnapshot).selling,
            0,
          ) / 100,
    };
  });
}
export type Attention = {
  id: string;
  title: string;
  detail: string;
  href: string;
  kind: "warning" | "danger" | "info";
  tag: string;
};
export function attention(s: DemoData) {
  const rows: Attention[] = [];
  for (const b of s.bookings.filter((b) => b.status !== "Cancelled")) {
    const name = s.customers.find((c) => c.id === b.customerId)?.name ?? "";
    for (const svc of b.services) {
      if (
        svc.deadline &&
        !["Issued", "Cancelled"].includes(svc.status) &&
        differenceInHours(new Date(svc.deadline), new Date()) <= 72
      )
        rows.push({
          id: svc.id,
          title: `${svc.category} deadline`,
          detail: `${b.ref} · ${name}`,
          href: `/bookings/view?id=${b.id}`,
          kind: "warning",
          tag: format(new Date(svc.deadline), "MMM d, h:mm a"),
        });
    }
    if (financials(s, b).status === "Overdue")
      rows.push({
        id: b.id,
        title: "Overdue balance",
        detail: `${name} · ${b.ref}`,
        href: `/bookings/view?id=${b.id}`,
        kind: "danger",
        tag: "Payment overdue",
      });
  }
  for (const v of s.visas.filter(
    (v) =>
      v.stage === "Collecting Requirements" && v.checklist.some((c) => !c.done),
  ))
    rows.push({
      id: v.id,
      title: "Visa documents required",
      detail: `${v.country} · ${s.bookings.find((b) => b.id === v.bookingId)?.travelers.find((t) => t.id === v.travelerId)?.fullName}`,
      href: `/visas?case=${v.id}`,
      kind: "info",
      tag: `${v.checklist.filter((c) => !c.done).length} missing`,
    });
  for (const q of s.quotations.filter(
    (q) =>
      q.status === "Sent" &&
      isMatch(q.validUntil, "yyyy-MM-dd") &&
      q.validUntil <= format(addDays(new Date(), 3), "yyyy-MM-dd"),
  ))
    rows.push({
      id: q.id,
      title: "Quotation expiring soon",
      detail: `${q.ref} · ${s.customers.find((c) => c.id === q.customerId)?.name}`,
      href: `/quotations/view?id=${q.id}`,
      kind: "warning",
      tag: format(new Date(q.validUntil + "T12:00:00"), "MMM d"),
    });
  return rows;
}

export type HomeJob=Attention&{type:'service'|'payment'|'quote'|'visa';bookingId?:string;serviceId?:string;customerName:string;place:string;amountCentavos?:number;missing?:number;deadline?:string};
export function homeJobs(s:DemoData):HomeJob[]{
 const jobs:HomeJob[]=attention(s).map(row=>{
  const booking=s.bookings.find(b=>b.id===row.id||b.services.some(s=>s.id===row.id)||s.visas.some(v=>v.id===row.id&&v.bookingId===b.id));
  const service=booking?.services.find(x=>x.id===row.id),quote=s.quotations.find(q=>q.id===row.id),visa=s.visas.find(v=>v.id===row.id);
  const customer=s.customers.find(c=>c.id===(booking?.customerId??quote?.customerId));
  return {...row,type:service?'service':quote?'quote':visa?'visa':'payment',bookingId:booking?.id,serviceId:service?.id,deadline:service?.deadline,customerName:customer?.name??'Traveler',place:booking?destination(s,booking.quotationSnapshot):quote?destination(s,quote):visa?.country??'',amountCentavos:booking?financials(s,booking).balance:undefined,missing:visa?.checklist.filter(c=>!c.done).length};
 });
 const rank=(j:HomeJob)=>j.type==='payment'||(j.type==='service'&&j.deadline&&differenceInHours(new Date(j.deadline),new Date())<=24)?0:j.type==='service'?1:j.type==='quote'?2:3;
 return jobs.sort((a,b)=>rank(a)-rank(b)||(a.deadline??'').localeCompare(b.deadline??'')||a.id.localeCompare(b.id));
}
export function tripStatus(s:DemoData,b:Booking):{label:string;tone:'late'|'ok'|'wait'}{
 if(financials(s,b).status==='Overdue')return {label:'Payment late',tone:'late'};
 if(b.services.some(x=>x.status==='On Hold'||(x.deadline&&!['Issued','Cancelled'].includes(x.status))))return {label:'Needs supplier confirmation',tone:'late'};
 if(b.travelers.some(t=>t.visaRequired&&!s.visas.some(v=>v.bookingId===b.id&&v.travelerId===t.id&&['Approved','Released'].includes(v.stage))))return {label:'Waiting on visa papers',tone:'wait'};
 if(b.services.some(x=>!['Confirmed','Issued','Cancelled'].includes(x.status)))return {label:'Waiting on suppliers',tone:'wait'};
 return {label:'On track',tone:'ok'};
}
