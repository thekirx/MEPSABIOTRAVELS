# Decisions and production follow-up

## Scope and assumptions

- Followed the supplied eight-phase implementation plan without approval pauses. The empty workspace was initialized as a Git repository. This file and PROGRESS.md carry decisions/planning; no additional design/spec documents were added.
- Kept **Horizon Travel & Tours** as the fictional agency per the brief. The supplied [Facebook page](https://www.facebook.com/mepsabiotravel/) is a client reference in Settings. Facebook returned a temporary-block page during inspection, so no business details, logo, services, real staff, customer information or prices were inferred from it. Agency identity is editable in Settings.
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

## Visual and browser verification

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

Production dependency audit reports zero advisories. Remaining development-tool advisories are in globbing dependencies used by ESLint/shadcn; npm proposes incompatible downgrades rather than a compatible fix, so these were not forced. Vitest was updated to remove its available critical advisory fixes.

Final verification: lint/typecheck/build pass; 8 unit tests and 10 Chromium end-to-end tests pass. Every app route visited with zero console errors/warnings. Both default quote and statement printed as one A4 page. The final native 1440×900 screenshot was compared against the saved concept after tightening dashboard density; remaining copy/data/density differences are intentional and described above. No unresolved material visual or interaction defects were observed in the tested desktop/tablet surfaces.
