import { Suspense } from "react";
import { QuotationList } from "@/features/quotations/quotation-list";
export default function Page() {
  return (
    <Suspense>
      <QuotationList />
    </Suspense>
  );
}
