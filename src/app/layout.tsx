import { Shell } from "@/components/shell/shell";
import "@/styles/print.css";
import "./globals.css";
import { Barlow, Barlow_Condensed } from "next/font/google";
const body = Barlow({subsets:["latin"],weight:["400","500","600","700"],variable:"--font-barlow"});
const heading = Barlow_Condensed({subsets:["latin"],weight:["500","600","700"],variable:"--font-barlow-condensed"});
export const metadata={title:"TravelOS · MEP Sabio Travel",description:"Travel agency operations — simulated demo"};
export default function Layout({children}:{children:React.ReactNode}) {return <html lang="en" className={`${body.variable} ${heading.variable}`}><body><Shell>{children}</Shell></body></html>}
