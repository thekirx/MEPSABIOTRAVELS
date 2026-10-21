import type {LeadStage,Booking} from './types';
export const leadLabels:Record<LeadStage,string>={'New Inquiry':'New',Contacted:'Talking',Quoted:'Quote sent',Negotiating:'Almost booked',Won:'Finished: booked',Lost:'Finished: said no'};
export const leadHelpers:Record<LeadStage,string>={'New Inquiry':'Say hello',Contacted:'Make a quote',Quoted:'Check in after 3 days',Negotiating:"Ask if they're ready",Won:'Booked',Lost:'Said no'};
export const leadLabel=(stage:LeadStage)=>leadLabels[stage];
export const bookingLabel=(status:Booking['status'])=>status==='Pending Confirmation'?'Waiting on suppliers':status;
export const serviceLabel=(status:string)=>status==='On Hold'?'On hold':status;
