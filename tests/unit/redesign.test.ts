import {describe,it,expect} from 'vitest';
import {leadLabel,bookingLabel} from '@/domain/labels';
import {destinationCode} from '@/domain/places';
describe('plain language and places',()=>{
it('maps enums without changing their stored values',()=>{expect(leadLabel('New Inquiry')).toBe('New');expect(leadLabel('Negotiating')).toBe('Almost booked');expect(leadLabel('Won')).toBe('Finished: booked');expect(bookingLabel('Pending Confirmation')).toBe('Waiting on suppliers')});
it('uses destination codes and a safe fallback',()=>{expect(['Japan','South Korea','Hong Kong','Singapore','El Nido, Palawan','Boracay'].map(destinationCode)).toEqual(['NRT','ICN','HKG','SIN','ENI','MPH']);expect(destinationCode('Custom place')).toBe('TRIP')});
});
