import { Suspense } from "react";
import { BookingDetail } from "@/features/bookings/booking-detail";
export default function Page() {
  return (
    <Suspense>
      <BookingDetail />
    </Suspense>
  );
}
