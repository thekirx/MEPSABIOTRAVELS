# TravelOS for MEP Sabio Travel — AI handoff

> **Reviewing AI: start here.** This file is the current source of truth. Read it fully, then the code. Some older docs are partly out of date (see "Outdated docs" below).
>
> State as of commit `1b94eba` on `main` (GitHub: `thekirx/MEPSABIOTRAVELS`, public), 22 Oct 2026.

## 1. What we need from you

Read this file and the repository, then write **`AI_REVIEW.md`** in the repo root with three sections:

1. **Summary of what was built.** Write it in plain language for the agency owner, then add a short technical summary.
2. **QA results.** Run the checks in §7 and the manual checks in §8. For each problem give the steps to reproduce, the expected and actual result, and a severity (P0 blocker, P1 major, P2 minor, P3 polish).
3. **Improvements, ranked.** Use the backlog in §10 as a starting point, then add, challenge or re-rank it. For each item give the user value, the rough effort (S/M/L), the risks, and which files it touches.

Rules:

- **Review only.** Don't change application code, install packages, push, deploy, or connect outside services unless the user asks.
- Use your own browser profile or context. The app saves data in the browser (LocalStorage), and resetting it in someone else's browser erases their demo changes.
- Don't trust earlier "tests passed" claims, including this file's. Run the checks yourself and look for gaps in the tests.

## 2. What this product is

**TravelOS** is an internal **team portal** for **MEP Sabio Travel**, a Philippine travel agency. It is built by Optrizo Information Technology Solutions. Agency staff (Sales, Ticketing, Visa, Owner) use it every day to handle client inquiries, quotes, bookings, payments and visas.

**Important gap:** the goal is a shared team portal, but the code is still a **single-browser demo**:

- There is no server, database, login or user accounts. Each browser keeps its own copy of the data in LocalStorage (key `travelos-demo-v1`), so two staff members never see each other's changes.
- All data is synthetic. It comes from a built-in demo data set (`src/seed/index.ts`) whose dates move with today's date. "Reset demo" restores it.
- Every screen shows "DEMO — simulated data". No real emails, tickets, payments or visa filings happen.

Judge the work in two ways: is it a correct, polished demo, and how far is it from a working multi-user team portal?

## 3. The agency's real workflow (what the app must support)

The client described their current process like this:

1. A client **emails** asking for a trip.
2. Staff make a **quotation** for the trip.
3. Staff **find flights**, including connecting flights.
4. Staff **log the quote in Google Sheets**.
5. Staff **screenshot the flight details**.
6. Staff create a **mock ticket** (a flight and price preview, not an issued ticket) with their **markup added as a peso amount, not a percentage**.
7. Staff **email it to the client for approval**.
8. **Travel insurance should be included on every trip.**

How the app covers each step today:

| Step                         | In the app                                                                                                                                                                                                                                                                                               | Where                                                                    |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| 1. Client emails             | "Email" is an inquiry source and the default for new inquiries. Inquiries are entered by hand; there is no inbox connection.                                                                                                                                                                             | `src/features/inquiries/new-inquiry.tsx`                                 |
| 2. Quotation                 | Quote summary page (`/quotations/view?id=`) and full editor (`/quotations/edit?id=`).                                                                                                                                                                                                                    | `src/features/quotations/*`                                              |
| 3. Flights                   | **Flights** section: free-text details (airline, flight numbers, times, connections).                                                                                                                                                                                                                    | `quote-flights.tsx`                                                      |
| 4. Google Sheets             | **Not covered.** The Quotes list replaces the sheet, but there is no Sheets import or export.                                                                                                                                                                                                            | —                                                                        |
| 5. Screenshot                | Paste (⌘V/Ctrl+V), drop or upload up to 4 screenshots. They are shrunk to JPEG in the browser and saved in LocalStorage.                                                                                                                                                                                 | `quote-flights.tsx`                                                      |
| 6. Mock ticket + peso markup | The customer copy shows a "Your flights · not yet ticketed" box with the details and screenshots. Markup is a **fixed peso amount per person**, with quick picks of ₱500, ₱1,000, ₱1,500 and ₱2,000 or any custom amount.                                                                                | `quotation-document.tsx`, `markup-picker.tsx`                            |
| 7. Email for approval        | The "Email [client] for approval" dialog has editable To, Subject and Message fields, a mailto link and a copy button. Staff save a PDF with the browser's print dialog and attach it themselves. Opening or copying the email marks the quote Sent. The client's "yes" is recorded with "Yes, book it". | `email-approval.tsx`                                                     |
| 8. Insurance                 | A travel insurance line (default ₱1,500 per person, editable) is on every demo quote and every new quote, and stays when the package changes. A red "No travel insurance yet" box with a one-click add appears when it's missing.                                                                        | `src/domain/quote.ts`, `quotation-builder.tsx`, `quotation-sections.tsx` |

**Assumption to confirm with the client:** markup is charged **per person**, not as one amount for the whole booking.

## 4. What was done (history)

All 25 commits are on `main`; `git log --oneline` lists them.

1. **Original build:** a browser-only demo with inquiries, quotes, bookings, payments, visas and settings, plus 21 unit tests and 20 browser tests.
2. **MEP redesign, phases 1–8:** MEP's colours (charcoal `#292b2f`, lime `#c8e63c`, team red `#c62828`, cream), Barlow and Barlow Condensed fonts, a top navigation bar instead of a sidebar, and simple "front" screens with full detail pages one click deeper. Approved mocks are in `design/mocks/`. Details are in `REDESIGN_HANDOFF.md`, `REDESIGN_PLAN.md` and `PROGRESS.md`.
3. **Logo fix** (`58fae2d`): the top bar showed only a cropped "MEP" mark. A horizontal lockup, `public/brand/mep-logo-horizontal.png`, was built from the real logo files. It is now used in the top bar, quotes, statements and settings.
4. **Quote flow matching the agency** (`1b94eba`): everything in §3 above.
   - **Saved data moves to the new format automatically** (`src/store/migrate.ts`, schema 1 → 2). Open quotes switch to the peso markup that gives the same price. Accepted quotes and booking snapshots keep their old `markupPct`, so locked prices and payment plans don't move. Unknown or old data gets the fresh demo data.
   - Andrea's demo quote keeps its ₱220,000 total: insurance was added and her markup is ₱3,500 per person. Other demo totals changed slightly.
   - A fictional flight screenshot, `public/demo/flight-options-q1.png`, is attached to the demo quote `q1`.
   - The new tests are in `tests/unit/quote-flow.test.ts`, plus one browser test at the end of `tests/e2e/workflows.spec.ts`.

The branch history matters if you compare against older docs. The redesign was built on `redesign/mep`. On 21 Oct that branch was **renamed to `main`**, which replaced the original pre-redesign `main` (`5260908`, not pushed), and `main` was pushed to GitHub.

## 5. Tech stack and code map

- Next.js 16 (App Router) with a static export (`output: "export"`, built to `out/`), React 19 and TypeScript.
- Zustand with the persist middleware saving to LocalStorage; date-fns; Zod and React Hook Form; Tailwind 4 with Base UI/shadcn parts; sonner for toasts.
- Tests: Vitest (unit tests) and Playwright Chromium (browser tests against the built `out/`, served on port 4173).

```
src/
  domain/      types.ts (data model), quote.ts (price math, insurance), money.ts, payments.ts, dates.ts, labels.ts
  store/       index.ts (persist + load), actions.ts (all writes and validation), selectors.ts, migrate.ts
  seed/        index.ts (deterministic demo data, dates relative to today)
  features/    dashboard, inquiries, customers, quotations, bookings, payments, visas, settings
  components/  shell (top bar), blocks, shared (Modal, Field, notify), ui, agency-logo.tsx
  app/         thin route pages + globals.css (main stylesheet); styles/print.css (A4 print)
```

Routes: `/dashboard` (Home), `/inquiries` (People asking), `/customers/view?id=`, `/quotations`, `/quotations/view?id=`, `/quotations/edit?id=`, `/bookings`, `/bookings/view?id=`, `/bookings/details?id=`, `/payments`, `/visas`, `/settings`.
Detail pages take IDs in the query string so that records created at runtime work on a static host.

## 6. Rules the data must follow

- Money is stored as whole **centavos** (safe integers). It is formatted as ₱ only for display.
- Quote math (`src/domain/quote.ts`):
  - `netCost` = sum over lines of (cost × pax for per-person lines, or cost once for per-group lines)
  - `markup` = `markupPerPaxCentavos × paxCount`. Quotes saved before the change that still have only `markupPct` use `round(netCost × pct / 100)`.
  - `selling = netCost + markup − discountCentavos`; `grossProfit = selling − netCost`; `perPax = round(selling / paxCount)`
- Accepting a quote creates **one** booking with a frozen copy of the quote and a 30% deposit plus a final balance. Accepting it again must not create a duplicate. Accepted quotes are read-only.
- Balances, payment status, counts and KPIs are calculated from the records, never stored separately. "Overdue" is cumulative: total paid is less than the total of installments already due.
- Payments that are zero, negative, fractional-centavo or more than the balance are rejected, and the data stays unchanged.
- Demo data is deterministic: 5 agents, 24 customers, 18 leads, 6 packages, 8 quotes, 7 bookings, 6 visa cases. Every quote includes insurance.

## 7. Automated checks to run

```sh
cd /Users/kiro/Desktop/MEPTRVL   # or a fresh clone
npm ci
npm run format:check && npm run lint && npm run typecheck
npm test                # Vitest. Last known: 27 passed
npm run build           # writes out/
npx playwright install chromium
npm run e2e             # Playwright on out/ at :4173. Last known: 21 passed
```

Notes:

- Check that whatever is on port 4173 serves **this** checkout's latest `out/`. Playwright reuses a running server.
- The new browser test, "quote flow: flight screenshot…", **failed once and then passed in two later full runs**. Look into whether it's flaky; the screenshot shrinking runs in the background after upload.

## 8. Manual QA checklist

Start from a fresh reset in your own browser context (Settings → Reset demo data).

**Quote flow (new, highest priority)**

- [ ] Andrea Reyes (`q1`, inquiry source now **Email**): total ₱220,000.00, ₱55,000 per person, markup ₱3,500 × 4 = ₱14,000, insurance listed, flights box with screenshot on the customer copy.
- [ ] Markup quick picks and a custom amount update the total live; negative or fractional values are rejected; the accepted quote is locked.
- [ ] Flights: paste a real screenshot with ⌘V into the box; drop one; upload one; try a 5th (it should be refused); remove one; try a non-image file. Watch for LocalStorage running out of space with several large screenshots.
- [ ] Remove the insurance line → the red box appears → "Add travel insurance" fixes it. Change the package → insurance stays.
- [ ] Email dialog: the To, Subject and Message fields match the current quote (total, per-person price, deposit, validity, flights, "travel insurance included"). Edit the quote and reopen the dialog: the text must update. Check that the mailto link opens and that very long messages still work. Copying marks a Draft as Sent.
- [ ] Print / Save as PDF: one or two clean A4 pages with the flights box and screenshot, and no staff costs, markup or controls.
- [ ] Create a new inquiry (default source Email) → new quote: it starts with an airfare line, insurance and ₱1,000 per person markup.
- [ ] Moving old saved data: put a schema-1 save (with `markupPct`) in LocalStorage, reload, and check that open-quote totals are unchanged and accepted bookings are untouched.

**Rest of the app.** Re-run the journeys in `QA_HANDOFF.md` §"Required browser acceptance journey", using the updated numbers below instead of the old ones:

- Accept `q1` → booking `b8` with 4 travelers, **5 services** (insurance added), deposit ₱66,000 and balance ₱154,000.
- Pay the deposit, check payment statuses and statements, add a traveler and a visa case, record a ticket reference, search, reset and branding upload.
- Check widths of 1440, 1024 and 390 px: no sideways scrolling, and the logo is readable on phone width.
- Check keyboard use (dialogs trap focus, Escape closes them), colour contrast and screen-reader labels.

## 9. Known issues and shortcuts (already known; confirm or re-rank)

1. **Not multi-user**: there is no backend, login or shared data (see §2). This is the biggest gap for a team portal.
2. **Email can't attach the PDF**: `mailto:` can't carry attachments, so staff attach the PDF by hand. The app also can't see the client's reply; approval is recorded by hand.
3. **Screenshots live in LocalStorage** (about 5 MB per site). Several screenshots across quotes can fill it, and there is **no handling when storage is full**.
4. **The package price assumes the old 10% markup**: `quotation-sections.tsx` sets the package line cost as `basePrice / 1.1`. With peso markup, this guess no longer makes sense.
5. **The 30% deposit is hard-coded** in several places (`actions.ts`, `seed`, `quotation-document.tsx`, `quotation-details.tsx`, `email-approval.tsx`, `selectors.ts`).
6. **Insurance cost is a placeholder** (₱1,500 per person, supplier "Travel insurer"). There are no real rates or insurer.
7. **Flight details are free text**, not structured segments (flight number, airports, times, baggage), so they can't be checked, searched or turned into a ticket template.
8. **The signed-in user is fake**: Home always greets the Owner, the avatar always shows "IS", and the greeting always says "Good morning".
9. Edit history records what changed but **not who changed it** (there are no users).
10. Quote IDs come from the record count (`q${length+1}`). That's fine with no deletion, but it will collide once delete exists or several people create quotes at once.
11. There is no Google Sheets import or export, and no CSV export of quotes.

## 10. Improvement backlog (starting point; please challenge it)

**Turning the demo into a team portal (largest value):**

1. Backend and shared data (for example Postgres via Supabase or Neon), replacing LocalStorage. Keep `src/domain` as the source of truth for the rules.
2. Logins and roles (Sales, Ticketing, Visa, Owner already exist in the data model): who can see costs and profit, and who can accept quotes or record payments.
3. An audit trail with the user's name on quote edits, payments and status changes.
4. File storage for flight screenshots and generated PDFs, instead of LocalStorage.
5. Real email: send from the app with the PDF attached (for example a transactional email service or a Gmail integration), track sent and opened status, and optionally offer a client approval link ("Approve this quote") that records approval automatically.
6. Email intake: create inquiries from the agency inbox.

**Quote workflow polish:** 7. Structured flight segments with a proper mock-ticket template (keep the screenshot as an option). 8. Settings for insurance products and rates, the deposit percentage and markup quick picks. 9. A fix for the package-line `/1.1` assumption. 10. CSV/Sheets export of the quote list during the move away from Google Sheets. 11. A quote follow-up board: Sent → waiting for reply → reminder after N days → expired.

**Quality:** 12. Handle full storage with a clear message (only needed while data stays in LocalStorage). 13. Fix or confirm the flaky browser test; add tests for pasting from the clipboard and for large images. 14. An accessibility pass (screen reader, focus order on the new dialogs). 15. Bring `QA_HANDOFF.md` in line with peso markup (§11).

## 11. Outdated docs (don't trust these parts)

- `QA_HANDOFF.md`: it uses `markupPct` and 10%/15% markup tests, says Andrea's source is Facebook Messenger (now Email), expects 4 services on `b8` and says the branch is `redesign/mep`. All of these changed (see §6 and §8).
- `README.md`: it calls the product a "presentation-ready demo". The goal is now a team portal (§2).
- `PROGRESS.md` / `REDESIGN_*`: these are accurate history up to the redesign. Test counts there (21 unit, 20 e2e) are older than the current 27 and 21.
- `DECISIONS.md`: the latest section ("Agency quote flow") is current.

## 12. Constraints and preferences

- UI direction: calm and worker-first; big flat colour blocks in MEP colours; one main button per block; plain everyday words; no gradients, glows or decorative icons; simple front screens with dense detail one click deeper. See `design/mocks/`.
- Don't add real people's data. Demo names, suppliers and the airline are fictional.
- The repo is **public**. Never commit secrets or real client data.
