# Codebase Report and Issues

After an initial scan of the codebase setup in the `soft-split-api` and `soft-split-frontend` directories, the following issues and discrepancies have been identified:

## 1. Next.js 15 & React Version Mismatch in Frontend
The frontend project (`soft-split-frontend`) relies on `Next.js 15.1.0`. By default, Next.js 15 requires React 19 RC or stable versions.
However, in `soft-split-frontend/package.json`:
- `"react"` and `"react-dom"` dependencies are pinned to `^18.2.0`.
- `"@types/react"` and `"@types/react-dom"` devDependencies are pinned to `^19`.

**Impact:**
Having React 18 at runtime but React 19 types will cause compilation and linting errors related to React types (`ReactNode`, `Ref`, etc.). Next.js may also issue warnings or fail during certain build steps since it expects React 19 semantics.

**Recommendation:**
Upgrade `"react"` and `"react-dom"` to the `19.x` matching the types, or downgrade Next.js to `14.x` and the `@types/react` to `^18`. Since this is Next.js App router, updating to React 19 RC is the suggested approach for Next 15.

## 2. Missing Frontend Test Scripts
The `soft-split-frontend` does not have any `test` scripts defined in `package.json`, and running `npm test` fails immediately.

**Impact:**
Agents or developers trying to verify frontend changes using standard test commands will encounter an error.

**Recommendation:**
Integrate a testing framework (e.g. Jest, Vitest, React Testing Library) into the frontend and provide a `test` script in `package.json`.

## 3. General Package.json Deprecations
The backend dependencies have a few warnings during `npm install` for deprecated packages like `glob@7.2.3`, `inflight@1.0.6`, `eslint@8.57.1`, etc. While not show-stoppers, they indicate technical debt.

**Recommendation:**
Audit dependencies and consider updating `@nestjs/cli`, `eslint` and other dev tools to avoid issues in the long run.