# Decisions and production follow-up

## Scope and assumptions

- Followed the supplied eight-phase implementation plan without approval pauses. The empty workspace was initialized as a Git repository. This file and PROGRESS.md carry decisions/planning; no additional design/spec documents were added.
- Original build used **Horizon Travel & Tours** as the fictional agency per the brief; the approved redesign supersedes this with **MEP Sabio Travel**. The supplied [Facebook page](https://www.facebook.com/mepsabiotravel/) is a client reference in Settings. Facebook returned a temporary-block page during inspection, so no business details, logo, services, real staff, customer information or prices were inferred from it. Agency identity is editable in Settings.
- A single Zustand store persists only domain records under `travelos-demo-v1`, with schema version 1. Pure selectors compute financials, KPIs, stage counts, charts and attention items. No derived balances are persisted.
- Query detail URLs replace bracket routes: `/quotations/view?id=...` and `/bookings/view?id=...`. This is the fallback explicitly allowed in the brief and supports runtime IDs on a static host.
- Integer centavos everywhere; quote multiplication uses per-traveler or per-group basis, then one final markup rounding. Andrea's net cost is ₱200,000 with 10% markup and no discount, giving exactly ₱220,000.
- Quote fields persist as edited, with Save providing explicit confirmation. Acceptance is idempotent, freezes a snapshot, creates Requested services and default installments, and marks the lead Won. Accepted quotations cannot be repriced.
- Packages prefill a single composite per-traveler line plus their itinerary; staff can split/add category lines. The featured seeded quotation has detailed airfare/hotel/tour/transfer lines. Package catalog editing is intentionally absent.
- Pipeline drag-and-drop is omitted, as permitted. Every card has the required stage dropdown, with a table alternative.
- Travelers start as editable synthetic placeholders. Missing passport data and validity under six months after return generate warnings. Visa cases are created from travelers and do not represent embassy integration.
- A payment can be below the planned deposit. The installment schedule remains unchanged; cumulative paid versus cumulative due determines overdue status. Cancelled bookings are excluded from active receivables and departure lists.
- Issued service status requires a manually recorded simulated reference. Overall booking status remains an explicit staff action; services do not silently change it.
- Browser print handles quotations and statements. No PDF libraries, backend, auth, database, external API calls or mock server were added. Official receipts and invoices are absent.
- Reset also restores agency identity. Seed dates are anchored to the browser's local date at first load/reset; existing persisted dates remain unchanged until reset.
- Only needed shadcn primitives were installed. Base UI, animation styles and standard class utilities are their supporting dependencies; the shadcn generator is development tooling. No dark-mode library is used.

## Original build visual and browser verification (historical, superseded)

Reference: `design/dashboard-concept.png`, generated with the built-in Image Gen tool. Prompt: premium 1440×900 travel operations dashboard, navy #142D4E sidebar, teal #0D9488 actions, cool #F7F9FC background, white fine-border panels, seven-item navigation, five KPIs, attention list, six-month chart and departure table; no photography, gradients or marketing hero.

Browser plugin was not available; regular Playwright Chromium was used. Screenshots were captured outside the repository at `/tmp/travelos-dashboard-final.png`, `/tmp/travelos-tablet-final.png`, `/tmp/travelos-quotation.png`, and `/tmp/travelos-phone.png`. The concept and implementation screenshots were opened with view_image for comparison.

| Comparison        | Render evidence and resolution                                                                                                                                                                                  |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Composition       | Same navy left rail, white search header, five KPI cards, attention/chart pair and departure table. Real record density creates vertical scrolling rather than squeezing all rows into one viewport.            |
| Palette           | Exact requested navy/teal/cool gray tokens; white surfaces with fine borders; semantic amber/red/green badges. No concept gradient was added.                                                                   |
| Typography        | Geist via next/font; explicit control sizes, tabular monetary values, consistent compact labels.                                                                                                                |
| Iconography       | Lucide outline icons with consistent stroke, semantic attention icons and restrained selected states. Compass mark remains code-native.                                                                         |
| Copy and data     | User-required KPI names and records intentionally replace illustrative generated concept labels/numbers. Dates are relative; no invented percentage growth claims. Demo pill is persistent.                     |
| Detail continuity | Quote editor and printable document, service/traveler/payment panels and visa drawer extend the same border/radius/type system.                                                                                 |
| Responsiveness    | 1440×900 desktop and 1024×768 tablet checked; no page-level horizontal overflow. Phone received a basic check but is outside the required product target. Wide pipelines/tables scroll within their containers. |

Above-the-fold copy comparison: intentional deviations are the brief's five required KPI labels, live derived numbers, accurate current date and contextual hints replacing the concept's fabricated growth figures. Unimplemented concept notifications/dropdown menus were omitted to avoid dead controls. The reference is direction for the requested app, not a raster UI shipped as the product.

## Production requires

- Authentication, agency isolation, roles and permission checks. Hiding margin in a customer view is presentation only, not an access-control boundary.
- Secure shared database, server validation, conflict handling, transactional conversion/payment recording, immutable audit logs, backups and schema migrations.
- Philippine Data Privacy Act compliance, data minimization, consent/retention policies, encrypted passport storage and restricted access. Never use this LocalStorage demo for real passport or financial records.
- Actual supplier integrations and inventory availability checks; official issuance workflows; supplier payables, reconciliation, refunds/cancellations and accounting integration.
- Multi-currency rates and explicit rounding/exchange rules. Current monetary records are PHP only; foreign-currency remarks are informational.
- Official invoicing and receipts, applicable tax/compliance workflows, real payment integrations and reconciliation.
- Visa-country-specific requirements, accountable submission histories, document storage and operational deadline rules.
- Shared deployment, error monitoring, browser matrix testing and an accessible keyboard/screen-reader audit before production use.

## Review repairs

Independent review identified required quotation date validation and client-navigation search state. Regression tests reproduced both issues before repair. Required dates now reject empty/invalid calendar dates before persistence, and attention selectors safely ignore legacy invalid dates. Customer drawer selection is derived from the query URL, so selecting another customer on the same route works. Additional tests reproduced and fixed corrupt LocalStorage hydration and traveler-count inconsistency after adding a traveler.

The original-build production dependency audit reported zero advisories. Its remaining development-tool advisories were in globbing dependencies used by ESLint/shadcn; npm proposed incompatible downgrades rather than a compatible fix, so these were not forced. Vitest was updated to remove its available critical advisory fixes.

Original-build verification: lint/typecheck/build passed; 8 unit tests and 10 Chromium end-to-end tests passed. Every app route visited with zero console errors/warnings. Both default quote and statement printed as one A4 page. The final native 1440×900 screenshot was compared against the saved concept after tightening dashboard density; remaining copy/data/density differences are intentional and described above. No unresolved material visual or interaction defects were observed in the tested desktop/tablet surfaces.

## Approved MEP redesign — current decisions

- User-approved mock assets define the MEP identity; the earlier Facebook access failure is unchanged and no additional business facts were inferred. The top bar replaces the sidebar. Fonts are Barlow and Barlow Condensed, with charcoal #292b2f, lime #c8e63c, red #c62828 and cream #f2f1ea. Flat blocks, 18px radii and pill actions follow the supplied HTML mocks. Original navy/teal concept comparisons above are historical.
- Two layers: simple Home / People asking / Quote / Trip fronts; full customer, quote and trip details one click deeper. New query routes: `/customers/view?id=`, `/quotations/edit?id=`, `/bookings/details?id=`. They support runtime IDs in the static export. The temporary component gallery is removed.
- UI label map preserves stored enums: New Inquiry→New, Contacted→Talking, Quoted→Quote sent, Negotiating→Almost booked, Won/Lost→Finished: booked/said no, Pending Confirmation→Waiting on suppliers. HTT reference prefixes are unchanged.
- Financial math remains unchanged. Checklist completion, urgency, payment allocations, counts and totals are selectors. Urgent service deadlines within 72 hours take precedence on Trip as well as Home. Shared date helpers calculate weekday/relative labels.
- Seed visa eligibility is a demo rule: only Japan/South Korea trips b1/b6/b7 require visas. All eight travelers on them are flagged; six unique cases (two per trip) have matching countries and the original 3/1/1/1 stage mix. Existing persisted data is preserved until reset; this is a seed correction rather than a migration.
- Settings accepts a local PNG/JPEG/WebP logo under 500 KB. The data URL is stored with identity, used in the bar/quote/statement, and cleared by reset. No upload service or external storage was added.
- Prettier is the sole new dependency, exact-pinned as explicitly authorized by review fix R1. It uses default formatting. Long generated utility-class strings are the only line-length exceptions. Large detail components are split into sections for maintenance.
- Responsive table columns stay readable by scrolling inside sheets. All three specified widths are supported. Browser plugin absent: isolated Playwright Chromium is used for QA; presenter LocalStorage stays untouched. Print uses browser A4 output with top bar, controls and staff information hidden.
- Current verification results and review disposition are in the latest PROGRESS.md entry. These replace the original-build counts above. No backend, auth, production integration, push or deployment was added.

The independent final review found a short-notice installment-allocation inconsistency and raw history date prefixes. Both were repaired and re-reviewed. All payment surfaces now use one chronological allocation, including deposit completion, while quotation math and cumulative overdue rules remain unchanged. Generated history prefixes are formatted at rendering. Final verification: format/lint/typecheck/build, 21 unit and 20 Chromium browser tests passed; 39 route/viewport checks passed and default quotation/statement each rendered as one A4 page.

## Agency quote flow (client email → flights → mock ticket → approval)

Matches MEP's current process: client emails → quote → find flights (incl. connections) → screenshot flight details → mock ticket with markup → email client for approval. Insurance is included on every trip.

- Markup is a fixed peso amount per traveler (`markupPerPaxCentavos`), not a percentage. Quick picks ₱500/₱1,000/₱1,500/₱2,000 plus any custom amount. New quotes default to ₱1,000 per person.
- Saved data moves to schema version 2 on load. Open quotes switch to the peso amount that gives the same price (to the centavo per person). Accepted quotes and booking snapshots keep their old `markupPct` so locked prices and payment plans never move.
- Travel insurance (default ₱1,500 per person, editable under Services) is on every seeded and new quote and survives package changes. A quote without insurance shows a red "No travel insurance yet" block with a one-click add. Packages list "Travel insurance" as included.
- Each quote has a Flights section: free-text flight details plus up to four screenshots (paste, drop or upload). Screenshots are shrunk to JPEG in the browser and kept in LocalStorage, so no upload service. The customer copy shows them as "Your flights · not yet ticketed" — the mock ticket.
- "Email [client] for approval" opens a pre-filled email (to, subject, message with flights, total, per-person, deposit, validity and insurance). Staff save the quote as PDF and attach it; the app cannot attach files to a mailto email. Opening or copying the email marks the quote Sent. Approval is still recorded with "Yes, book it".
- "Email" is the first inquiry source and the default for new inquiries. Seeded customers now cycle through all six sources.
- Andrea's demo quote keeps its ₱220,000 total: insurance is added and her markup is ₱3,500 per person. Other seeded quote totals change slightly. Demo airline and screenshot are fictional.

## Pitch demo: client approval, staff switcher, Salary tab

Built to tell the 5-minute sales story in the demo. Everything stays browser-only and simulated.

- **Client approval page** `/approve?id=`: a branded page with no staff navigation. It shows flights, inclusions (no repeats), total, deposit, balance date and validity. "Approve & pay" asks the client to choose GCash, Maya, card or bank and to tick an agreement, then calls `approveOnline`. That accepts the quote, records the full 30% deposit, sets `clientApprovedAt`, and puts the airfare **On Hold with a deadline of 5 PM tomorrow**, so Ticketing gets an "Issue ticket" job. All of this is saved as **one write**: LocalStorage writes are paused (`persistGate`) during the steps, and a failure rolls back. Expired or declined quotes and bad links show a clear message. Phones get a fixed bottom bar with the total and an Approve button. "Maya" was added as a payment method.
- **Live updates between tabs:** the shell listens for LocalStorage `storage` events and applies the other tab's state **without saving it back**. Saving it back caused a real bug: the staff tab overwrote the client's deposit.
- The quote page has "Preview client page ↗". The approval email includes the link. The link only works in the same browser, because data is per browser until there is a backend.
- **Staff switcher** (account menu, "Signed in as (demo)"): `currentAgentId` is stored. Home greets that person (morning, afternoon or evening) and shows only their role's jobs: Sales gets quotes and payments, Ticketing gets services, Visa gets visas, the Owner gets everything. Costs and profit are visible to **Sales and the Owner** (Sales sets the price), and hidden from Ticketing and Visa. Only Sales and the Owner can change prices. Only the Owner sees Salary and can approve paydays. This is not real access control.
- **Salary tab** `/salary` (Owner only): semi-monthly paydays (1–15 and 16–end), base pay, commission as a percentage of profit on bookings each person closed in the period (assigned agent and booking date), and a payslip for each person. Deductions use 2025 employee rates: SSS 5% of the monthly salary credit (₱5k–₱35k), PhilHealth 2.5% (₱10k floor, ₱100k cap), Pag-IBIG 2% of up to ₱10k, plus the BIR semi-monthly tax table and cash advances. Approving a payday **freezes the payslips**. Pay settings and cash advances can be edited. The owner is not on payroll. Demo pay: Katrina ₱22k at 5%, Nico ₱20k at 5%, Luis ₱20k, Mara ₱18k. This is an estimate labelled for checking with an accountant.
- Schema version 3. Saved v2 data keeps its records and gains `currentAgentId` (the owner), pay rules, and empty advances and paydays. v1 data goes v1 → v2 → v3.
