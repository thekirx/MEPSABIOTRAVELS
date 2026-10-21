# Optrizo TravelOS — independent AI QA handoff

## Copy this task to the reviewing AI

Independently audit the local Optrizo TravelOS demo in this repository. Verify the implementation against the requirements below, inspect the code, rerun automated checks, and exercise the rendered app. Do not assume that prior passing tests prove correctness. Look for gaps in their coverage.

This task is a review, not a feature request. Do not change application code, install unrelated libraries, deploy, push, or connect external services. Write your findings to `QA_REPORT.md` in the repository root. If fixes are requested later, reproduce each defect with a failing test before changing code.

Use a separate browser context/profile for QA. Reset and mutation tests must not erase the presenter's current browser data. The running in-app browser may contain demo changes the user wants to keep.

## Local project and saved state

- Project folder: `/Users/kiro/Desktop/MEPTRVL`.
- Application implementation baseline: Git commit `890a0e5` (the QA handoff document is added after that commit).
- Source files and lockfile are saved locally and committed to Git.
- Browser records are saved separately in that browser's LocalStorage under `travelos-demo-v1`; they are not part of the Git repository or shared by a URL.
- Development URL, if running: `http://localhost:3000/dashboard/`.
- Static QA URL: `http://127.0.0.1:4173`.
- Node.js requirement: 22.12 or later; use the committed npm lockfile.
- Default agency: fictional **Horizon Travel & Tours**. Product: **Optrizo TravelOS**, built by Optrizo Information Technology Solutions.
- Client reference: https://www.facebook.com/mepsabiotravel/. Prior access returned a Facebook temporary-block page. No real business facts were verified or imported. Do not claim otherwise.

## Read first

1. `README.md`: setup, commands, persistence and print behavior.
2. `DEMO_SCRIPT.md`: intended seven-minute presenter journey.
3. `DECISIONS.md`: deliberate shortcuts, visual comparisons and production limitations.
4. `PROGRESS.md`: prior phase gates and review repairs. Treat these as historical claims to verify.
5. `src/domain/`, `src/seed/`, `src/store/`, `tests/unit/`, and `tests/e2e/`.
6. The original brief, if still available: `/Users/kiro/.codex/attachments/f0c6ec8f-56d6-40d3-af78-6d3e6a38eb5a/Pasted text.txt`.

## Run the checks yourself

```sh
cd /Users/kiro/Desktop/MEPTRVL
npm ci
npm run lint
npm run typecheck
npm test
npm run build
npx playwright install chromium
npm run e2e
```

The e2e configuration serves the `out/` static export on port 4173. Inspect any existing process on that port before reusing it: it must serve this checkout's latest `out/`, not another project or stale build. Do not stop unrelated processes. Use a different port with matching configuration if necessary, and record the deviation.

For interactive QA, use the static export where possible. `npm run dev` is also available, but development-server success alone does not establish that static hosting works.

Prior results, to recheck: lint/typecheck/build passed; **8 unit tests** and **10 Chromium tests** passed; default quote and statement each printed as one A4 page. Test counts may increase if later commits add coverage. Distinguish application console errors from test runner/environment warnings.

## Product boundaries

This is a reliable pre-sales demo for one presenter, not a production travel system. It is deliberately browser-only:

- Next.js App Router + TypeScript, `output: 'export'`.
- Tailwind, shadcn primitives, Lucide; Recharts on the dashboard only.
- Zustand persist + LocalStorage; Zod/React Hook Form; date-fns.
- No backend/API routes, auth, database, Supabase, payment processing, embassy submission, real ticket issuance, PDF library, or supplier integration.
- Seven sidebar items: Overview, Inquiries, Quotations, Bookings, Payments, Visas, Settings.
- Details use `/quotations/view?id=...` and `/bookings/view?id=...`, intentionally supporting runtime-created IDs on static hosts.
- Pipeline stage dropdowns are required; drag-and-drop is intentionally omitted.
- Every screen must show **DEMO — simulated data**. Service confirmations and payments are recorded manually and labeled as simulated.

Report violations of these boundaries, but do not classify the intentionally absent production features as demo defects.

## Financial and data invariants

- All stored monetary values are safe integer **centavos**, never floating peso amounts. PHP formatting happens only for display.
- For each quote line: per-pax cost × quoted pax; per-group cost once.
- `netCost = sum(line totals)`.
- `selling = Math.round(netCost * (1 + markupPct / 100)) - discountCentavos`.
- `grossProfit = selling - netCost`.
- `perPax = Math.round(selling / paxCount)`.
- Outstanding balance, paid totals, payment status, customer balance, KPIs, chart values and stage counts must be derived from records, not stored as independent values.
- A booking freezes the accepted quotation snapshot. Later changes must not reprice it. Repeat acceptance must not create another booking.
- Overdue means cumulative payments are below cumulative installments whose due dates are before today; merely passing one installment's date is not enough if cumulative payments cover it.
- Reject zero, negative, invalid, fractional-centavo and over-balance payments. Invalid form submissions must leave records unchanged.
- Active receivables and upcoming departures exclude cancelled bookings. Check consistency across all surfaces.
- Seed data must be deterministic, with dates generated relative to first load/reset: 5 agents, 24 customers, 18 leads, 6 packages, 8 quotations, 7 bookings, 6 visa cases, and matching payments/installments.
- Foreign keys must resolve. Customer names, contact details, supplier names and traveler data must be synthetic.

## Required browser acceptance journey

Start from a fresh reset **inside the isolated QA browser context**. Record baseline monthly booking count and receivables before each relevant mutation. Do not hardcode a calendar date or monthly count: the seed is relative to the current date.

### 1. Andrea inquiry → quote → live pricing → print

- Find Andrea Reyes in Inquiries, initially **Negotiating**, source **Facebook Messenger**.
- Open her customer drawer, then quotation **HTT-Q-2026-0142** (`q1`).
- Verify Tokyo–Osaka 6D5N, 4 pax, departure reset day +45, return +50, status Sent, and no Andrea booking yet.
- At 10% markup and zero discount: net cost **₱200,000.00**, total **₱220,000.00**, profit **₱20,000.00**, per pax **₱55,000.00**.
- Change markup to 15%: total **₱230,000.00**, per pax **₱57,500.00**. Restore 10% before continuing.
- Exercise line description, supplier, cost, category and per-pax/per-group edits, package prefill, discount, itinerary, validity and Save/Mark as Sent. Restore/reset before the main conversion if these change the seed total.
- Print using browser print: A4, one or two clean pages, no sidebar/editor/controls/staff cost or margin. Test printing with Customer view both checked and unchecked.
- Customer document includes agency identity, itinerary, inclusions/exclusions, per-pax price, payment terms, validity and “Rates subject to availability until ticketed”.

### 2. Accept once → frozen booking → derived counts

- At the restored **₱220,000.00** total, click Accept & convert to booking.
- Verify new booking `b8`, reference **HTT-B-2026-0088** on an untouched seed.
- Verify 4 traveler placeholders, 4 Requested services, frozen accepted snapshot and lead **Won**.
- Verify installment amounts **₱66,000.00** deposit and **₱154,000.00** balance, summing to **₱220,000.00**.
- Deposit is due in 3 days; final balance is due 30 days before departure.
- Monthly booking count increases by exactly **1**. Active receivables increase by **₱220,000.00** before payment.
- Reload, open the booking URL directly, and verify the runtime-created ID works in the static export.
- Reopen the accepted quotation: pricing controls are read-only. Repeated acceptance must not duplicate records.

### 3. Record deposit → every balance agrees

- Record **60000** PHP by Bank Transfer on Andrea's new booking.
- Verify total **₱220,000.00**, paid **₱60,000.00**, outstanding **₱160,000.00**, status **Partially Paid**.
- Verify the same outstanding amount in booking detail, Payments ledger, and customer drawer.
- Dashboard receivables decrease by exactly **₱60,000.00** from the value immediately before payment.
- The planned deposit remains ₱66,000: ₱6,000 remains due in three days. The payment must not silently rewrite the installment plan.
- Try zero, negative, invalid and over-balance amounts; verify validation and no added payment record.
- Print the statement: **“Statement — not an official receipt/invoice.”**, correct figures and payment history; clean A4 output.

### 4. Traveler → visa case → checklist → stage counts

- Create a visa case for Andrea's first traveler with visaRequired enabled.
- Verify it is linked to the correct booking/traveler, with the expected checklist and synthetic placeholder name.
- Tick all checklist items: completion should suggest moving to Complete.
- Change the stage to **Complete**; verify counts/filter results update immediately.
- Open the same case again: do not create duplicate cases for the same traveler/booking.
- Exercise visa dates and notes. Reload and verify persistence.

### 5. Ticketing deadline → manual reference → alert removed

- On a fresh seed, Overview must include an **Airfare deadline** for Miguel Santos, booking **HTT-B-2026-0081** (`b1`).
- Its airfare is **On Hold**, with a deadline tomorrow.
- Attempt Issued with a blank reference: it must be rejected without changing status.
- Enter **SIM-TKT-7788**, then select Issued. The label must describe the reference as manually recorded/simulated.
- Return to Overview: this specific airfare alert disappears. Unrelated attention items remain.
- Check that deadlines within 72 hours are surfaced and terminal Issued/Cancelled services are excluded.

### 6. Refresh → preserve changes → reset → restore seed

- After Andrea's payment, reload and reopen the booking: balance remains **₱160,000.00**.
- Change agency name/logo, save, and verify sidebar, quotation and statement use the saved identity.
- In the QA context, Settings → Reset demo data → confirm restores all seed records **and branding**.
- Andrea returns to Negotiating with a Sent ₱220,000 quote and no booking; 7 seeded bookings remain; the airfare alert returns.
- Test Shift+R confirmation, cancellation, and confirmation. Typing Shift+R in text fields must not reset data.

## Regression and edge-case checks

Prior review found and repaired these; independently verify them:

- Clearing/invalidating quotation validity, departure or return dates must not persist invalid required dates or crash Overview.
- Legacy empty validity data must not crash attention selectors.
- While already on Inquiries, use global search to select Andrea, then another customer. The drawer must follow the URL, not retain stale selection. Also test drawer close and browser back/forward.
- Storage version/schema mismatch must reseed safely.
- Malformed JSON in LocalStorage must recover to a usable seed rather than leave the skeleton stuck. Only inject this into the isolated QA context.
- Adding a traveler must update actual traveler counts consistently in booking detail, booking list and departures; the accepted monetary snapshot remains frozen.
- Verify valid blank/new quotations cannot be sent/accepted without priced lines, missing records show a usable not-found state, and filtered empty states render sensibly.
- Review numeric input clearing, negative costs/discounts, extreme values, date ordering and service deadlines. Watch for uncaught event-handler errors as well as render crashes.
- Verify no mutation shows a misleading success state when saving fails.

## Visual, print and runtime QA

- Primary viewport **1440×900**; tablet **1024×768**. Phone is outside the product target, but note severe accidental page overflow if observed.
- Reference concept: `design/dashboard-concept.png`. Compare layout hierarchy, navy/teal/cool-gray palette, type sizes, monetary alignment, outline icons, border/radius consistency and density. Live data and brief-required labels intentionally differ from generated concept copy.
- Ensure the quotation preview remains usable while editing, dialogs/drawers can be closed, long tables/pipeline columns scroll within their containers, and navigation/search do not overlap content.
- Inspect every route for meaningful content, loading/empty states, clipping, broken controls, keyboard focus and console errors/hydration warnings.
- Check A4 print/PDF output visually, not just DOM visibility. Confirm page count and no blank pages, cut-off totals or staff information.
- Capture screenshots and relevant console/network evidence. Keep temporary browser artifacts outside tracked source; include their paths in the report.
- Do not claim accessibility certification based on a visual check. Report specific keyboard/label/contrast issues you can demonstrate.

## What the report must contain

Write `QA_REPORT.md` with:

1. **Verdict:** Ready for demo / Ready with minor issues / Not ready, with a brief reason.
2. **Environment:** reviewed commit, date/timezone, Node/npm versions, browser/version, app URL and viewport sizes.
3. **Command results:** each command, actual exit/result, test counts; clearly label anything not run or blocked.
4. **Acceptance matrix:** all six journeys, observed numbers, pass/fail and evidence.
5. **Findings**, highest severity first. Each finding must include:
   - Short title and severity (P0 blocker, P1 major, P2 moderate, P3 minor).
   - Exact reproduction steps from reset, expected versus actual behavior.
   - Affected file/line when established and screenshot/log/test evidence.
   - Presenter impact and a suggested smallest fix; distinguish proven defect from hypothesis.
6. **Visual and print results:** both required viewports, quote/statement page counts and any console issues.
7. **Coverage gaps and limitations:** untested cases, environmental blockers, accepted design decisions and current dependency-audit results if checked.
8. **Top three rehearsal risks** for the presenter.

Do not produce a generic approval, invent results, or silently treat intentional demo limitations as defects. If no material defects are found, say so and name the concrete checks supporting that conclusion.
