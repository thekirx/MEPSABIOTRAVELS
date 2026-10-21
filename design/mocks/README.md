# Design mocks — TravelOS for MEP Sabio Travel

These HTML files are the **approved visual and interaction reference** for the redesign. They are not production code. Rebuild them in the real Next.js app as described in `/REDESIGN_HANDOFF.md` and `/REDESIGN_PLAN.md`.

## How to view

From the repository root:

```sh
npx http-server design/mocks -p 4300 -c-1
```

Open http://localhost:4300/index.html. Use Chrome at 1440 px wide. Also check 1024 px. The front screens save clicks in this browser's localStorage under `mep-mock-v1`. The **Reset demo** link in each footer clears it.

## Files

| File | What it is | Becomes in the app |
|---|---|---|
| `index.html` | Gallery of all screens | — |
| `home.html` | **Front.** 3 job blocks + 4 "leaving soon" luggage tags. Working. | `/dashboard` (labelled **Home**) |
| `inquiries.html` | **Front.** 4 stage blocks + people in the chosen stage. Working. | `/inquiries` |
| `quotation.html` | **Front.** Markup picker, big price, customer copy, "Yes, book it". Working. | `/quotations/view?id=…` |
| `booking.html` | **Front.** Trip header, "Do this next", checklist, money. Working. | `/bookings/view?id=…` |
| `trips.html` | **Detail.** All bookings table with filters | `/bookings` |
| `trip-details.html` | **Detail.** Everything about one booking | `/bookings/details?id=…` (new) |
| `quote-details.html` | **Detail.** Full quote editor | `/quotations/edit?id=…` (new) |
| `customer.html` | **Detail.** Customer profile | `/customers/view?id=…` (new) |
| `payments.html` | **Detail.** Receivables + payments received | `/payments` |
| `visas.html` | **Detail.** Visa cases + checklist | `/visas` |
| `overview.html` | Old redirect to `home.html` | — |
| `mock.css` | All tokens and components | `src/app/globals.css` + components |
| `shell.js` | Top bar + footer | `src/components/shell/shell.tsx` |
| `app.js` | Mock-only state, dialog, toast | Use the real store and shadcn dialog/sonner |
| `assets/mep-logo-full.png`, `assets/mep-mark.png` | Client logo crops (from the client's logo file) | `public/brand/` |
| `assets/photo-*.jpg` | MEP's own Korea tour photos (from their posts) | Optional; `public/brand/` |

## Mock-only shortcuts (do not copy)

- Dates are fixed to **Wed 21 Oct 2026**. The app computes dates relative to today.
- Numbers are typed in by hand. The app must derive every number from store records.
- Only Andrea's records are fully linked. Other rows use placeholder links.
- `app.js` keeps its own tiny state and floating-point pesos. The app must use the Zustand store and integer centavos.
- The Visas mock repeats a seed bug: visa countries alternate Japan/South Korea regardless of destination. See handoff "Known data issues".
