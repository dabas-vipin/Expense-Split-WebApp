# API Reference

NestJS backend, base URL `http://localhost:7000` (no global prefix — paths are bare).
All routes except those marked **public** require `Authorization: Bearer <jwt>`.

Generated from the controllers as of 2026-05-13. Keep in sync when routes change.

## Auth — `/auth`

| Method | Path             | Auth   | Body / notes |
|--------|------------------|--------|--------------|
| POST   | `/auth/login`    | public | `{ email, password }` → `{ access_token, user: { id, name, email } }` |
| POST   | `/auth/register` | public | `RegisterDto { name, email, password }`. Optional header `x-admin-secret` → creates an admin. Reactivates a soft-deleted user with the same email. |
| GET    | `/auth/profile`  | JWT    | Returns `req.user` = `{ id, email, isAdmin }` only — **no `name`** (see KNOWN_ISSUES §4). |

## Users — `/users`

| Method | Path                              | Auth | Notes |
|--------|-----------------------------------|------|-------|
| GET    | `/users/search?email=`            | JWT  | Find an active user by exact email. Rejects searching your own email. |
| GET    | `/users`                          | JWT (admin) | All users. |
| GET    | `/users/:id`                      | JWT  | Self or admin only. |
| PUT    | `/users/:id`                      | JWT  | Self or admin only. `UpdateUserDto`. |
| DELETE | `/users/:id`                      | JWT  | Self or admin. **Soft delete** (mangles email so it can be reused, archives friend requests). |
| POST   | `/users/friends/request`          | JWT  | Body `{ receiverEmail }`. Creates a `pending` FriendRequest. |
| POST   | `/users/friends/request/:requestId` | JWT | Body `{ accept: boolean }`. Receiver only. Accept adds bidirectional friendship. |
| GET    | `/users/friends/list`             | JWT  | Current user's friends (`id, name, email, avatar`). |
| GET    | `/users/friends/requests/pending` | JWT  | `{ sentRequests, receivedRequests }`, pending only. |

## Groups — `/groups`

| Method | Path                          | Auth | Notes |
|--------|-------------------------------|------|-------|
| GET    | `/groups`                     | JWT  | Groups the current user belongs to (`findAllForUser`). |
| GET    | `/groups/user`                | JWT  | Same intent, different query path (`findByUser`). |
| GET    | `/groups/:id`                 | JWT  | Validates UUID format. Loads members, expenses, expense.paidBy, expense.participants. |
| POST   | `/groups`                     | JWT  | `CreateGroupDto { name, description?, memberIds[] }`. Requires ≥2 members; all non-creator members must be the creator's **friends** and active; creator auto-added. |
| PUT    | `/groups/:id`                 | JWT  | Body is `any` — updates name/description/members. |
| POST   | `/groups/:id/members/:userId` | JWT  | Add member. (Skips friend/active validation — see KNOWN_ISSUES §13.) |
| DELETE | `/groups/:id/members/:userId` | JWT  | Remove member. |
| DELETE | `/groups/:id`                 | JWT  | **Hard delete.** |

## Expenses — `/expenses`

| Method | Path                  | Auth | Notes |
|--------|-----------------------|------|-------|
| GET    | `/expenses`           | JWT (admin) | All expenses. |
| GET    | `/expenses/user`      | JWT  | Query `page` (default 1), `limit` (default 10), `groupId?`. Returns `{ data, total, page, limit }`. |
| GET    | `/expenses/balances`  | JWT  | Query `groupId?`. Computes net balances for the user; returns `BalanceResponse[]` (`{ from, fromName, to, toName, amount }`). |
| GET    | `/expenses/:id`       | JWT  | Must be payer/participant or admin. |
| POST   | `/expenses`           | JWT  | `CreateExpenseDto`. `paidById` must be the caller (unless admin). If `groupId` set: caller must be a group member, and all participants + payer must be group members. Validates `splitDetails` sums (percentage → 100, exact → amount). |
| PUT    | `/expenses/:id`       | JWT  | `UpdateExpenseDto`. Payer or admin only. Re-validates split sums. |
| DELETE | `/expenses/:id`       | JWT  | Payer or admin only. **Soft delete.** |

### CreateExpenseDto

```
description: string
amount: number
date: string (ISO)
paidById: string (uuid)
participantIds: string[] (uuid)
groupId?: string (uuid)
splitType: 'equal' | 'percentage' | 'exact'
splitDetails?: Record<userId, number>   // percentage or exact amount per user
```

## Misc

| Method | Path | Notes |
|--------|------|-------|
| GET    | `/` | `AppController.getHello()` — returns a hello string. |

## Error shape

`HttpExceptionFilter` returns:
`{ statusCode, timestamp, path, message }`.
