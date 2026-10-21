import './globals.css';
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata = {title:'Optrizo TravelOS', description:'Travel agency operations — simulated demo'};
export default function Layout({children}:{children:React.ReactNode}) {return <html lang="en" className={cn("font-sans", geist.variable)}><body>{children}</body></html>}
