import { Suspense } from "react";
import { PaymentsLedger } from "@/features/payments/payments-ledger";
export default function Page() {
  return (
    <Suspense>
      <PaymentsLedger />
    </Suspense>
  );
}

export const metadata = { title: "Payments · MEP Sabio Travel" };
