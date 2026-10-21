import { Suspense } from "react";
import { CustomerPage } from "@/features/customers/customer";
export default function Page() {
  return (
    <Suspense>
      <CustomerPage />
    </Suspense>
  );
}

export const metadata = { title: "Customer · MEP Sabio Travel" };
