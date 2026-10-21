import { Shell } from "@/components/shell/shell";
import "@/styles/print.css";
import "./globals.css";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

export const metadata = {
  title: "Optrizo TravelOS",
  description: "Travel agency operations — simulated demo",
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={cn("font-sans", geist.variable)}>
      <body>
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}
