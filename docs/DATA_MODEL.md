# Data Model

PostgreSQL via TypeORM. Entities live in `soft-split-api/src/**/entities/`. Schema
is managed by migrations (`soft-split-api/src/migrations/`) — `synchronize` is off.

## Entities

### User (`user`)
| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | PK |
| `name` | varchar | |
| `email` | varchar | Partial-unique index `IDX_USER_EMAIL_ACTIVE` — unique **where `deleted_at IS NULL`**, so a deleted email can be reused |
| `password` | varchar | bcrypt hash (cost 10) |
| `avatar` | varchar | nullable |
| `isActive` | boolean | default `true`; set `false` on soft delete |
| `isAdmin` | boolean | default `false` |
| `deleted_at` | timestamp | `@DeleteDateColumn` — soft delete |
| `createdAt` / `updatedAt` | timestamp | |

Relations:
- `expensesPaid` — one-to-many → Expense (`Expense.paidBy`)
- `expensesInvolved` — many-to-many → Expense (join `user_expenses_involved_expense`) *(declared on User but the Expense side uses its own `participants` join — see note below)*
- `groups` — many-to-many → Group (inverse of `Group.members`)
- `friends` — self-referencing many-to-many (join `user_friends_user`)
- `sentFriendRequests` / `receivedFriendRequests` — one-to-many → FriendRequest

### Group (`group`)
| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | PK |
| `name` | varchar | |
| `description` | varchar | nullable |
| `createdAt` / `updatedAt` | timestamp | |

Relations:
- `members` — many-to-many → User (join `group_members_user`, owning side)
- `expenses` — one-to-many → Expense

### Expense (`expense`)
| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | PK |
| `description` | varchar | |
| `amount` | numeric(10,2) | ⚠️ TypeORM/pg returns this as a **string** — parse it |
| `date` | timestamp | |
| `splitType` | varchar | `equal` \| `percentage` \| `exact`, default `equal` |
| `splitDetails` | json | nullable; `{ userId: number }` — % or exact amount per user |
| `deleted_at` | timestamp | added in migration 1774210604374 — soft delete |
| `createdAt` / `updatedAt` | timestamp | |
| `paidById` | uuid FK → user | indexed `IDX_EXPENSE_PAID_BY` |
| `groupId` | uuid FK → group | nullable, indexed `IDX_EXPENSE_GROUP` |

Relations:
- `paidBy` — many-to-one → User
- `participants` — many-to-many → User (join `expense_participants_user`)
- `group` — many-to-one → Group, nullable

Indexes: `IDX_EXPENSE_DATE`, `IDX_EXPENSE_PAID_BY`, `IDX_EXPENSE_GROUP`.

### FriendRequest (`friend_request`)
| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | PK |
| `status` | varchar | `pending` \| `accepted` \| `rejected` \| `archived`, default `pending` |
| `createdAt` | timestamp | |
| `senderId` | uuid FK → user | |
| `receiverId` | uuid FK → user | |

## Join tables

- `group_members_user` — Group ↔ User membership
- `expense_participants_user` — Expense ↔ User participation
- `user_friends_user` — User ↔ User friendship
- `user_expenses_involved_expense` — from `User.expensesInvolved`; appears unused
  by app logic (services use `expense_participants_user`). Candidate for cleanup.

## Migrations

| File | Purpose |
|------|---------|
| `1709556234566-InitialSchema` | All tables, join tables, FKs, partial-unique email index |
| `1709556234567-AddSoftDelete` | Soft-delete support |
| `1774210604374-ApplyExpenseOptimizations` | `expense.deleted_at` + date/paidBy/group indexes |

## Splitting & balances

`ExpensesService.getBalances()` walks the user's expenses, and per expense splits
the `amount` across `participants` by `splitType`:
- `equal` — `amount / participants.length`
- `percentage` — `splitDetails[participantId] / 100 * amount`
- `exact` — `splitDetails[participantId]`

It builds a pairwise debt map (`updateBalance`) then `simplifyBalances` reduces it
to the current user's net `{ from, to, amount }` entries. There is no
multi-party debt-minimization optimization yet — see `ROADMAP.md`.
