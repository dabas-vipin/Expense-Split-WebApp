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

## Phase 0 — make it runnable & honest (done)

These unblocked everyone — all addressed: env-driven DB config, global
`ValidationPipe`, secret-leaking logs stripped, `/auth/profile` returns the full
user, dashboard wiring fixed, and `.env.example` templates + `.gitignore` for
`.env*`. One residual security note remains and is **operational, not a code
change**: secrets previously committed still live in git history and must be
rotated (and optionally scrubbed) before any real deployment (§15).

## Phase 1 — correctness & consistency (done)

All addressed:

- `GroupMember.role` dropped from the frontend contract — the backend has
  no per-group role concept (§8, merged separately).
- Dead `getUserExpenses` (and the unused `getExpenseWithParticipants`)
  removed from `ExpensesService`; the live `GET /expenses/user` returns
  `{ data, total, page, limit }` (§6).
- React + ReactDOM upgraded to `^19.0.0` to match the `@types/react: ^19`
  pins and what Next.js 15 expects; `tsc --noEmit` is clean (§10).
- `next.config.mjs` no longer hides ESLint or TypeScript errors, and the
  `./v0-user-next.config` scaffold cruft is gone; `npm run build` is the
  real check again (§11).
- `GroupsService` hardened (§13): `update()` takes a typed `UpdateGroupDto`,
  `addMember()` and `update()` both run the same friendship/active-user
  validation as `create()` via a shared helper, and `remove()` is now a
  soft delete (via `@DeleteDateColumn` + migration
  `1781308800000-AddGroupSoftDelete.ts`).
- CORS reads allowed origins from `CORS_ORIGINS` (comma-separated env),
  defaulting to `http://localhost:3000` for dev (§14). Production
  deployments must set it explicitly.

## Phase 2 — tests & tooling (done)

- Vitest + React Testing Library set up on the frontend (§12); two
  example tests prove the wiring (`lib/utils.test.ts` + a
  `BalanceSummary` component test).
- Backend Jest suites added for `GroupsService`, `AuthService`,
  `FriendsService`, and (in Phase 3) `SettlementsService` — 33 tests
  across 6 spec files.
- GitHub Actions workflow runs `npm run build` + `npm test` on the
  API and `npm ci --legacy-peer-deps` → `tsc --noEmit` → `next build`
  → `vitest run` on the frontend, on push to `main` and every PR.

## Phase 3 — product features

### Done

- **Settle-up** — `Settlement` entity + migration; `POST /settlements`
  and `GET /settlements` accept partial amounts and validate that the
  payee exists and is active. `ExpensesService.getBalances` subtracts
  net settlements on the cross-group view (per-group balances stay
  expense-only since settlements aren't group-scoped). Frontend
  `SettleUpModal` on the balances page, defaulting the amount to the
  outstanding debt; only shown for "you owe" entries on the All-groups
  view.
- **Activity feed** — `ActivityEvent` entity logged on every settlement
  (extensible `type` + `jsonb` payload so future event types like
  friend-accept or expense-created can hang off the same plumbing).
  `GET /activity?page=N&limit=M`. Dashboard renders a paginated
  `ActivityFeed` component scoped to the current user.
- **Equal-split balance fix** — landed alongside settle-up because it
  blocked end-to-end validation: `getBalances` was filtering joined
  participants down to just the current user, so `amount / N` divided
  by 1. Now fetches expense IDs first then loads each expense with all
  participants.

- **Debt simplification** — `GET /expenses/balances/simplified?groupId=X`
  runs greedy min-cash-flow against the group's expense graph and
  returns the minimum set of payer → payee transactions that settles
  every member. The `A → B → C` chain collapses to a single `A → C`.
  Surfaced as a "Simplified payments" card at the top of the per-group
  view of `/balances`.
- **Group invitations** — `GroupInvitation` entity + migration with a
  partial unique index on pending rows. Any group member can invite a
  Soft Split user by email (no friendship required, unlike addMember).
  Invitee accepts/declines from a "Group invitations" card on
  `/friends`. Accepting calls `addMemberFromInvitation` which skips the
  friends-only gate, because the invitation itself is the consent.
- **Dashboard real numbers** — the "My Expenses" / "My Groups" cards
  now show the real totals (from the paginated `total` field, not the
  capped recent slice). Zero state renders "0" instead of an empty
  card.

### Not yet built

- **Expense detail richness** — categories, receipts/attachments, notes, currency.
- **Richer activity events** — only `settlement` is emitted today. Add
  friend-accept, expense-created, group-mutation, group-invitation, etc.
- **Email** — verification, password reset, friend-request notifications. There is
  a TODO in `users.controller.ts` for a 2FA password-update endpoint.
- **Group invitations** — currently you can only add existing friends to a group.
- **Profile/avatar upload** — `avatar` column exists but nothing populates it.

## Notes for whoever picks this up

- Update `docs/API.md` and `docs/DATA_MODEL.md` whenever routes or entities change.
- Remove `KNOWN_ISSUES.md` entries as they're fixed.
- The two `AGENTS.md` files predate this doc set and are higher-level; the
  `CLAUDE.md` files are the maintained source of truth.
