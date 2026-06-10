# Known Issues & Discrepancies

State of the codebase as of the pause point (initial analysis: 2026-05-13). These
are the things that make the project "half-baked" — read before debugging, and
remove an entry when you fix it.

Severity: 🔴 blocker · 🟠 bug · 🟡 cleanup / risk

---

## 1. 🔴 Database config is hardcoded and inconsistent

`soft-split-api/src/config/database.config.ts` (runtime) and
`soft-split-api/typeorm.config.ts` (migration CLI) both **hardcode** the Postgres
connection and ignore `.env`:

- `database.config.ts`: `username: softsplit`, `password: softsplit123`, `database: expense_sharing`
- `typeorm.config.ts`: same hardcoded values
- `.env`: `DB_USERNAME=soft`, `DB_PASSWORD=Welcome@123`, `DB_DATABASE=expense_sharing`
- `README.md`: tells you to set `DATABASE_URL` — **nothing reads `DATABASE_URL`**

So `.env` is misleading and the API will only connect if your local Postgres
happens to match the hardcoded creds. **Recommended fix:** make both configs read
from `ConfigService` / `process.env`, pick one consistent set of variable names,
and update `README.md`. Do this before anything else.

## 2. 🟠 No global `ValidationPipe`

`main.ts` never registers `app.useGlobalPipes(new ValidationPipe())`. Every DTO's
`class-validator` decorators (`@IsEmail`, `@MinLength`, etc.) are therefore
**not enforced** — invalid bodies reach services. The frontend even has 422
handling that can never trigger. Fix: register the pipe globally (consider
`whitelist: true`, `transform: true`).

## 3. 🟡 Debug logging leaks secrets

`auth/jwt.strategy.ts` logs the JWT secret; `auth/auth.service.ts` logs payloads
and generated tokens; `auth/jwt-auth.guard.ts`, `users.controller.ts`,
`groups.service.ts`, `friends.service.ts` and `filters/http-exception.filter.ts`
all `console.log` freely (the filter logs full request headers). Strip the
secret-leaking logs first; replace the rest with the Nest `Logger` or remove.

## 4. 🟠 `GET /auth/profile` returns no `name`

`JwtStrategy.validate()` returns only `{ id, email, isAdmin }`, and the profile
endpoint just returns `req.user`. `auth-context.tsx` sets `user` from this
response on page load, so after a refresh `user.name` is `undefined` until the
user logs in again (login itself returns the full user). Fix: have the strategy
or the profile endpoint load and return the full user record.

## 5. 🟡 API base URL fallback is wrong

`soft-split-frontend/lib/api.ts` falls back to `http://localhost:7000/api`, but
the backend has **no `/api` prefix**. `.env.local` correctly sets
`http://localhost:7000`, so it works in practice — but the fallback bites if
`.env.local` is missing. Either fix the fallback or add `app.setGlobalPrefix('api')`
in `main.ts` and update `.env.local`.

## 6. 🟠 Dashboard reads the wrong pagination field

`app/dashboard/page.tsx` reads `expensesResponse.data?.items`, but
`GET /expenses/user` (`expensesService.findByUserPaginated`) returns
`{ data, total, page, limit }` — there is no `items`. So "recent expenses" on the
dashboard is always empty / count 0. (Separately, `expensesService.getUserExpenses`
*does* return `{ items, meta }` but is **dead code** — no controller route calls
it.) Pick one response shape and use it consistently.

## 7. 🟠 Dashboard fetches groups with a user id as a group id

`app/dashboard/page.tsx` calls `api.get(\`/groups/${user.id}\`)` for non-admins.
`GET /groups/:id` expects a **group** id, validates UUID, then `findOne` — passing
a user id returns nothing useful. Should call `GET /groups` or `GET /groups/user`.

## 9. 🟡 "SWR" was never actually added

Commit `fde5302 feat: optimize expense table and implement SWR` does not add SWR —
there is no `swr` dependency and no `useSWR` usage anywhere. Data fetching is
manual `useEffect` + `useState`. Either add SWR for real or correct the assumption.

## 10. 🟡 React 18 runtime vs React 19 types

`soft-split-frontend/package.json` pins `react`/`react-dom` to `^18.2.0` but
`@types/react`/`@types/react-dom` to `^19`. Next.js 15 expects React 19. This can
surface as type errors (`ReactNode`, refs). Fix: move React to 19, or types to 18.

## 11. 🟡 Frontend build hides errors

`next.config.mjs` sets `eslint.ignoreDuringBuilds` and
`typescript.ignoreBuildErrors` to `true`. A passing `npm run build` does **not**
mean the code type-checks. Run `npx tsc --noEmit` separately. Also imports a
non-existent `./v0-user-next.config` (caught and ignored) — v0.dev scaffold cruft.

## 12. 🟡 Minimal / missing tests

Frontend has **no** test script and no test framework. Backend has only
`app.controller.spec.ts` and `expenses/expenses.service.spec.ts`. Balance
calculation, splitting logic, and auth are all untested.

## 13. 🟡 Groups service inconsistencies

`GroupsService.update()` types its param as `Group` but the controller passes
`any` (`@Body() groupData: any`). `addMember()` skips the friendship/active-user
validation that `create()` enforces. `remove()` is a hard delete while users and
expenses are soft-deleted.

## 14. 🟡 CORS fully open

`main.ts` calls `app.enableCors()` with no config — any origin. Lock down before
any non-local deployment.

## 15. 🟡 Secrets committed to the repo

`soft-split-api/.env` (JWT secret, admin secret, DB password) and
`soft-split-frontend/.env.local` are committed. Rotate before deployment, add to
`.gitignore`, provide `.env.example` files instead.

## 16. 🟡 Leftover scaffold identifiers

`soft-split-frontend/package.json` is still named `my-v0-project`; `app/layout.tsx`
metadata has `generator: 'v0.dev'`; a stray `frontend_output.log` is committed.
