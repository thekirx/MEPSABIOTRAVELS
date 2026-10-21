# Seven-minute presenter script

## Before the meeting

Use Chrome/Chromium at 1440×900 or larger, at 100% browser zoom. Start `npm run dev`, open `/dashboard`, then Settings → Reset demo data → Reset demo. Optionally save the client's chosen agency branding after reset. Return to Overview. Keep all figures at their seed values until prompted. All transactions, applications and confirmations are simulated.

## 0:00–0:40 — The owner's morning view

Open **Overview**. Say: “This is your morning view: conversations, quotations awaiting reply, this month's bookings, receivables and departures. These figures come from the same records your staff works on.”

Point to **Airfare deadline**, **Overdue balance**, missing visa documents and the expiring quote in Needs attention. Scroll that panel if necessary. Do not resolve the deadline yet. Note the booking count; the live conversion will increase it by one.

## 0:40–2:10 — Andrea's inquiry and quotation

Open **Inquiries**. Find **Andrea Reyes** in Negotiating and click her name. Her source is Facebook Messenger, recorded manually; the app is not integrated with Facebook. Say: “One customer profile holds the inquiry, notes, quotations, bookings and balance.”

Click **HTT-Q-2026-0142** in the drawer. Andrea has Tokyo–Osaka 6D5N, four travelers, departing 45 days after the reset date. The trip starts at **₱220,000.00**, **₱55,000.00 per traveler**.

Scroll the editor to Pricing & validity. Set **Markup (%)** from 10 to 15. The live customer preview becomes **₱230,000.00**. Say: “We price from supplier costs while keeping the client document simple.” **Restore markup to 10** so the total returns to **₱220,000.00**, then click Save.

Click **Print / Save as PDF**. Confirm the one-page A4 seed quotation: itinerary, inclusions/exclusions, validity, deposit terms and availability caveat. Supplier costs and gross profit are absent even with Customer view unchecked. Cancel print to return to the app.

## 2:10–3:05 — Acceptance becomes an organized booking

At the bottom of the editor, click **Accept & convert to booking**. The new booking is **HTT-B-2026-0088**. Say: “We freeze the accepted quotation. Staff can track services without accidentally repricing the customer's agreement.”

Show four traveler placeholders, four Requested services, and the default installment plan: **₱66,000 deposit**, **₱154,000 balance**. The 30% deposit is due in three days; final payment is due 30 days before departure. Traveler details remain synthetic placeholders for the demo.

Open Inquiries → Table and show Andrea's lead is **Won**. Return to Overview: bookings this month increased by **1**.

## 3:05–4:10 — One deposit, every balance agrees

With Andrea's booking created, note the receivables total on Overview. Open her booking from Bookings or global search. Click **Record payment**. Enter **60000**, choose Bank Transfer, note “Initial deposit — demo”, then **Save payment**.

Say: “This records a manual payment entry; it doesn't process funds.” The booking balance is **₱160,000.00** and status **Partially Paid**. The remaining **₱6,000** of the deposit stays due in three days. Partial deposit does not change the agreed installment schedule.

Open Payments and show Andrea's exact **₱160,000.00** balance. Open her customer drawer in Inquiries and show the same amount. Overview receivables have dropped by **₱60,000.00** from the value noted immediately before payment. A printable statement is available from the booking or ledger and is explicitly not an official receipt/invoice.

## 4:10–5:05 — Visa work stays attached to the traveler

Return to Andrea's booking. Under the first traveler, click **Create visa case**. In the case drawer, tick every requirement. Show “All requirements complete”; select **Complete** in Application stage. Close the drawer. The **Complete (1)** filter count reflects the change.

Say: “The team knows which documents are missing and who owns the next step. Stages are recorded manually; the demo submits nothing to an embassy.”

## 5:05–6:00 — Resolve the urgent ticketing item

Open Overview → **Airfare deadline** for Miguel Santos' seeded booking. Show the On Hold airfare and tomorrow's cutoff. Enter **SIM-TKT-7788** in Supplier reference, then choose **Issued**. Explain that this is a simulated confirmation number, recorded manually. Issuance requires a reference.

Return to Overview. The airfare deadline alert is gone because its service is now Issued. Other attention items remain.

## 6:00–7:00 — Refresh, branding and reset

Open Andrea's booking and refresh the browser. Her **₱160,000.00** balance remains. Say: “This demo saves to this browser. A production system would replace that with secure shared storage and access controls.”

Open Settings and briefly show agency name/logo text. Finish with Reset demo data → Reset demo. Return to Quotations: Andrea's quote is Sent at **₱220,000.00**, no Andrea booking exists, the seven seeded bookings remain and the ticketing alert is restored.

Say: “The demo is ready for the next walkthrough.” Reset also restores the Horizon branding; personalize again if needed.

## Executed acceptance checklist

Automated Chromium checks against the static export cover all six required workflows:

- [x] Andrea lead → quotation → markup updates exact preview totals; print hides staff/shell.
- [x] Acceptance creates four travelers/four services/two installments, wins the lead and increments monthly booking count.
- [x] ₱60,000 payment produces ₱160,000 balance in booking, ledger and customer drawer and reduces receivables by ₱60,000.
- [x] Visa creation/checklist/stage updates update counts.
- [x] Tomorrow's airfare deadline disappears after manual reference + Issued.
- [x] Refresh persists changes; reset restores the seed.

A separate Chromium print check generated the default quotation as one A4 page. Rehearse restoring markup to 10, typing the payment amount without thousands separators, and entering the simulated reference before issuance.
