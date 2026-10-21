# Seven-minute presenter script

## Pitch story (5 minutes, for agency owners)

Reset first (Settings → Reset demo data). Use two browser windows in the same browser: the staff portal, and a narrow window or phone-size view for the client.

1. **Quote:** open Andrea's quote (Quotes → HTT-Q-2026-0142). Show the flights box with the screenshot, travel insurance already included, and the ₱3,500-per-person markup giving ₱220,000.
2. **Send:** click **Email Andrea for approval** and point out the approval link in the message. Then click **Preview client page ↗**.
3. **Client approves:** in the client window, tap **Approve & pay**, pick GCash or Maya, tick the box and pay. The screen shows "You're booked, Andrea!" with the booking reference and receipt.
4. **Team sees it:** back in the staff window, Andrea's quote job has disappeared from Home without a refresh.
5. **Ticketing:** account menu → **Luis Tan (Ticketing)**. Home shows only "Issue Andrea's plane ticket" (due 5 PM tomorrow). Open any quote: costs and profit are hidden.
6. **Owner:** switch to **Isabel Santos (Owner)** → **Salary**. Katrina's payslip already includes commission from Andrea's booking. Click **Approve payday**.

Close with the roadmap: this demo runs in one browser; the real portal adds logins, a shared database, real email and real payments.

## Before the meeting

Use Chromium at 1440×900 and 100% zoom. Open `/dashboard`, then avatar → Settings → Reset demo data → Reset demo. Reset restores **MEP Sabio Travel** branding and dates relative to today. All people, prices, payments and references are synthetic demo records. Source “Facebook Messenger” is entered manually; there is no Facebook integration.

## 0:00–0:40 — Home: today's work

Open **Home**. Show the three jobs: collect Camille's late payment, record Miguel's urgent plane ticket, and call Andrea about her quote. Job order and amounts come from the records. Point to tomorrow's 5 PM deadline and the four Leaving soon luggage tags. Leave the ticket unresolved for now. “See all trips” opens the full list and its monthly booking count.

## 0:40–2:10 — Andrea's quote

Open **People asking → Almost booked → Andrea Reyes**. Her customer page holds contact details, request, quotes, trips, payments and notes. Open **HTT-Q-2026-0142**. Andrea's Tokyo–Osaka trip has four people, leaving 45 days after reset and returning after 50 days.

The customer pays **₱220,000.00**, **₱55,000.00 each**, at 10% markup. Choose **15%** to show **₱230,000.00**, then restore **10%** and Save. Supplier cost is ₱200,000; staff profit at 10% is ₱20,000. “Other…” exposes the custom Markup (%) field. “Edit every detail →” opens package, dates, services, pricing, itinerary, inclusions, terms and versions.

Use **Print / Save as PDF**. Confirm one A4 customer quotation with itinerary, inclusions/exclusions, deposit, terms and availability caveat. Staff figures and navigation stay hidden with Customer view on or off. Cancel printing.

## 2:10–3:05 — Yes becomes a trip

Click **Yes, book it**, then confirm. The price locks and **HTT-B-2026-0088** opens. Its checklist starts with the **₱66,000 deposit**. “See full trip details →” shows four travelers, four Requested services and two installments: **₱66,000 deposit** due in three days, **₱154,000 balance** due 30 days before departure.

People asking → Table shows Andrea's Lead stage **Won**. All trips shows one more monthly booking. The accepted quote is read-only; opening it again cannot create a duplicate booking.

## 3:05–4:10 — One payment, matching balances

On Payments, note Still to collect immediately before payment. Open Andrea's Trip and **Record payment**. Enter **60000**, choose Bank Transfer, note “Initial deposit — demo”, and Save payment.

The balance is **₱160,000.00**. The next step says **Collect ₱6,000 more for the deposit**. Payments → Who owes what shows the same balance and Partially Paid; the customer page agrees. Still to collect has fallen by exactly ₱60,000. The planned deposit is unchanged.

Print her **Statement**, labeled “Statement — not an official receipt/invoice.” No real funds move. To keep the main script's refresh assertion at ₱160,000, leave the extra ₱6,000 for the optional checklist rehearsal below.

## 4:10–5:05 — Visa checklist

Open Andrea's full trip details → Travelers → first **Create visa case**. The Visas page selects that case beside the table. Tick all seven requirements; show **All requirements complete**. Choose **Complete** in Visa stage, then Close. The **Complete (1)** filter count updates. Dates and notes persist. Nothing is sent to an embassy.

Seed visa cases belong only to the three Japan/Korea trips; their countries match those destinations. The six seed cases preserve the original stage mix.

## 5:05–6:00 — Resolve Miguel's ticket deadline

Home → Miguel's **Record ticket**, or open `/bookings/view?id=b1`. His Trip shows **Issue Miguel's plane ticket** and **Tomorrow, 5 PM**. Try a blank reference to show validation, then enter **SIM-TKT-7788** and **Mark ticket issued**. Return Home: his ticket job is gone. The departure tag records Ticket issued.

The full details path also enforces the guard: Suppliers → Service status = Issued is refused while Supplier reference is blank. This is a manually recorded simulated confirmation.

## 6:00–7:00 — Refresh, identity, reset

Refresh Andrea's Trip: **₱160,000.00** remains. Settings supports agency name, logo text and a local PNG/JPEG/WebP upload. Show the saved identity in the bar, quotation and statement.

Finish with **Reset demo data → Reset demo**. MEP branding returns; Andrea's quote is Sent at ₱220,000, her booking is gone, seven seed trips remain and Miguel's ticket deadline returns. Shift+R opens the same confirmation outside input fields.

## Optional full checklist rehearsal

From Andrea's partially paid trip, record the prefilled **₱6,000** to complete the deposit. Next becomes **Confirm flight, hotel, tours and car**. Enter a simulated reference for every open supplier. Add real-looking synthetic names, birth dates and passport expiries for all four travelers. Open each required visa case and record Approved or Released. Record the remaining **₱154,000** balance, then record the airfare ticket reference. The front shows **Ready to fly** and every step is checked. Reset afterward.

## Verification

The automated suite covers exact quote math, conversion, payments across surfaces, visa/checklist counts, Home and Trip ticket actions, the details reference guard, persistence/recovery, search, counted trip filters, local branding and the complete checklist. Current command results and browser/print evidence are recorded in `PROGRESS.md`; another AI can independently follow `QA_HANDOFF.md`.
