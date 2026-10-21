import { Suspense } from "react";
import { QuotationDetails } from "@/features/quotations/quotation-details";
export default function Page() {
  return (
    <Suspense>
      <QuotationDetails />
    </Suspense>
  );
}

export const metadata = { title: "Quotes · MEP Sabio Travel" };
