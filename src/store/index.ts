'use client';
import {create} from 'zustand';
import {persist,createJSONStorage} from 'zustand/middleware';
import {buildSeed} from '@/seed';
import {createActions,type TravelStore} from './actions';
export const useTravelStore=create<TravelStore>()(persist((...args)=>({...buildSeed(),...createActions(...args)}),{name:'travelos-demo-v1',version:1,storage:createJSONStorage(()=>localStorage),skipHydration:true,migrate:()=>buildSeed(),merge:(persisted,current)=>{const saved=persisted as Partial<TravelStore>|undefined;return {...current,...(saved?.schemaVersion===1?saved:buildSeed()),hydrated:false}},partialize:s=>{const {schemaVersion,settings,agents,customers,leads,packages,quotations,bookings,payments,installments,visas}=s;return {schemaVersion,settings,agents,customers,leads,packages,quotations,bookings,payments,installments,visas}},onRehydrateStorage:()=>state=>state?.setHydrated()}));
