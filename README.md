# Poultry Farm Manager

A multi-store web app for poultry farm owners. The Super Admin creates a store for each vendor. Each vendor logs in with their mobile number and password and manages purchases, expenses, sales, customers (KhataBook) and stock.

**Stack:** Next.js 15 (App Router + Server Actions) · Tailwind CSS 4 · Prisma 6 · MySQL · JWT cookie auth

## Local setup

Requirements: Node.js 20+ and a MySQL 8 database.

```bash
npm install                 # also runs `prisma generate`
cp .env.example .env        # then edit the values (see below)
npm run db:push             # creates the tables
npm run db:seed             # creates the Super Admin from .env
npm run dev                 # http://localhost:3000
```

### Environment variables

| Name | Description |
|---|---|
| `DATABASE_URL` | MySQL connection string, e.g. `mysql://user:pass@localhost:3306/poultry_app` |
| `AUTH_SECRET` | Random secret, at least 32 characters (`openssl rand -base64 48`) |
| `SUPERADMIN_NAME` / `SUPERADMIN_MOBILE` / `SUPERADMIN_PASSWORD` | Used only by `npm run db:seed` |

## Scripts

| Script | What it does |
|---|---|
| `npm run dev` | Development server |
| `npm run build` / `npm start` | Production build / server |
| `npm run lint` | ESLint |
| `npm run db:push` | Sync `prisma/schema.prisma` to the database |
| `npm run db:seed` | Create the Super Admin (skips if it already exists) |
| `npm run db:studio` | Browse the database in Prisma Studio |

## Free deployment (Vercel + free MySQL)

1. **Database:** create a free MySQL-compatible database, for example **TiDB Cloud Serverless** (tidbcloud.com) or **Aiven for MySQL** (free plan). Copy the connection string. TiDB needs SSL, so add `?sslaccept=strict` to the end of the string.
2. **Create tables and the admin** from your computer, pointing `.env` at the cloud database:
   ```bash
   npm run db:push && npm run db:seed
   ```
3. **Vercel:** push this folder to GitHub, then on vercel.com choose *Add New → Project* and import the repo.
   - If the repo root is the parent folder, set **Root Directory** to `poultry-app`.
   - Add environment variables `DATABASE_URL` and `AUTH_SECRET`.
   - Deploy. `postinstall` runs `prisma generate` automatically.

## How it works

### Roles
- **Super Admin** (`/admin`): create and edit stores, reset a vendor's password (this logs the vendor out everywhere), activate or deactivate stores, and change their own password.
- **Vendor** (`/vendor`): one mobile number = one store. A vendor sees only their own data. If their store is deactivated, they are logged out on their next request and cannot log in again.

### Business rules
- **Total** = weight (kg) × rate per kg, calculated on the server.
- **Stock** per size = purchases − sales (pieces and kg). It is calculated, not stored. A sale cannot use more pieces than are in stock.
- **Customer pending** = Σ(sale total − paid at sale) − Σ later payments.
- **Walk-in sales** must be fully paid. Only saved customers can carry a pending amount.
- A payment cannot be more than the customer's pending amount.
- Deletes are protected:
  - A purchase whose pieces are already sold cannot be deleted.
  - A sale that has payments against it cannot be deleted.
  - A customer with entries cannot be deleted.
- Labour and Other expenses require a description.
- Dates are calendar dates in India time (Asia/Kolkata).

### Code layout
```
prisma/schema.prisma        Database tables
prisma/seed.ts              Super Admin seed
src/middleware.ts           Route protection (/admin, /vendor)
src/lib/auth.ts             JWT sign/verify (edge-safe)
src/lib/session.ts          Cookie session, requireAdmin / requireVendor
src/lib/data.ts             Stock and pending calculations
src/lib/format.ts           Labels, currency/date helpers
src/app/login               Login + logout
src/app/admin               Super Admin pages + actions.ts
src/app/vendor              Vendor pages + actions.ts
src/components              Shared UI (forms, tables, sale form…)
```

All database writes go through the server actions in `src/app/*/actions.ts`. Each action checks the session and limits every query to the logged-in vendor's `store_id`.
