# Optrizo TravelOS — execution plan and progress

Goal: reliable 7-minute Philippine agency demo with one source of truth for money.
Architecture: Next App Router static export, client Zustand persisted state; pure domain math; feature components; shadcn primitives. Native execution in this empty repository.
Spec: user-supplied Optrizo TravelOS brief. No extra planning documents per its deliverables constraint.

## Plan / gates
- Phase 0: scaffold, scripts, shadcn, Vitest, Playwright. Gate lint/typecheck/build PASS, zero errors/warnings. Complete. shadcn primitives installed; concept in design/dashboard-concept.png.
- Phase 1: types, pure money/quote/payment functions; deterministic relative seed; versioned store/actions/selectors. Test exact quote, mixed basis, overdue, conversion, foreign keys. Gate typecheck/test PASS (6 unit tests). Complete.
- Phase 2: seven-item shell, search, hydration skeleton, shared badges/KPIs/deadlines, route stubs. Gate lint/typecheck/build PASS. Complete.
- Phase 3: editable quotation, print document, read-only acceptance snapshot. Gate typecheck/build/test PASS; Chromium markup 10→15→10 verified 220000→230000→220000; print PDF generated. Complete.
- Phase 4: booking services/travelers/installments/payments; validation; ledger and statements. Gate typecheck/build/test PASS; Chromium acceptance + 60000 deposit verified 160000 balance in booking and ledger. Customer drawer assertion follows Phase 5, where the brief schedules that component. Complete.
- Phase 5: inquiry pipeline/customer drawer and derived dashboard. Gate typecheck/build/test PASS (6 unit tests). Complete.
- Phase 6: visa checklist/stages, branding/reset, keyboard reset, responsive polish. Gate lint/typecheck/build/test.
- Phase 7: six end-to-end workflows, documentation, final combined gate, commit.

Review focus: repeat acceptance must not duplicate a booking; overpayment and invalid centavos rejected; accepted quotes immutable; cumulative overdue deadlines correct; storage schema mismatch safely reseeds. Tests will cover these in domain/store and browser suites.
