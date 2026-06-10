# Roadmap

Where the project stands and what to pick up next. The app was paused mid-build:
the core flows exist end to end, but with wiring bugs and unfinished edges.

## What works (happy path)

- Register / login / JWT auth, logout, token persistence in `localStorage`
- Friend requests: search by email, send, accept/reject, list friends
- Group creation (friends-only members), membership add/remove
- Expense CRUD with `equal` / `percentage` / `exact` splits and split validation
- Balance calculation (`/expenses/balances`) and a balances page
- Soft delete for users and expenses
- Full set of pages: landing, dashboard, expenses (+new/+detail), groups
  (+new/+detail), friends, balances, profile

## Phase 0 — make it runnable & honest (do first)

These unblock everyone. All detailed in `KNOWN_ISSUES.md`.

1. **Fix DB config** (§1) — read connection from env, one consistent var set,
   update `README.md`.
2. **Register global `ValidationPipe`** (§2) — make DTO validation real.
3. **Strip secret-leaking logs** (§3).
4. **Fix `/auth/profile`** to return the full user (§4) — `user.name` after refresh.
5. **Fix dashboard wiring** (§6 pagination field, §7 groups-by-user-id).
6. Add `.env.example` files, gitignore `.env*`, rotate committed secrets (§15).

## Phase 1 — correctness & consistency

- Reconcile `src/contracts/` with actual backend responses (the
  `GroupMember.role` mismatch from §8 is resolved: the field was dropped
  from the contract since the backend has no per-group role concept).
- Standardize the paginated-list response shape; remove dead `getUserExpenses`
  or route it (§6).
- Resolve React 18 vs 19 (§10); stop hiding build errors in `next.config.mjs` (§11).
- Harden `GroupsService` (§13): typed update body, consistent validation in
  `addMember`, decide hard vs soft delete for groups.
- Lock down CORS for non-local environments (§14).

## Phase 2 — tests & tooling

- Add a frontend test setup (Vitest or Jest + RTL) and a `test` script (§12).
- Backend unit tests for balance calculation, splitting math, auth, friends flow.
- CI to run both builds + `tsc --noEmit` + tests.

## Phase 3 — product features (not yet built)

Candidates implied by the domain but absent today:

- **Settle-up / payments** — recording that a debt was paid; balances are computed
  but there's no way to mark them settled.
- **Debt simplification** — minimize the number of transactions across a group
  (current `simplifyBalances` only nets pairwise from one user's view).
- **Expense detail richness** — categories, receipts/attachments, notes, currency.
- **Activity feed / notifications** — friend requests and new expenses are silent.
- **Email** — verification, password reset, friend-request notifications. There is
  a TODO in `users.controller.ts` for a 2FA password-update endpoint.
- **Group invitations** — currently you can only add existing friends to a group.
- **Dashboard real numbers** — totals are placeholders / miscounted (see §6).
- **Profile/avatar upload** — `avatar` column exists but nothing populates it.

## Notes for whoever picks this up

- Update `docs/API.md` and `docs/DATA_MODEL.md` whenever routes or entities change.
- Remove `KNOWN_ISSUES.md` entries as they're fixed.
- The two `AGENTS.md` files predate this doc set and are higher-level; the
  `CLAUDE.md` files are the maintained source of truth.
