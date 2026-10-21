import {quoteTotals} from "@/domain/quote";
import {describe,it,expect} from 'vitest';
import {leadLabel,bookingLabel} from '@/domain/labels';
import {destinationCode} from '@/domain/places';
describe('plain language and places',()=>{
it('maps enums without changing their stored values',()=>{expect(leadLabel('New Inquiry')).toBe('New');expect(leadLabel('Negotiating')).toBe('Almost booked');expect(leadLabel('Won')).toBe('Finished: booked');expect(bookingLabel('Pending Confirmation')).toBe('Waiting on suppliers')});
it('uses destination codes and a safe fallback',()=>{expect(['Japan','South Korea','Hong Kong','Singapore','El Nido, Palawan','Boracay'].map(destinationCode)).toEqual(['NRT','ICN','HKG','SIN','ENI','MPH']);expect(destinationCode('Custom place')).toBe('TRIP')});
});

import {buildSeed} from '@/seed';
import {homeJobs} from '@/store/selectors';
it('orders overdue and deadlines ahead of expiring quotes and visas',()=>{const s=buildSeed();const jobs=homeJobs(s);expect(jobs[0].type).toBe('payment');expect(jobs.findIndex(j=>j.type==='service')).toBeLessThan(jobs.findIndex(j=>j.type==='quote'));expect(jobs.findIndex(j=>j.type==='quote')).toBeLessThan(jobs.findIndex(j=>j.type==='visa'))});

import {useTravelStore} from '@/store';
it('keeps quote customization and chosen agent in the accepted snapshot with edit history',()=>{
 useTravelStore.getState().resetDemo();const s=useTravelStore.getState();
 s.updateQuotation('q1',{inclusions:['Custom included service'],terms:'Custom terms',assignedAgentId:'a3'});
 const id=s.acceptQuotation('q1'),b=useTravelStore.getState().bookings.find(b=>b.id===id)!;
 expect(b.assignedAgentId).toBe('a3');expect(b.quotationSnapshot.inclusions).toEqual(['Custom included service']);expect(b.quotationSnapshot.editHistory).toHaveLength(1);
});

import {tripSteps} from '@/store/selectors';
describe('derived trip checklist',()=>{
 it('advances from fresh to partial deposit to full deposit without storing flags',()=>{
 useTravelStore.getState().resetDemo();const id=useTravelStore.getState().acceptQuotation('q1');
 const steps=()=>{const s=useTravelStore.getState();return tripSteps(s,s.bookings.find(b=>b.id===id)!)};
 expect(steps().find(x=>!x.done)?.id).toBe('deposit');expect(steps().find(x=>x.id==='deposit')?.remainingCentavos).toBe(6600000);
 useTravelStore.getState().recordPayment(id,6000000,'Cash','');expect(steps().find(x=>x.id==='deposit')?.remainingCentavos).toBe(600000);
 useTravelStore.getState().recordPayment(id,600000,'Cash','');expect(steps().find(x=>!x.done)?.id).toBe('suppliers');
 });
 it('handles all done and cancelled bookings, including the optional visa step',()=>{
 const s=buildSeed(),b=structuredClone(s.bookings[0]);b.travelers=b.travelers.map((t,i)=>({...t,fullName:`Demo Person ${i}`,passportExpiry:'2030-01-01',visaRequired:false}));b.services=b.services.map(x=>({...x,status:'Issued',supplierRef:'SIM-OK'}));s.payments=[{id:'paid',bookingId:b.id,amountCentavos:quoteTotals(b.quotationSnapshot).selling,method:'Cash',receivedAt:'2026-10-21',receiptNo:'SIM'}];expect(tripSteps(s,b).every(x=>x.done)).toBe(true);expect(tripSteps(s,b).some(x=>x.id==='visa')).toBe(false);b.travelers[0].visaRequired=true;s.visas=[];expect(tripSteps(s,b).find(x=>x.id==='visa')?.done).toBe(false);b.status='Cancelled';expect(tripSteps(s,b)).toEqual([]);
 });
});
