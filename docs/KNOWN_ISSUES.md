# Known Issues & Discrepancies

State of the codebase as of the pause point (initial analysis: 2026-05-13). These
are the things that make the project "half-baked" — read before debugging, and
remove an entry when you fix it.

Severity: 🔴 blocker · 🟠 bug · 🟡 cleanup / risk

---

## 5. 🟡 API base URL fallback is wrong

`soft-split-frontend/lib/api.ts` falls back to `http://localhost:7000/api`, but
the backend has **no `/api` prefix**. `.env.local` correctly sets
`http://localhost:7000`, so it works in practice — but the fallback bites if
`.env.local` is missing. Either fix the fallback or add `app.setGlobalPrefix('api')`
in `main.ts` and update `.env.local`.

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

## 16. 🟡 Leftover scaffold identifiers

`soft-split-frontend/package.json` is still named `my-v0-project`; `app/layout.tsx`
metadata has `generator: 'v0.dev'`; a stray `frontend_output.log` is committed.
