# Redesign plan — TravelOS × MEP Sabio Travel (web app)

Read `REDESIGN_HANDOFF.md` first. It holds the why, the specs and the rules. This file is the **order of work**.

## Working rules

- Work on a branch: `git switch -c redesign/mep`. Make **one commit per phase**, with message `redesign: phase N — <name>`.
- Run the **gate** after every phase. Don't start the next phase until the gate is green.
- **Gate** = `npm run lint && npm run typecheck && npm test && npm run build && npm run e2e`. Plus a visual check of the phase's screens at **1440 × 900**, **1024 × 768** and **390 × 844** against the mock in `design/mocks/` (view the mocks with `npx http-server design/mocks -p 4300 -c-1`).
- Don't change domain maths (`src/domain/`) except where a phase says so. Add selectors instead of storing derived values.
- If an e2e test breaks because a label moved, either keep the accessible name (preferred) or update the test with an **equally strong** assertion, and note it in `PROGRESS.md`.
- Log each phase in `PROGRESS.md`: what changed, gate results with test counts, screenshots taken (save them outside the repo) and any deviation from the mock with its reason.

---

## Phase 0 — Baseline (no UI changes)

1. `npm ci`, then run the full gate. Record the baseline: lint, typecheck, unit count, e2e count and build status.
2. Open every mock and click the front-screen flow: Home → People asking → Quote → Yes, book it → Trip → steps to "Ready to fly". Use **Reset demo** after.
3. Read `src/features/*`, `src/components/shell/shell.tsx`, `src/store/selectors.ts` and `actions.ts`.

**Done when:** the baseline is recorded in `PROGRESS.md` and the gate is green on the untouched branch.

## Phase 1 — Brand, tokens, fonts, top bar

Files: `src/app/globals.css`, `src/app/layout.tsx`, `src/components/shell/shell.tsx`, `src/styles/print.css`, `public/brand/*`, `src/seed/index.ts` (settings only).

1. Copy `design/mocks/assets/mep-mark.png` and `mep-logo-full.png` to `public/brand/`.
2. Replace the Geist font with `Barlow_Condensed` (500/600/700) and `Barlow` (400–700) via `next/font/google`, exposed as CSS variables.
3. Port the tokens from `design/mocks/mock.css` (`--char`, `--lime`, `--red`, `--cream`, `--ink`, `--muted`, `--ok`, `--line`, radius 18) into `globals.css` and map shadcn variables (primary = lime with ink text, destructive = red, background = cream). Delete the old navy/teal sidebar CSS once nothing uses it.
4. Rebuild the shell as the **charcoal top bar**: logo, nav (Home `/dashboard`, People asking `/inquiries`, Quotes `/quotations`, Payments `/payments` + red dot when anything is overdue, Visas `/visas`), DEMO pill and avatar menu (Settings, Reset demo). Keep global search working (labelled "Global search"), Shift+R reset and the reset confirmation. Footer: "MEP Sabio Travel · Quality travel for less · reservations@meptravel.com · mepsabiotravel.com · DEMO — simulated data".
5. Seed settings: the default agency name becomes "MEP Sabio Travel", with the logo from `/brand/`. Reset restores it. Settings can still rename it.
6. Print CSS: hide the new top bar and footer (replace the `.sidebar/.topbar` rules). Update the e2e print-isolation assertion that checks `.sidebar` to check the new bar.
7. Responsive: at ≤ 1100 px tighten nav padding. At ≤ 760 px nav becomes icon + short label or a horizontal scroller. There must never be page-level sideways scroll.

**Done when:** every existing page renders inside the new bar with the new fonts and colours, nothing overflows at 390 px, and the gate is green.

## Phase 2 — Shared building blocks

Create `src/components/blocks/` (or extend `src/components/shared`):

| Component | From mock | Notes |
|---|---|---|
| `Block` (`variant: char \| lime \| red \| white \| done`) | `.block` | Tag, title, body, actions slot |
| `BigNumber` | `.big` | Barlow Condensed, tabular numbers, formatted from centavos |
| `StatusChip` (`late \| next \| ok \| wait \| dark`) | `.chip` | Always text |
| `LuggageTag` | `.lug` | Code, city, date, people, status strip |
| `StageBlock` | `.stage` | Count, label, helper text, `aria-pressed` |
| `HeadBlock` | `.head-block` | Detail-page header with facts and actions |
| `DetailLayout` + `SectionMenu` | `.detail` / `.subnav` | Sticky menu that highlights the section in view (IntersectionObserver) |
| `Sheet`, `KeyValues`, `DataTable` styles | `.sheet`, `.kv`, `.t` | Tables scroll inside the sheet on narrow screens |
| `FormDialog` | `app.js` `dialog()` | shadcn Dialog plus react-hook-form + zod. Visible labels, inline errors with `role="alert"`, focus on first error |
| `PaymentDialog` | Home/Trip payment | Refactor `features/payments/payment-dialog.tsx` onto `FormDialog`. Keep labels "Amount (PHP)" and "Save payment" and all existing validation |
| Toasts | `.toast` | Keep sonner. Restyle as charcoal with a lime edge |

Add `src/domain/labels.ts` (plain-language stage, booking and service labels, from the handoff §4) and `src/domain/places.ts` (`destinationCode`). Unit test both.

**Done when:** a temporary `/dev/blocks` page (delete it before Phase 8, or exclude it from export) shows every component, each matches the mock, and the gate is green.

## Phase 3 — Home (`/dashboard`)

Files: `src/features/dashboard/dashboard.tsx`, `src/store/selectors.ts`.

1. Add the selector `homeJobs(s)`: `attention(s)` sorted by urgency. Unit test the order.
2. Build the header, the 3 job blocks with working actions (Record ticket → reference dialog → `updateServiceStatus(..., "Issued", ref)`; Record payment → `PaymentDialog`; Open quote; Open visas), session "✓ Done" blocks, and "See all N jobs".
3. Leaving soon: 4 `LuggageTag`s from `upcoming(s)`, plus "See all trips →".
4. Remove the KPI strip, chart and table from Home. Keep `kpis`/`monthlyBookings` for `/bookings` or `/payments` if you reuse them.
5. Add an e2e test: a blank reference is refused, `SIM-TKT-7788` clears Miguel's job, and the luggage tag shows "Ticket issued". Update test 5 if its click path changed.

**Done when:** Home matches `home.html`, the actions work against the store and survive a reload, and the gate is green.

## Phase 4 — People asking and Customer

Files: `src/features/inquiries/inquiries.tsx`, new `src/app/customers/view/page.tsx`, new `src/features/customers/customer.tsx`.

1. Stage blocks (state in `?stage=`), help line, 2-column person cards, one action per stage, the finished view with Reopen, and the "+ Someone new" dialog using `createLead`. Keep a "Lead stage" select and the table view for tests.
2. Customer page per `customer.html`, with notes using `addLeadNote`.
3. Redirect `/inquiries?customer=ID` to `/customers/view?id=ID`, and point global search there. Update the global-search e2e test to expect the customer page heading.

**Done when:** both pages match their mocks, the pipeline moves people correctly, counts update everywhere, and the gate is green.

## Phase 5 — Quote and Quote details

Files: `src/features/quotations/quotation-builder.tsx` (split it), `src/app/quotations/view/page.tsx`, new `src/app/quotations/edit/page.tsx`.

1. **Quote front** per `quotation.html`: step pills, "Edit every detail →", markup picker (8/10/12/15 + Other; a "Markup (%)" input must stay available), lime result block (staff-only), customer copy on MEP letterhead (`.print-document`), and the charcoal "Yes, book it" block with a confirm dialog that calls `acceptQuotation` and goes to the new booking. Accessible name: "Accept & convert to booking".
2. **Locked state** after acceptance: disabled pickers, "price is locked" text, "✓ Booked · Open trip".
3. **Quote details** per `quote-details.html`: move the full editor here with its validations, sections and sticky menu. Keep the "Save" button.
4. **Print:** one clean A4 page for the seeded quote, with Customer view on and off, and no staff-only content. Check visually in Chrome's print preview.

**Done when:** e2e tests 1, 2 and 6 pass (Andrea pricing ₱220,000 → ₱230,000 at 15% → back to ₱220,000; acceptance creates HTT-B-2026-0088 once), print is clean, and the gate is green.

## Phase 6 — Trip and Trip details

Files: `src/features/bookings/booking-detail.tsx` (split it), `src/app/bookings/view/page.tsx`, new `src/app/bookings/details/page.tsx`, `src/store/selectors.ts`.

1. Add the selector `tripSteps(s, booking)` per handoff §5.6, including the optional visa step. Unit test: fresh booking, after ₱60,000, after ₱6,000, all done, and a cancelled booking.
2. **Trip front** per `booking.html`: header with days to go, lime "Do this next" driven by `tripSteps`, checklist (open steps are buttons), money block, "See full trip details →". Dialogs: payment (pre-filled), supplier references (one required field per open service), travellers, tickets (reference required).
3. **Trip details** per `trip-details.html`: restyle the existing tabs into sections with a sticky menu. Keep labels "Service status", "Supplier reference", "Add traveler", "Full name", "Date of birth", "Passport expiry", "Create visa case", "Record payment" and the issued-without-reference guard.
4. Add an e2e test: accept Andrea's quote, pay ₱60,000, see "Collect ₱6,000 more for the deposit", pay ₱6,000, and see the next step "Confirm flight, hotel, tours and car".

**Done when:** the demo journeys 2–5 in `QA_HANDOFF.md` pass on the new UI, and the gate is green.

## Phase 7 — All trips, Payments, Visas, Quotes list, Settings

Files: `src/features/bookings/booking-list.tsx`, `src/features/payments/payments-ledger.tsx`, `src/features/visas/visas.tsx`, `src/features/quotations/quotation-list.tsx`, `src/app/settings/page.tsx`.

1. **All trips** per `trips.html`: stat blocks, filters with counts, search, table with next-step chips from `tripSteps`.
2. **Payments** per `payments.html`: four blocks, "Who owes what" sorted by urgency with a Record button per row, payments received, statement printing.
3. **Visas** per `visas.html`: missing-case callout, stage filters, cases table, selected case panel (`?case=`), checklist, "Visa stage" select, "All requirements complete".
4. **Quotes list** and **Settings:** restyle in the same system. Keep "Agency name", "Reset demo data" and "Reset demo".

**Done when:** each page matches its mock (or the system, for pages without a mock), and the gate is green.

## Phase 8 — Seed fix, docs and final QA

1. **Seed:** fix the visa countries per handoff §9 (6 cases on the Japan and Korea bookings, same stage mix). Update unit tests.
2. Delete the `/dev/blocks` page. Search for leftover `href="#"` in front-screen flows.
3. Update `DEMO_SCRIPT.md` click paths and labels for the new UI (Home jobs, People asking stages, "Yes, book it", Trip "Do this next").
4. Update `DECISIONS.md`: MEP branding (user-approved), top bar instead of sidebar, the two-layer front and detail design, new routes, the label map, and the seed visa fix.
5. **Final QA** with `QA_HANDOFF.md` journeys 1–6 on a fresh reset, at 1440, 1024 and 390 px:
   - Print checks.
   - Console free of app errors.
   - No page-level horizontal scroll.
   - Keyboard-only pass through each front screen's dialogs.
6. Check the §2 "Never do" list against every screen.

**Done when:** the full gate is green, `PROGRESS.md` holds final counts and screenshots paths, and the demo can be presented end to end.

---

## Effort guide

| Phase | Size |
|---|---|
| 0 Baseline | S |
| 1 Brand, tokens, top bar | M |
| 2 Building blocks | M |
| 3 Home | M |
| 4 People asking + Customer | M |
| 5 Quote + Quote details + print | L |
| 6 Trip + Trip details + `tripSteps` | L |
| 7 Trips, Payments, Visas, Quotes, Settings | L |
| 8 Seed fix, docs, QA | M |

## Ask the user before you

- Change reference prefixes from `HTT-` to `MEP-`.
- Remove any page or feature that exists today.
- Add a dependency other than the fonts.
- Deploy, push, or connect anything external.
