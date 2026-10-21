# TravelOS × MEP Sabio Travel — redesign handoff

## Copy this task to the implementing AI

Rebuild the user interface of the TravelOS web app in this repository to match the approved HTML mocks in `design/mocks/`. Follow `REDESIGN_PLAN.md` phase by phase. Run its gate checks after every phase.

Keep everything that already works. The domain logic, centavo maths, store, seed rules, print behaviour and every invariant in `QA_HANDOFF.md` must still hold. This is a **visual and interaction redesign**, not a rewrite of the data layer. Change the store only where this document says so.

Read first, in this order:

1. This file.
2. `REDESIGN_PLAN.md`: the phases, tasks and gates.
3. `design/mocks/README.md`, then open the mocks in a browser (`npx http-server design/mocks -p 4300 -c-1`, then http://localhost:4300/index.html). Click through the front screens. They work.
4. `QA_HANDOFF.md`: the invariants and acceptance journeys that must keep passing.
5. `DEMO_SCRIPT.md`: the 7-minute sales demo this app exists for.
6. `src/domain/`, `src/store/`, `src/seed/`, `src/features/`, `tests/`.

Do not push, deploy, add a backend or auth, or connect external services. Commit on a branch, one commit per phase.

---

## 1. What this is

- **Product:** Optrizo TravelOS, a travel agency operations **web app**, built as a sales demo for the client **MEP Sabio Travel** (Philippines, PHP currency).
- **Platform: web app.** Next.js 16 (App Router), React 19, TypeScript, Tailwind 4, shadcn/Base UI primitives, Zustand + localStorage, `output: "export"` static build deployable to Vercel or any static host. No native app.
  - **Desktop (1440 px):** the primary target. Must look exactly like the mocks.
  - **Tablet (1024 px):** required. No page-level sideways scrolling.
  - **Phone browser (390 px):** must be *usable*: single column, no sideways scrolling, tap targets ≥ 44 px. It doesn't have to be beautiful.
- **Users:** agency staff (owner, sales, ticketing, visa) who aren't technical. The client asked that it be **"simple enough for a grade schooler"**.

## 2. How we got to this design (read this; it prevents rework)

The client reviewed several rounds and rejected **both extremes**:

| Round | Verdict | Lesson |
|---|---|---|
| Grey admin dashboard, 8–11 px text | "Too plain, too much information" | Must be readable and warm |
| Sky-blue "aurora" glow, gradients, icon bubbles | — | — |
| Brand swoosh, italic caps, tilted stamps, glows | **"Looks like AI slop"** | No decorative effects |
| Flat, hairline, data-dense, very restrained | **"Too plain / too much information"** again | Restraint alone isn't enough |
| **Bold flat colour blocks in MEP's colours, big type, 3–4 things per screen** | **Approved** as the front dashboard | ← build this |
| Detail pages behind the front | **Approved**: "this is when it is expounded" | Two layers |
| Front screens actually clickable | **Approved** | Every button does something |

**The rule:** the *front* screens are bold and almost empty. Each has one job per block and one button per block. All the detail lives **one click deeper** on dense, calm detail pages.

### Never do (the client called these "AI slop")

- Gradients on buttons or backgrounds, glows, blurred colour blobs, glassmorphism.
- An icon in a coloured rounded square on every card.
- Decorative SVG illustrations, drawn destination scenes, swooshes as decoration.
- Tilted or rotated cards, postage-stamp edges.
- ALL-CAPS italic headlines everywhere.
- Emoji as icons.
- Big drop shadows.

### Always do

- **Flat, solid colour blocks:** charcoal, lime, MEP red and white on a cream page.
- **Big type:** Barlow Condensed for titles and numbers (36–110 px), Barlow 17 px body.
- **Plain words:** "Collect Camille's payment", not "Overdue balance HTT-B-2026-0082".
- **One main button per block.** At most one lime primary button per screen region.
- **Status = coloured dot or chip *plus words*.** Never colour alone.
- **Real numbers only,** all derived from the store.

## 3. Brand

The client is **MEP Sabio Travel**. Tagline: "Quality travel for less". The client's logo and Facebook posts were supplied by the user. Their posts use bold condensed lettering and a contact strip with reservations@meptravel.com · mepsabiotravel.com · @mepsabiotravel_.

**Decision (user-approved, supersedes `QA_HANDOFF.md`/`DECISIONS.md`):** the default agency is now **MEP Sabio Travel**, not the fictional "Horizon Travel & Tours":

- **Logo:** copy `design/mocks/assets/mep-mark.png` (compact, for the top bar) and `mep-logo-full.png` (full, for the quote and statement letterhead) to `public/brand/`.
- **Settings:** must still allow renaming. **Reset demo** restores MEP branding.
- **Demo data stays fictional:** customer names, suppliers ("(fictional)"), prices and payments. Keep "DEMO — simulated data" on every screen and on printed documents.
- **Reference codes:** keep the existing `HTT-` prefixes (tests depend on them). Changing them to `MEP-` is a separate follow-up, only if the user asks.

### Tokens (from `design/mocks/mock.css`)

| Token | Value | Use |
|---|---|---|
| `--char` | `#292b2f` | Top bar, dark blocks, primary text buttons. Exactly the logo's background colour. |
| `--lime` | `#c8e63c` | **Main action** buttons (charcoal text), active nav pill, "do this next" block |
| `--red` | `#c62828` | Late, overdue, needs you now (white text). From MEP's team polos. |
| `--white` | `#ffffff` | Blocks and sheets |
| `--cream` | `#f2f1ea` | Page background |
| `--ink` | `#1d1f22` | Text |
| `--muted` | `#5f636a` | Secondary text (5.6:1 on white) |
| `--ok` | `#2e7d32` | "Done", "on track" |
| `--line` | `#e2e1d8` | Table rules |
| Radius | 18 px blocks, 999 px buttons and pills, 10–12 px inputs | |
| Fonts | `Barlow Condensed` 500/600/700 (titles, numbers), `Barlow` 400–700 (body 17 px) | Load with `next/font/google`. Replace Geist. |
| Buttons | 54 px tall (46 px small), pill, flat, bold 18 px | |

Contrast pairs that are verified: white on `--red`, `--ink` on `--lime`, white on `--char`, `--muted` on white.

## 4. Information architecture

**Top bar** (charcoal, replaces the sidebar; the user explicitly rejected the sidebar): logo · **Home · People asking · Quotes · Payments · Visas** · DEMO pill · avatar. The avatar menu holds Settings and Reset demo. The active page gets a lime pill. Payments shows a red dot when anything is overdue. Keep global search (move it behind a search button or into the avatar row). It must keep working; there is an e2e test for it.

**Two layers:**

| Front (simple, working) | Detail (one click deeper) |
|---|---|
| Home `/dashboard` | All trips `/bookings` (from "See all trips") |
| People asking `/inquiries` | Customer `/customers/view?id=` **(new route)** |
| Quote `/quotations/view?id=` | Quote details `/quotations/edit?id=` **(new route)** |
| Trip `/bookings/view?id=` | Trip details `/bookings/details?id=` **(new route)** |
| — | Payments `/payments`, Visas `/visas`, Quotes list `/quotations`, Settings `/settings` |

Use query-string routes for new pages (`?id=`), the same as the existing pattern, so runtime-created IDs work on the static host. `trailingSlash: true` stays.

### Plain-language labels (UI only; keep the data enums unchanged)

| Data value | UI label |
|---|---|
| Lead `New Inquiry` / `Contacted` / `Quoted` / `Negotiating` | **New** / **Talking** / **Quote sent** / **Almost booked** |
| Lead `Won` / `Lost` | **Finished: booked** / **Finished: said no** |
| Stage helper text | "Say hello" / "Make a quote" / "Check in after 3 days" / "Ask if they're ready" |
| Service `Requested` / `On Hold` / `Confirmed` / `Issued` | Requested / On hold / Confirmed / Issued (unchanged) |
| Booking `Pending Confirmation` | **Waiting on suppliers** |

## 5. Screen specs

Mocks are the visual source of truth. This section says **where each number comes from** and **what each button does**. Use existing actions in `src/store/actions.ts` and selectors in `src/store/selectors.ts`.

### 5.1 Home `/dashboard` ← `home.html`

- **Header:** "Good morning, {first name of the current agent}" + "You have N jobs today." (or "All done for today. Nice work."). Lime **+ New inquiry** opens the new-inquiry dialog.
- **3 job blocks:** the top 3 items from `attention(s)`, sorted by urgency (overdue balance and deadlines ≤ 24 h first, then other deadlines, then expiring quotes, then visas). Map each kind to a block colour and one action:
  - **Service deadline:** charcoal block, tag = time left ("Tomorrow, 5 PM"), title "Issue {first name}'s plane ticket" (or "Confirm {category}…" for other categories), button **Record ticket**. It opens a dialog asking for the supplier reference. A blank reference is refused with "Type the airline's reference first. A ticket can't be marked issued without it." This calls `updateServiceStatus(bookingId, id, "Issued", ref)`.
  - **Overdue balance:** red block, big outstanding amount, "Collect from {name} for their {destination} trip", button **Record payment**. Reuse the payment dialog with validation.
  - **Quotation expiring:** lime block, "Call {first name} about their {destination} quote", button **Open quote**.
  - **Visa documents:** white block, "{N} visa papers missing for {name}", button **Open visas**.
  - A finished item disappears from `attention()`, so show a white **✓ Done** block for items finished *this session* (keep a session-only list of IDs in component state), then let the next item fill the slot.
  - If there are more than 3 items, add a "See all N jobs →" link. It can open a dialog with the full `attention()` list.
- **Leaving soon:** 4 "luggage tag" cards from `upcoming(s)`: large IATA-style code, city, weekday date + "in N days", "{lead traveller} + N", and a bottom strip with a single status. Status order: late payment → service on hold/deadline → visa missing → waiting on suppliers → "On track". Add a `destinationCode(destination)` map in `src/domain`: Japan → NRT, South Korea → ICN, Hong Kong → HKG, Singapore → SIN, El Nido → ENI, Boracay → MPH.
- **"See all trips →"** links to `/bookings`.
- **Removed from the front:** the KPI strip, chart and departures table. The chart may move to a collapsible "Business overview" on `/bookings` or `/payments`. Optional.

### 5.2 People asking `/inquiries` ← `inquiries.html`

- **4 stage blocks:** count + label + helper text. The active stage is charcoal with a lime number, and the choice is kept in the URL (`?stage=`). Counts come from `pipelineCounts(s)`.
- A one-line help sentence per stage (see the table above).
- **People in the stage:** 2-column big cards. Each shows the name (links to the customer page), budget, "{destination} · {n} people · {month}", and last contact. If last contact is ≥ 5 days ago, show it in red: "No reply in N days".
- **One action per card:**
  - New → "Log first reply →"
  - Talking → "Make a quote →" (calls `createQuotation`, then goes to the quote)
  - Quote sent → "Checked in →"
  - Almost booked → **Open quote** if a quote exists; otherwise "They booked" / "Said no", each with a confirmation dialog.
  - All of these use `updateLeadStage`.
- **"See finished: N booked, N said no →"** switches to the closed view. Each closed card has "Reopen".
- **"+ Someone new":** dialog with name, destination, people (1–50), month and source, validated inline. Calls `createLead`.
- **Keep for tests and accessibility:** a stage `<select>` labelled "Lead stage" inside each card's "More" area, and a table view toggle. The existing e2e tests use them.
- **Remove the drawer.** The customer drawer becomes the Customer page. Keep `?customer=` working by redirecting to `/customers/view?id=`, because global search uses it.

### 5.3 Customer `/customers/view?id=` (new) ← `customer.html`

Charcoal head block: initials avatar, name, "Customer since", source, trips, spent and still owes (`customerBalance`). Actions: Add note, **New quote**. Then a sticky left section menu with **Contact · Trip request · Quotes · Trips · Payments · Notes**, each a white sheet with a table or key-value grid. The notes composer calls `addLeadNote`.

### 5.4 Quote `/quotations/view?id=` ← `quotation.html`

- Title "{first name}'s {destination} trip" + one line of trip facts. Step pills: "1 · The trip ✓", "2 · What's included ✓", "3 · The price". Add **Edit every detail →** linking to `/quotations/edit?id=`.
- **"How much do we add on top?"**: 4 large buttons (8 / 10 / 12 / 15 %) plus "Other…", which opens a number field. Keep an input labelled **"Markup (%)"** reachable for the e2e test. The line "The trip costs us ₱{net}. {Name} never sees this." comes from `quoteTotals`.
- **Lime result block:** "{Name} pays ₱{selling}", per person, "We earn ₱{profit}". Staff-only, so it uses `.staff-only` and is hidden in print.
- **Customer copy** beside it, on MEP letterhead (full logo, "QUOTATION", title, dates, inclusions, total, per person, 30% deposit, contact strip, DEMO). This is the `.print-document`, and printing must still give one clean A4 page.
- **Charcoal "Did {name} say yes?" block:** **Yes, book it** opens a confirm dialog ("The price locks at ₱X and her booking is created…"). Then call `acceptQuotation(id)` and go to `/bookings/view?id={new}`. Keep the accessible name "Accept & convert to booking" on this control (`aria-label`) or update the test with the same assertion.
- **When accepted:** markup buttons are disabled, the copy says "This quote was accepted, so the price is locked.", and the block becomes "✓ Booked · Open trip". This matches the existing read-only rule.

### 5.5 Quote details `/quotations/edit?id=` (new) ← `quote-details.html`

The full editor, moved here from today's quotation builder: trip fields (package prefill, travellers, dates, valid until, agent), services table (type, description, supplier, cost, per person/once, line total, remove, add), price (markup + presets, discount, payment plan, summary with staff-only profit), itinerary days, included/not included lists, terms, versions/history. Use a sticky section menu. Keep every existing validation (dates in order, no invalid required dates, no negative discount, no send or accept without priced lines).

### 5.6 Trip `/bookings/view?id=` ← `booking.html`

- **Charcoal header:** destination, "{lead} · N people · dates", huge lime **days to go**.
- **Lime "Do this next" block:** the first unfinished step from a new pure selector `tripSteps(s, booking)`, which needs unit tests. The steps:
  1. Book the trip (always done).
  2. Get the full deposit: cumulative payments ≥ first installment. Button: **Record payment**. Pre-fill the amount that finishes the deposit.
  3. Confirm flight, hotel, tours and car: every non-cancelled service is `Confirmed` or `Issued`. Button: **Add references**, a dialog with one required reference per open service, which calls `updateServiceStatus(…, "Confirmed", ref)`.
  4. Get everyone's passport details: every traveller has a real name (not "Guest N"/"Traveler N") and a passport expiry. Button: **Add travelers**.
  5. Visa: only if any traveller has `visaRequired`. Each such traveller has a visa case at stage Approved or Released. Button: **Start / open visa case**.
  6. Get the rest of the money: paid ≥ total. Button: **Record payment**, pre-filled with the balance.
  7. Issue the plane tickets: the airfare service is `Issued`. Button: **Record tickets** (reference required).
  - When everything is done: white "✓ All done · Ready to fly" block.
- **Checklist:** the same steps with big checkboxes. Done steps are struck through, and the current step is bold with a lime due-date pill. Open steps are buttons that open the same dialogs.
- **Money block:** paid / total, bar, "₱X still to collect" or "Paid in full ✓", **Record payment**, and "See payments" → details.
- **"See full trip details →"** links to `/bookings/details?id=`.
- **Payment dialog** (shared): amount (label **"Amount (PHP)"**, which the e2e test uses), method (`methods` enum), note. Inline errors: blank, non-number, more than 2 decimals, ≤ 0, more than outstanding. The button is labelled "Save payment". Calls `recordPayment`. Toast: "₱X recorded. No money moves in this demo."

### 5.7 Trip details `/bookings/details?id=` (new) ← `trip-details.html`

Charcoal head block with facts and **Print statement** / **Record payment**. Sticky menu: **Overview** (customer link, agent, source, package, booked date, quote link, staff-only price breakdown from the frozen snapshot), **Travelers** (table plus add/edit dialogs: "Full name", "Date of birth", "Passport expiry" labels kept for e2e), **Suppliers** (status `<select>` labelled "Service status", input labelled "Supplier reference", deadline; keep the "Enter a simulated ticket / confirmation number first." guard), **Payments** (plan, received list, statement), **Itinerary** (days with real dates), **Visa** (cases or "Start visa case", which keeps the "Create visa case" button name), **History** (notes and events).

Today's `booking-detail.tsx` already has most of this. Restyle and split it rather than rewriting it.

### 5.8 All trips `/bookings` ← `trips.html`

4 stat blocks (trips booked, leaving in 30 days, still to collect, late in red), filter pills with counts (All, Needs action, Leaving in 30 days, Payment late, Waiting on suppliers), a search field, and a table. Columns: trip code + place + ref, customer + people, leaves + "in N days", status chip, total, paid amount + % + bar, next-step chip (from `tripSteps`) + detail line, agent initials. Rows go to `/bookings/view?id=`. The table scrolls inside its card on narrow screens.

### 5.9 Payments `/payments` ← `payments.html`

4 blocks: Late (red), Due in 7 days (lime), Still to collect (white), Received this month (charcoal). Then a "Who owes what" table sorted by urgency (late → due soon → not due), with a **Record** button per row and totals in the footer. Then "Payments received", newest first, with totals. All values come from `financials()`, installments and payments. Keep statement printing ("Statement — not an official receipt/invoice.").

### 5.10 Visas `/visas` ← `visas.html`

A callout for travellers with `visaRequired` and no case. Filter pills by stage with counts (`visaCounts`), a cases table (traveller, booking, leaves, country, documents "n of 7" + bar, stage chip), and the selected case beside it (URL `?case=`) with the 7-item checklist (big checkboxes, `toggleVisaChecklist`), a stage select labelled "Visa stage", dates, notes, and the "All requirements complete" message. Keep "Nothing is sent to an embassy from here."

### 5.11 Quotes list `/quotations`, Settings `/settings`

No mock. Restyle them in the same system:

- **Quotes list:** stat blocks + table.
- **Settings:** white sheets. "Agency name", the logo upload/text fields, and the **Reset demo data** → **Reset demo** confirmation, with the existing labels and toast "Demo restored to its starting state".

## 6. Invariants that must not break (from `QA_HANDOFF.md`)

- Integer **centavos** in storage. PHP formatting only for display. Quote maths: per-pax × pax or per-group once; `selling = round(net × (1 + markup/100)) − discount`; `perPax = round(selling / pax)`.
- Balances, statuses, KPIs, counts and attention items are **derived**, never stored.
- Acceptance is **idempotent** and freezes a snapshot. Accepted quotes are read-only.
- Overdue = cumulative paid < cumulative installments due before today.
- Reject zero, negative, invalid, fractional-centavo and over-balance payments. Invalid submits change nothing.
- `Issued` requires a reference. Cancelled bookings are excluded from receivables and departures.
- "DEMO — simulated data" on every screen. Statements say they're not official receipts or invoices.
- Print: quote and statement are clean A4 pages with no nav, controls or staff-only content.
- Static export: `/…/view?id=` (and the new `?id=` routes) must work for runtime-created IDs after a reload.
- Reset (button and Shift+R outside inputs) restores the seed **and** branding. Corrupt or mismatched storage reseeds safely.

## 7. Accessibility and web-app quality

- Body text ≥ 16 px (mocks use 17). Tap targets ≥ 44 px. Visible focus ring (`3px solid` ink).
- Every input has a visible `<label>`. Errors appear under the field with `role="alert"`, and focus moves to the first invalid field.
- Status always has words, not only colour. Icon-only buttons have `aria-label`.
- Dialogs: shadcn/Base UI dialog, closable with Esc, focus trapped, returns focus.
- `prefers-reduced-motion` disables the hover lift and transitions.
- No page-level horizontal scroll at 1440 / 1024 / 390 px. Wide tables scroll inside their card.
- Title per route (`<title>` "{Page} · MEP Sabio Travel").

## 8. Tests

Current suites: unit tests in `tests/unit/domain.test.ts`, browser tests in `tests/e2e/workflows.spec.ts` (Chromium against the static `out/` export on port 4173; see `playwright.config.ts`).

- **Keep these accessible names working** (or update the test to the new UI *with the same assertion strength*): "Reset demo data", "Reset demo", "Accept & convert to booking", "Record payment", "Amount (PHP)", "Save payment", "Markup (%)", "Save", "Lead stage", "Create visa case", "Visa stage", "Close", "Service status", "Supplier reference", "Global search", "Agency name", "Add traveler", "Full name", "Date of birth", "Passport expiry". Also keep `.print-document`, `.staff-only` and the "hide nav in print" rule (today `.sidebar`; update the selector to the new top bar).
- **Add unit tests:** `tripSteps`, home job ordering, `destinationCode`, plain-language label maps.
- **Add e2e tests:** Home "Record ticket" refuses a blank reference and then clears the job; inquiry stage move via the card button; Trip "Do this next" advances after paying ₱6,000 on Andrea's new booking.
- Never weaken an assertion to make it pass.

## 9. Known data issues to fix in the seed

- **Visa countries are wrong.** `seed/index.ts` sets `country: i % 2 === 0 ? "Japan" : "South Korea"`, so Miguel's Seoul trip gets a Japan visa, and El Nido and Boracay (domestic) trips get visa cases. Fix it: derive the country from the booking's package destination, and only create cases for international destinations that need a visa for Philippine passport holders in this demo (Japan, South Korea). Singapore and Hong Kong are visa-free for short stays, El Nido and Boracay are domestic. Only three seeded bookings truly need visas (HTT-B-2026-0081 Seoul, 0086 Tokyo–Osaka, 0087 Seoul), with 8 travellers between them. `QA_HANDOFF.md` expects **6 visa cases**, so create the 6 cases for travellers on those three bookings (and set `visaRequired` to match). Keep the same stage mix (3 collecting, 1 under review, 1 approved, 1 released). Update unit tests and `QA_HANDOFF.md` notes if any reference changes.
- **Weekdays:** never hard-code weekday names. Format them from dates (`EEE d MMM`).

## 10. Out of scope

Backend, database, auth, roles, real payments, embassy submission, real ticketing, supplier integrations, a native mobile app, PDF libraries, and changing reference prefixes. The production list in `DECISIONS.md` still applies.

## 11. Definition of done

- Every screen in §5 is built and visually matches its mock at 1440 px. It works at 1024 px and is usable at 390 px.
- The front screens' buttons all work against the real store (no dead `#` links in the main flow).
- The `DEMO_SCRIPT.md` story can be presented end to end on the new UI. Update the script's click paths and labels to match.
- Lint, typecheck, unit, build and e2e all pass. Test counts are reported in `PROGRESS.md`.
- `DECISIONS.md` records the MEP branding decision, the new routes and the label map.
- No "AI slop" patterns from §2 anywhere.
