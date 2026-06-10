# CLAUDE.md — soft-split-frontend

Next.js 15 (App Router) UI for Soft Split. Read the root `../CLAUDE.md` first, and
`../docs/KNOWN_ISSUES.md` for active bugs (several wiring bugs live in this package).

## Stack

- **Next.js 15.1** App Router, **React 19** (runtime + types aligned)
- **TypeScript**
- **Tailwind CSS 3** + **Radix UI** primitives — shadcn-style components in
  `components/ui/` (generated, mostly untouched). Use the `cn()` helper from
  `lib/utils.ts` for conditional classes; no raw CSS.
- **Axios** for HTTP (`lib/api.ts`)
- **react-hook-form** + **zod** for forms
- **lucide-react** icons, **next-themes** for dark mode, **sonner** + a toast system

The package was scaffolded with v0.dev — `package.json` is still named
`my-v0-project` and `app/layout.tsx` metadata still has `generator: 'v0.dev'`
(see KNOWN_ISSUES §16). The `next.config.mjs` cruft (a no-op import of
`./v0-user-next.config`) has been removed.

## Layout

```
app/                  App Router pages — ALL are client components ("use client")
  layout.tsx          Root layout: ThemeProvider > AuthProvider > nav + <main>
  page.tsx            Landing page
  login/  register/   Auth pages
  dashboard/          Post-login home
  expenses/           list, expenses/new, expenses/[id]
  groups/             list, groups/new, groups/[id]
  friends/            friends + friend requests
  balances/           who-owes-whom view
  profile/            user profile
contexts/auth-context.tsx   Auth state (user/token), login/register/logout, localStorage
lib/api.ts            Shared Axios instance: baseURL, Bearer-token + error interceptors
lib/utils.ts          cn() class-merge helper
src/contracts/        Hand-maintained TS interfaces for API request/response shapes
components/           App components (expense-card, group-card, balance-summary, nav)
components/ui/         Radix/shadcn primitives — avoid editing unless necessary
hooks/                use-mobile, use-toast
```

## How data flows

- `lib/api.ts` exports a configured Axios `api` instance. A **request interceptor**
  attaches the `localStorage` token; a **response interceptor** handles 401
  (clears token, redirects to `/login`), 403/422, and network errors with toasts.
- `contexts/auth-context.tsx` (`useAuth()`) owns `user` / `token`. On mount it
  reads the token and calls `GET /auth/profile`, which returns the full user
  (`id, name, email, avatar, isAdmin`), so `user` survives a page refresh.
- Pages fetch with `useEffect` + `useState` + `api.get(...)`. Note: the commit
  "implement SWR" did **not** add SWR — there is no SWR dependency or usage
  (KNOWN_ISSUES §9). Don't assume a cache layer exists.
- `src/contracts/` defines the shapes pages rely on. They already drift from the
  backend (e.g. `GroupMember.role` does not exist server-side). When you change a
  backend shape, fix the contract here too.

## Environment

`.env.local` sets `NEXT_PUBLIC_API_URL=http://localhost:7000` (correct — backend
has no `/api` prefix). The fallback in `lib/api.ts` is `.../api` which is **wrong**;
it only bites if `.env.local` is missing (KNOWN_ISSUES §5).

## Commands

```bash
npm run dev      # dev server, http://localhost:3000
npm run build    # production build (TS + ESLint errors now fail the build)
npm run start    # serve the production build
npm run lint     # next lint
# there is NO test script — no test framework is set up (KNOWN_ISSUES §12)
```

`npm run build` no longer hides type or lint errors, so a green build also
implies a clean type-check. `npx tsc --noEmit` is still useful for tighter
loops while editing types.

## Conventions

- New pages: App Router `page.tsx`; add `"use client"` if hooks/state are used
  (the whole app currently is client-side).
- Build UI from `components/ui/` primitives + Tailwind; reuse `expense-card`,
  `group-card`, `balance-summary` rather than re-rolling them.
- Forms: `react-hook-form` + a `zod` schema for validation.
- All API calls go through the `api` instance from `lib/api.ts` — never a bare
  `axios` or `fetch`, or you lose auth + error handling.
- Keep request/response types in `src/contracts/` and import from there.
