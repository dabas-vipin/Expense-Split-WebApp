# CLAUDE.md — soft-split-api

NestJS 10 REST API for Soft Split. Read the root `../CLAUDE.md` first for repo-wide
context, and `../docs/KNOWN_ISSUES.md` for active bugs (several live in this package).

## Stack

- **NestJS 10**, TypeScript, Express platform
- **TypeORM 0.3** over **PostgreSQL** (`pg` driver)
- **Auth:** `@nestjs/jwt` + `passport-jwt`, `bcrypt` for hashing
- **Validation:** `class-validator` / `class-transformer` decorators on DTOs
  — but note there is **no global `ValidationPipe` registered** (KNOWN_ISSUES §2),
  so those decorators currently do nothing at runtime.

## Layout

```
src/
  main.ts                 Bootstrap: CORS open, global HttpExceptionFilter, port 7000
  app.module.ts           Root module; loads ConfigModule + TypeOrmModule + feature modules
  app.controller.ts       GET /  -> "Hello" health-ish endpoint
  config/database.config.ts   TypeORM connection options — HARDCODED, ignores .env (see §1)
  auth/                   login, register, JWT strategy + guard, profile
  users/                  user CRUD (soft-delete) + friends.service (friend requests)
  groups/                 group CRUD + membership
  expenses/               expense CRUD, pagination, balance calculation
  filters/                HttpExceptionFilter (logs full request + stack)
  migrations/             TypeORM migrations — the source of truth for schema
typeorm.config.ts         DataSource used by the migration CLI scripts (also hardcoded)
```

Every feature module follows the standard Nest shape: `*.module.ts`,
`*.controller.ts`, `*.service.ts`, `dto/`, `entities/`.

## Domain model

Four entities (`src/**/entities/*.entity.ts`) — full detail in `../docs/DATA_MODEL.md`:

- **User** — uuid PK, bcrypt `password`, `isActive` + `deleted_at` soft-delete,
  partial-unique index on `email` where not deleted, `isAdmin` flag, self-referencing
  `friends` many-to-many, `sentFriendRequests` / `receivedFriendRequests`.
- **Group** — name/description, `members` many-to-many with User, `expenses` one-to-many.
- **Expense** — `description`, `amount` (`decimal(10,2)` — comes back as a **string**),
  `date`, `paidBy` (User), `participants` (many-to-many User), optional `group`,
  `splitType` (`equal` | `percentage` | `exact`), `splitDetails` (JSON `userId -> number`),
  `deleted_at` soft-delete.
- **FriendRequest** — `sender`, `receiver`, `status`
  (`pending` | `accepted` | `rejected` | `archived`).

## Routes

No global prefix is set, so paths are bare (`/auth/login`, not `/api/auth/login`).
Full table in `../docs/API.md`. Almost everything is behind `JwtAuthGuard`.

## Database & migrations

- `synchronize: false` — schema is **only** changed through migrations.
- `npm run migration:generate` diffs entities against the DB and writes a migration
  to `src/migrations/MigrationXXXX.ts`.
- `npm run migration:run` / `npm run migration:revert` apply / roll back.
- ⚠️ **Connection config is hardcoded** in `src/config/database.config.ts` (runtime)
  and `typeorm.config.ts` (CLI), and the two disagree with each other *and* with
  `.env`. See `../docs/KNOWN_ISSUES.md` §1 — fixing this to read from `ConfigService`
  is the recommended first task.

## Commands

```bash
npm run start:dev      # watch-mode dev server (port 7000, or $PORT)
npm run build          # nest build -> dist/
npm run start:prod     # node dist/main
npm test               # Jest unit tests (*.spec.ts)
npm run test:e2e       # e2e tests (test/)
npm run lint           # eslint --fix
npm run format         # prettier
```

Test coverage is thin: only `app.controller.spec.ts` and
`expenses/expenses.service.spec.ts` exist. Adding tests alongside changes is encouraged.

## Conventions

- One domain per module; keep business logic in services, not controllers.
- Controllers do auth/authorization checks (`req.user.isAdmin`, ownership) before
  delegating — follow that pattern.
- Use `dataSource.transaction(...)` for multi-step writes (see `expenses.service.create`
  and `users.service.softDelete` for the established pattern).
- New DTOs go in `dto/` with `class-validator` decorators — and if you want them
  enforced, register the global `ValidationPipe` (KNOWN_ISSUES §2).
- Throw Nest HTTP exceptions (`BadRequestException`, `ForbiddenException`, …);
  `HttpExceptionFilter` shapes the JSON response.
