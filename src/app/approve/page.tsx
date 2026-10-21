import { Suspense } from "react";
import { ClientApproval } from "@/features/approval/client-approval";
export default function Page() {
  return (
    <Suspense>
      <ClientApproval />
    </Suspense>
  );
}

export const metadata = { title: "Your quotation · MEP Sabio Travel" };
