import { Suspense } from "react";
import { QuotationBuilder } from "@/features/quotations/quotation-builder";
export default function Page() {
  return (
    <Suspense>
      <QuotationBuilder />
    </Suspense>
  );
}

export const metadata = { title: "Quotes · MEP Sabio Travel" };
