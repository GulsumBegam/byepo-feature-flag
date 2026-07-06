# Multi-Tenant Feature Flag Management System

Built for the Byepo Technologies SDE technical assessment (Pragmatist track).

## Architecture

```
Super Admin ──┐
Org Admin  ───┼──▶ Backend API (Express + Prisma) ──▶ PostgreSQL (Neon)
End User   ───┘
```

One shared backend and database. Three separate Next.js frontends, one per role,
so each role only ever sees the UI relevant to them.

```
byepo-feature-flags/
├── backend/            Node.js + Express + TypeScript + Prisma API
├── super-admin-app/    Next.js — create & view organizations
├── org-admin-app/      Next.js — signup/login, manage feature flags
├── user-app/           Next.js — check if a feature is enabled
└── README.md
```

## Tech Stack & Why

| Layer | Choice | Reason |
|---|---|---|
| Frontend | Next.js + TypeScript | Fast to build, type-safe, my strongest stack |
| Backend | Node.js + Express + TypeScript | Matches the assignment's suggestion, simple and interview-friendly |
| Database | PostgreSQL (Neon) | Relational data fits this domain well — clear FK relationships for tenant isolation |
| ORM | Prisma | Type-safe queries; schema changes immediately surface type errors across the codebase |
| Auth | JWT + bcryptjs | Custom auth required by the assignment (no third-party providers). JWT is stateless — role and organizationId travel inside the token, so no session store is needed. `bcryptjs` (pure JS) is used instead of native `bcrypt` for zero-friction setup across environments |
| Validation | Zod | Validates request bodies at runtime — TypeScript alone only checks types at compile time, not actual incoming values |

## Data Model

- **Organization** — a tenant
- **User** — covers all 3 roles via a `role` enum (`SUPER_ADMIN`, `ORG_ADMIN`, `END_USER`), rather than 3 separate tables, since they share the same core fields
- **FeatureFlag** — belongs to exactly one Organization; `key` is unique *per organization* (not globally), enforced by a compound unique constraint at the database level
- **AuditLog** (bonus) — records who did what and when, for accountability. Not required by the spec, added to reflect real SaaS practice

## Multi-Tenant Isolation — the core design decision

Every `FeatureFlag` row carries an `organizationId`. Every protected route:
1. Verifies the JWT (`authenticate` middleware)
2. Reads `organizationId` **from the token**, never from anything the client sends in the request body/params
3. Filters every database query by that `organizationId`

This means an Org Admin literally cannot access another organization's flags — not because the frontend hides the button, but because the backend query would return nothing for a foreign ID.

## Known Trade-offs (given the 6–10 hour scope)

- **End User has no login.** The assignment doesn't require End User auth — only that they can check a flag "for their organization." The chosen trade-off: the End User frontend fetches a public list of organization names and lets them pick one, then checks the flag scoped to that org's ID. A production version would likely add lightweight End User accounts instead.
- **No refresh tokens.** JWTs expire after 12h with no refresh flow — acceptable for this scope, would add refresh tokens for a real product.
- **No automated tests** included given the time box — manual testing was done via Postman for every endpoint, including deliberately trying to access another org's data to confirm isolation holds.

## Running Locally

See each folder's own setup, but in short:

```bash
# Backend
cd backend
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run dev          # http://localhost:5000

# Each frontend (separate terminals)
cd super-admin-app && npm install && npm run dev   # :3001
cd org-admin-app   && npm install && npm run dev   # :3002
cd user-app        && npm install && npm run dev   # :3003
```

Generate the Super Admin password hash with:
```bash
node backend/scripts/hash-password.js yourPasswordHere
```
Paste the output into `backend/.env` as `SUPER_ADMIN_PASSWORD_HASH`.
