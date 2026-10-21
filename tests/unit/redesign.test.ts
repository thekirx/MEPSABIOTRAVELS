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
