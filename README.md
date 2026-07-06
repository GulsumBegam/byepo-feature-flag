# Multi-Tenant Feature Flag Management System

A full-stack SaaS platform for managing feature flags across multiple organizations —
built for the Byepo Technologies SDE technical assessment (Pragmatist track).

Three role-scoped frontends, one backend, one database, complete tenant isolation.

**Built by [Gulsum Begam❤️](https://github.com/GulsumBegam)** — MCA graduate, Full-Stack Developer

---

## 🔗 Live Demo

| App | Link | Purpose |
|---|---|---|
| 🟠 Super Admin | [byepo-super-admin.vercel.app](https://byepo-super-admin.vercel.app) | Create & view organizations |
| 🔵 Org Admin | [byepo-org-admin.vercel.app](https://byepo-org-admin.vercel.app) | Sign up, manage feature flags |
| 🟢 User App | [byepo-user-app-rho.vercel.app](https://byepo-user-app-rho.vercel.app) | Check if a feature is enabled |
| ⚙️ Backend API | [byepo-feature-flag.onrender.com](https://byepo-feature-flag.onrender.com/health) | Express + Prisma REST API |

> **Note:** the backend runs on Render's free tier, which sleeps after ~15 minutes
> of inactivity. The first request may take 30–60 seconds to wake it up — this is
> expected, not a bug.

**Try it yourself in under a minute:**
1. Log into Super Admin and create an organization
2. Sign up as that org's Admin and create a flag (e.g. `dark_mode`), toggle it on
3. Open the User App, pick your org, type the flag key — see it report **Enabled**
4. Pick a *different* org and check the same key — see it correctly report **Disabled**

That last step is the whole point of this project: proving tenant data never leaks
across organizations.

---

## 📸 Walkthrough

### Super Admin — creating an organization
Static credentials, no signup. Can create and view all organizations on the platform.

<img src="docs/screenshots/super-admin-1-creating.png" width="700" alt="Super Admin creating an organization" />
<img src="docs/screenshots/super-admin-2-created.png" width="700" alt="Organization saved and listed" />

### Organization Admin — managing feature flags
Each Org Admin only ever sees and manages flags for their own organization.

<img src="docs/screenshots/org-admin-1-existing-flag.png" width="700" alt="Existing enabled flag" />
<img src="docs/screenshots/org-admin-2-adding-new.png" width="700" alt="Creating a new flag" />
<img src="docs/screenshots/org-admin-3-created.png" width="700" alt="New flag created, both listed" />
<img src="docs/screenshots/org-admin-4-both-enabled.png" width="700" alt="Both flags toggled on" />
<img src="docs/screenshots/org-admin-5-deleted-one.png" width="700" alt="One flag deleted" />

### End User — checking a feature, and proving isolation
The same flag key returns different results depending on the organization —
because it's scoped per-tenant at the database level, not just hidden in the UI.

<img src="docs/screenshots/user-app-1-disabled-wrong-org.png" width="450" alt="Disabled for the wrong organization" />
<img src="docs/screenshots/user-app-2-enabled-correct-org.png" width="450" alt="Enabled for the correct organization" />

### Database — Prisma Studio, live data
<img src="docs/screenshots/db-organization.png" width="700" alt="Organization table" />
<img src="docs/screenshots/db-user.png" width="700" alt="User table with hashed passwords" />
<img src="docs/screenshots/db-featureflag.png" width="700" alt="FeatureFlag table" />
<img src="docs/screenshots/db-auditlog.png" width="700" alt="AuditLog table" />

---

## 🏗️ Architecture

```
Super Admin ──┐
Org Admin  ───┼──▶ Backend API (Express + Prisma) ──▶ PostgreSQL (Neon)
End User   ───┘
```

One shared backend and database. Three independent Next.js frontends — one per
role — so each role only ever sees the UI relevant to them, not just hidden
buttons behind a permission check.

```
byepo-feature-flags/
├── backend/            Node.js + Express + TypeScript + Prisma API
├── super-admin-app/    Next.js — create & view organizations
├── org-admin-app/      Next.js — signup/login, manage feature flags
├── user-app/           Next.js — check if a feature is enabled
├── docs/screenshots/   Walkthrough images used in this README
└── README.md
```

---

## 🛠️ Tech Stack & Why

| Layer | Choice | Reasoning |
|---|---|---|
| Frontend | Next.js + TypeScript | Fast to build, type-safe, my strongest stack |
| Backend | Node.js + Express + TypeScript | Matches the assignment's suggestion; simple and easy to reason about |
| Database | PostgreSQL (Neon) | Relational data fits this domain naturally — clear foreign-key relationships make tenant isolation easy to enforce and easy to reason about |
| ORM | Prisma | Type-safe queries — a schema change immediately surfaces type errors everywhere that data is used |
| Auth | JWT + bcryptjs | Custom auth required by the assignment (no third-party providers). JWT is stateless — role and organizationId travel inside the signed token, so no session store is needed. `bcryptjs` (pure JS) is used over native `bcrypt` for friction-free setup across environments |
| Validation | Zod | Validates request bodies at runtime — TypeScript alone only checks types at compile time, not the actual values coming over the wire |
| Deployment | Vercel (frontends) + Render (backend) + Neon (DB) | Free, fast to set up, and mirrors how a small real product would actually be deployed |

---

## 🗄️ Data Model

- **Organization** — a tenant on the platform
- **User** — covers all 3 roles via a `role` enum (`SUPER_ADMIN`, `ORG_ADMIN`, `END_USER`) instead of 3 separate tables, since they share the same core fields (email, password hash, timestamps)
- **FeatureFlag** — belongs to exactly one Organization; `key` is unique **per organization**, not globally, enforced by a compound unique constraint (`@@unique([organizationId, key])`) at the database level
- **AuditLog** *(bonus, not required by the spec)* — records who did what and when, for accountability — reflects how this would actually be built in a real product

## 🔒 Multi-Tenant Isolation — the core design decision

Every `FeatureFlag` row carries an `organizationId`. Every protected route:

1. Verifies the JWT (`authenticate` middleware)
2. Reads `organizationId` **from the token** — never from anything the client sends in the request body or URL params
3. Filters every database query by that `organizationId`

An Org Admin cannot access another organization's flags — not because a button is
hidden in the UI, but because the underlying database query for a foreign
`organizationId` structurally cannot return another tenant's rows. This is what
the screenshots above under "End User" are demonstrating directly, not just
claiming.

---

## ⚖️ Known Trade-offs *(given the 6–10 hour scope)*

- **End User has no login.** The assignment doesn't require End User
  authentication — only that they can check a flag "for their organization."
  The trade-off chosen: the End User frontend fetches a public list of
  organization names and lets them pick one, then checks the flag scoped to
  that org's ID. A production version would add lightweight End User accounts.
- **No refresh tokens.** JWTs expire after 12h with no refresh flow —
  acceptable for this scope; a real product would add refresh tokens.
- **Manual testing over automated tests**, given the time box — every
  endpoint was tested via the actual UI and Prisma Studio, including
  deliberately checking a flag against the *wrong* organization to confirm
  isolation holds (see screenshots above).

---

## 🚀 Running Locally

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

Copy `backend/.env.example` to `backend/.env` and fill in:
- `DATABASE_URL` — your Postgres connection string
- `JWT_SECRET` — any long random string
- `SUPER_ADMIN_USERNAME` / `SUPER_ADMIN_PASSWORD_HASH` — generate the hash with:
  ```bash
  node backend/scripts/hash-password.js yourPasswordHere
  ```

Copy each frontend's `.env.local.example` to `.env.local` and set
`NEXT_PUBLIC_API_URL` to your backend URL.

---

## 📋 Assignment Requirements Checklist

| Requirement | Status |
|---|---|
| Node.js backend, any framework | ✅ Express |
| Any frontend framework | ✅ Next.js |
| SQL or NoSQL database | ✅ PostgreSQL (Neon) |
| Custom auth, no third-party providers | ✅ JWT + bcryptjs, built from scratch |
| Super Admin — static creds, login, create/view orgs | ✅ |
| Org Admin — signup, login, create/update/delete flags scoped to own org | ✅ |
| End User — check if a feature is enabled | ✅ |
| Three separate front-end applications | ✅ |
| Persistent storage — Organizations, Users, Roles, Feature Flags | ✅ |
| Multi-tenant data isolation | ✅ proven, not just implemented — see screenshots |

---

## 📬 Contact

**Gulsum Begam**
Full-Stack Developer · [GitHub](https://github.com/GulsumBegam) · Chennai / Bangalore, India
