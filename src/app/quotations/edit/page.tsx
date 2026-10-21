import { Suspense } from "react";
import { QuotationDetails } from "@/features/quotations/quotation-details";
export default function Page() {
  return (
    <Suspense>
      <QuotationDetails />
    </Suspense>
  );
}
