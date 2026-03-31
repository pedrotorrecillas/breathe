# Clara MVP Scaffold

Foundational Next.js application for the Breath project and the Clara MVP.

This repository currently covers the first Foundations issue (`BRE-15`) and establishes:

- Next.js App Router with TypeScript
- Tailwind CSS v4
- shadcn/ui configuration
- a recruiter route group centered on `Jobs`
- a public candidate apply route group
- initial domain boundaries for jobs, candidates, interview runs, and evaluations
- documented module boundaries for preparation, runtime, and evaluation layers

## Getting Started

Install dependencies and start the dev server:

```bash
npm install
npm run dev
```

Open `http://localhost:3000` in your browser.

Useful commands:

```bash
npm run dev
npm run lint
npm run test
npm run db:generate
npm run db:migrate
npm run build
npm run format
npm run format:write
```

Testing conventions live in [docs/testing.md](./docs/testing.md).
Module boundaries live in [docs/domain-boundaries.md](./docs/domain-boundaries.md).
Neon/Postgres setup lives in [docs/neon-postgres.md](./docs/neon-postgres.md).

## Structure

Key directories:

- `src/app`
  App Router entrypoints and route groups
- `src/app/(recruiter)`
  Recruiter-facing routes and shared shell
- `src/app/(public)`
  Public candidate routes
- `src/components`
  Shared UI and product scaffolding components
- `src/domain`
  Core domain types split by product area
- `src/domain/interview-preparation`
  Generated interview packages and rubrics before a call
- `src/domain/runtime/happyrobot`
  HappyRobot request and webhook shapes
- `src/lib`
  Shared utilities and app-level config

Initial routes:

- `/`
  Scaffold overview and entry links
- `/jobs`
  Recruiter jobs list placeholder
- `/jobs/new`
  Job configuration placeholder
- `/jobs/[jobId]`
  Job detail placeholder
- `/apply/[jobId]`
  Public candidate apply placeholder

Routing convention:

- Recruiter surfaces live under `src/app/(recruiter)` and inherit the recruiter shell.
- Public candidate surfaces live under `src/app/(public)` and render without the recruiter shell.

## Product References

The initial scaffold was shaped from the local product documents in this repository:

- `Refs/What is Clara v2.md`
- `Refs/clara-mvp-functional-spec-v1.md`
- `Refs/clara-mvp-discovery-notes.md`
- `Refs/clara-mvp-linear-plan.md`
