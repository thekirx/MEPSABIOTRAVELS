import { Suspense } from "react";
import { BookingList } from "@/features/bookings/booking-list";
export default function Page() {
  return (
    <Suspense>
      <BookingList />
    </Suspense>
  );
}

export const metadata = { title: "Trips · MEP Sabio Travel" };
