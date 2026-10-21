import { Suspense } from "react";
import { BookingDetails } from "@/features/bookings/booking-details";
export default function Page() {
  return (
    <Suspense>
      <BookingDetails />
    </Suspense>
  );
}

export const metadata = { title: "Trips · MEP Sabio Travel" };
