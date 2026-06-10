# CLAUDE.md

Guidance for Claude Code (and other AI agents) working in this repository.

## What this project is

**Soft Split** — an expense-sharing web app. Users add friends, form groups, log
shared expenses, choose how each expense is split (equal / percentage / exact),
and the app computes who owes whom. It is a **work-in-progress that was paused
mid-build**: the core happy paths exist end to end, but there are unfinished
features, wiring bugs, and setup friction. See `docs/KNOWN_ISSUES.md` before
assuming anything "should just work", and `docs/ROADMAP.md` for what to build next.

## Repository layout

This is a two-package monorepo with **no workspace tooling** (no pnpm/yarn/Lerna
workspaces — each package is installed and run independently).

```
soft-split-api/        NestJS 10 + TypeORM 0.3 + PostgreSQL  — REST API, port 7000
soft-split-frontend/   Next.js 15 (App Router) + React 18    — UI, port 3000
docs/                  KNOWN_ISSUES.md, ROADMAP.md, API.md, DATA_MODEL.md
```

Each package has its own `CLAUDE.md` with package-specific detail. Read those
when working inside a package. The older `AGENTS.md` files are kept for
non-Claude tools and say roughly the same thing at a higher level.

## Architecture at a glance

- The **frontend** is fully client-rendered for app pages (`"use client"`
  everywhere) and talks to the API over HTTP via a shared Axios instance
  (`soft-split-frontend/lib/api.ts`).
- **Auth** is JWT (Passport `passport-jwt`, bcrypt hashing, 1-day expiry). The
  token lives in `localStorage` and is attached as `Authorization: Bearer ...`
  by an Axios request interceptor. `contexts/auth-context.tsx` holds the
  client-side auth state.
- The **backend** is a standard NestJS module-per-domain layout:
  `auth`, `users` (includes friends), `groups`, `expenses`. Persistence is
  TypeORM against PostgreSQL; schema changes go through migrations in
  `soft-split-api/src/migrations/`.
- TypeScript request/response shapes the frontend expects live in
  `soft-split-frontend/src/contracts/`. **These are hand-maintained and already
  drift from the backend in places** — treat them as intent, not truth.

For the full route list see `docs/API.md`; for entities and relations see
`docs/DATA_MODEL.md`.

## Running it locally

The API reads its Postgres connection from environment variables. Copy
`soft-split-api/.env.example` to `soft-split-api/.env` and fill in real values
before running migrations or the dev server.

```bash
# Backend
cd soft-split-api
npm install
npm run migration:run      # needs a reachable Postgres
npm run start:dev          # http://localhost:7000

# Frontend (separate terminal)
cd soft-split-frontend
npm install                # package-lock.json is committed; npm is the expected PM
npm run dev                # http://localhost:3000
```

## Working agreements for agents

1. **Stay in your package.** Never import frontend code into the backend or vice
   versa. `cd` into the correct directory before running any npm command — the
   shell working directory resets between tool calls.
2. **Check `docs/KNOWN_ISSUES.md` before debugging.** Several "bugs" you might
   hit are already documented and some are intentional-for-now. Don't re-discover
   them; if you fix one, remove it from that file in the same change.
3. **Schema changes = migrations.** Editing a TypeORM entity is not enough.
   `synchronize` is `false` everywhere. Generate and commit a migration
   (`npm run migration:generate`, then `migration:run`).
4. **Keep `src/contracts/` honest.** If you change a backend response shape,
   update the matching contract in the frontend in the same change.
5. **Don't add new `console.log` debugging.** The codebase is already noisy with
   debug logging (some of it leaks secrets — see KNOWN_ISSUES). If you touch a
   file that has gratuitous logging, removing it is welcome.
6. **Verify before claiming done.** Backend: `npm run build` and `npm test`.
   Frontend: `npm run build` (which now fails on TS or lint errors); use
   `npx tsc --noEmit` for tighter loops while editing types.
7. **Match the surrounding style.** NestJS conventions in the API; Tailwind +
   Radix UI (shadcn-style components in `components/ui/`) with the `cn()` helper
   in the frontend. No raw CSS.
8. **Secrets:** `.env*` files are gitignored (with `.env.example` tracked as
   templates). Don't add real secrets to anything tracked. Earlier commits
   still contain the original `.env` contents — treat those values as
   compromised (see `KNOWN_ISSUES.md` §15).

## Commit / PR conventions

- Branch off `main`; the existing history uses Conventional-Commit-style
  subjects (`feat:`, etc.) and merges via PR.
- Run builds/tests in any package you touched before concluding.

## Working from high-level commands (autonomous-feature workflow)

The user prefers a "one high-level command, you deliver a PR" loop. When a
prompt like "implement Phase 1 §8" arrives:

1. **Scope check first.** If the task involves product judgement that isn't
   already pinned down (a button vs a flow, partial settlements, etc.), ask
   one focused clarifying question before starting. Otherwise proceed.
2. **Branch, don't touch `main`.** Create a feature branch off `main` with a
   conventional name (`fix/...`, `feat/...`). Never commit or push to `main`.
3. **Plan before non-trivial execution.** For anything beyond a one-file
   change, call the `Plan` subagent to produce a step list and surface
   tradeoffs, then execute against it. Use `Explore` for broad codebase
   research (>3 lookups). Use `isolation: "worktree"` when parallelising
   independent work.
4. **Keep docs honest in the same change.** Update `docs/KNOWN_ISSUES.md`,
   `docs/ROADMAP.md`, `docs/API.md`, `docs/DATA_MODEL.md`, and the per-package
   `CLAUDE.md` files to reflect what changed. Don't ship code + stale docs.
5. **Verification gates before claiming done:**
   - API: `npm run build` + `npm test` green. If you touched migrations,
     `npm run migration:run` against a clean DB.
   - Frontend: `npm run build` green (it now surfaces TS + lint errors);
     `npx tsc --noEmit` for tighter feedback while editing types.
   - End-to-end smoke: `docker build -t softsplit . && docker run --rm -d
     --name softsplit -p 3000:3000 -p 7000:7000 softsplit` and curl both
     ports when the change is user-facing.
6. **Open a PR, don't merge.** Push the branch and open a PR with a Summary
   (1–3 bullets) + Test plan checklist. Return the PR URL.
7. **Run `/security-review` on the branch yourself** if the change touches
   auth, secrets, validation, or external input. It's a skill I can invoke.
8. **`/ultrareview` is user-triggered** — I cannot launch it. After I push
   a branch, prompt the user with `/ultrareview <PR#>` if a multi-agent
   review would help (auth changes, schema changes, large refactors).
9. **Pause for review when work changes shared state.** Force-push, history
   rewrite, dropping tables, modifying CI, or anything visible to others
   stops for explicit confirmation regardless of permission settings.
