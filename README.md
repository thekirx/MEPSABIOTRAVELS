# Optrizo TravelOS

A presentation-ready, browser-only travel agency operations demo built by Optrizo Information Technology Solutions. Default agency: **Horizon Travel & Tours**. All people, supplier names, prices and transactions are synthetic or illustrative.

## Run

Requires Node.js 22.12 or later and npm.

```sh
npm install
npm run dev
```

Open http://localhost:3000/dashboard. The app has no server endpoints, database, credentials or external integrations. LocalStorage is the only persistence layer. An internet connection is needed for the initial install and Google Geist font download during build; the exported app includes the font.

## Check and build

```sh
npm run lint
npm run typecheck
npm test
npm run build
npx playwright install chromium
npm run e2e
```

`npm run build` produces `out/`. The Playwright command serves that exact static export on port 4173. Stop any stale server on that port before testing a different checkout. Unit tests cover quote math, deterministic seed integrity, cumulative payment statuses, acceptance snapshots, payment guards and service references. Browser tests cover the six presentation workflows and resilience checks.

## Deploy

Upload the contents of `out/` to any static host. On Vercel, import this repository, select Next.js, use `npm run build`, and set output directory to `out` if it is not detected. There are no environment variables. Detail URLs use `/quotations/view?id=q1` and `/bookings/view?id=b8` so newly created records work with static hosting. Each browser has its own data; sharing a URL does not share records.

## Reset and personalize

In **Settings**, change the agency name and logo text, then Save identity. Use **Reset demo data → Reset demo** to restore the deterministic seed, including branding. The hidden shortcut **Shift+R** opens the same confirmation outside input fields. Reset generates dates relative to the current browser date. For a clean presentation, reset shortly before starting.

The versioned storage key is `travelos-demo-v1`. Schema mismatches reseed. Refresh preserves current records. Clearing browser storage also starts a fresh seed.

## Presentation

Follow [DEMO_SCRIPT.md](DEMO_SCRIPT.md) for the seven-minute story. [DECISIONS.md](DECISIONS.md) records shortcuts, design comparisons and production requirements. [PROGRESS.md](PROGRESS.md) records phase gates and verification.

Quotation fields save locally as they change; Save provides explicit confirmation. Accepted quotations are read-only. Print / Save as PDF uses the browser's print dialog and hides supplier costs, margins, sidebar and controls. Use A4, default scale and disable browser headers/footers for the cleanest output. Statements are labeled as not being official receipts/invoices.
