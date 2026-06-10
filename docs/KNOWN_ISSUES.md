# Known Issues & Discrepancies

State of the codebase as of the pause point (initial analysis: 2026-05-13). These
are the things that make the project "half-baked" — read before debugging, and
remove an entry when you fix it.

Severity: 🔴 blocker · 🟠 bug · 🟡 cleanup / risk

---

## 9. 🟡 "SWR" was never actually added

Commit `fde5302 feat: optimize expense table and implement SWR` does not add SWR —
there is no `swr` dependency and no `useSWR` usage anywhere. Data fetching is
manual `useEffect` + `useState`. Either add SWR for real or correct the assumption.

## 12. 🟡 Minimal / missing tests

Frontend has **no** test script and no test framework. Backend has only
`app.controller.spec.ts` and `expenses/expenses.service.spec.ts`. Balance
calculation, splitting logic, and auth are all untested.

## 15. 🟡 Previously committed secrets remain in git history

`.env*` files are now gitignored (with `.env.example` kept tracked), the two
real env files are no longer tracked, and `.env.example` templates exist for both
packages. **But** the previously committed `soft-split-api/.env` (JWT secret, admin
secret, DB password) and `soft-split-frontend/.env.local` still live in earlier
commits. Treat those values as compromised: rotate them in any real deployment, and
scrub history (git-filter-repo / BFG + force-push) if the repo is ever made public.

