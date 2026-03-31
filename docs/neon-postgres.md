# Neon + Postgres Setup

Clara can now persist runtime/application state durably when `DATABASE_URL` is configured.

## Stack

- `Neon` hosts the database
- `Postgres` is the database engine
- `Drizzle` manages schema and migrations

## Environment

Create `.env.local` from `.env.example` and add your Neon connection string:

```bash
cp .env.example .env.local
```

```env
DATABASE_URL=postgres://USER:PASSWORD@HOST/DBNAME?sslmode=require
```

## Commands

Generate migrations after schema changes:

```bash
npm run db:generate
```

Apply migrations:

```bash
npm run db:migrate
```

Run the app:

```bash
npm run dev
```

## Current behavior

- With `DATABASE_URL` set:
  - jobs are bootstrapped into Postgres on first access
  - public apply/runtime/evaluation state is read from and written to Postgres
  - data survives process restarts
- Without `DATABASE_URL`:
  - the app falls back to the in-memory runtime store used by tests

## Current persisted records

- jobs
- candidates
- applications
- interview runs
- interview preparation packages
- dispatch requests
- dispatch payloads
- dispatch responses
- webhook records
- runtime trace events
- evaluations

## Notes

- The current persistence layer is intentionally MVP-oriented.
- It preserves the existing business logic while moving storage behind an async repository boundary.
- The public apply form now submits through `/api/public-apply` so the client no longer imports the server persistence module directly.
