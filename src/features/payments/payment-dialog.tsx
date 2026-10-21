'use client';
import {useForm} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import {z} from 'zod';
import {useTravelStore} from '@/store';
import {financials} from '@/store/selectors';
import {methods} from '@/domain/types';
import {money} from '@/domain/money';
import {Modal,Field,notify} from '@/components/shared';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
const schema=z.object({amount:z.string().regex(/^\d+(\.\d{1,2})?$/,'Enter an amount with at most two decimal places.').refine(v=>Number(v)>0,'Enter a positive amount.'),method:z.enum(methods),note:z.string()});
type Values=z.infer<typeof schema>;
export function PaymentDialog({bookingId,open,onClose}:{bookingId:string;open:boolean;onClose:()=>void}){const s=useTravelStore(),b=s.bookings.find(b=>b.id===bookingId)!;const {register,handleSubmit,formState:{errors},setError,reset}=useForm<Values>({resolver:zodResolver(schema),defaultValues:{amount:'',method:'Bank Transfer',note:''}});if(!b)return null;const f=financials(s,b);return <Modal open={open} onOpenChange={v=>{if(!v)onClose()}} title="Record a payment" description={`${b.ref} · Recorded manually for demo purposes. No real payment is processed.`}><form className="section-stack" onSubmit={handleSubmit(v=>{const amount=Math.round(Number(v.amount)*100);if(amount>f.balance){setError('amount',{message:'Amount cannot exceed the outstanding balance.'});return}notify(()=>s.recordPayment(bookingId,amount,v.method,v.note),'Simulated payment recorded');reset();onClose()})}><div className="payment-balance"><span>Outstanding balance</span><strong>{money(f.balance)}</strong></div><Field label="Amount (PHP)"><Input aria-label="Amount (PHP)" inputMode="decimal" placeholder="60,000.00" {...register('amount')} aria-invalid={!!errors.amount}/>{errors.amount&&<span className="form-error">{errors.amount.message}</span>}</Field><Field label="Payment method"><select aria-label="Payment method" {...register('method')}>{methods.map(m=><option key={m}>{m}</option>)}</select></Field><Field label="Internal note (optional)"><Input {...register('note')} placeholder="e.g. Initial deposit — demo"/></Field><div className="dialog-actions"><Button type="button" variant="outline" onClick={onClose}>Cancel</Button><Button type="submit">Save payment</Button></div><p className="subtle-note">This is a simulated ledger entry, not an official receipt or invoice.</p></form></Modal>}
