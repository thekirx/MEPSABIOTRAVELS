import { Suspense } from "react";
import { Visas } from "@/features/visas/visas";
export default function Page() {
  return (
    <Suspense>
      <Visas />
    </Suspense>
  );
}

export const metadata = { title: "Visas · MEP Sabio Travel" };
