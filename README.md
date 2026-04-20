# Breathe

Breathe is a Next.js recruiter product for running AI-assisted hiring workflows end to end:

- recruiters create and publish roles
- candidates apply through a public link
- interview runs are dispatched through HappyRobot
- callbacks, runtime traces, and evaluation outputs are persisted
- recruiters review pipeline state, candidate notes, recordings, and evaluation summaries
- recruiter access is protected by app-owned auth with optional Google sign-in

This repository contains the product app, persistence layer, recruiter UI, public apply flow, auth foundation, and the HappyRobot runtime/evaluation pipeline.

## Current Product Surface

Today the app includes:

- recruiter workspace with jobs list, job creation, job detail, and settings
- protected recruiter auth with password login and optional Google sign-in
- company/team access foundation for recruiter visibility and job access
- public candidate apply flow under `/apply/[jobId]`
- interview runtime orchestration, webhook ingestion, and evaluation generation
- Postgres persistence through Drizzle, with in-memory fallback for tests/local no-DB runs

## Quick Start

Install dependencies:

```bash
npm install
```

Create local env:

```bash
cp .env.example .env.local
```

Start the app:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment

Core local variables live in [.env.example](./.env.example).

Most important ones:

```env
DATABASE_URL=postgres://USER:PASSWORD@HOST/DBNAME?sslmode=require

AUTH_SEED_EMAIL=recruiter@company.com
AUTH_SEED_PASSWORD=change-me
AUTH_SEED_NAME=Recruiter Admin
AUTH_SEED_COMPANY_NAME=Company Recruiting
AUTH_SEED_COMPANY_SLUG=company-recruiting
AUTH_SEED_WORKSPACE_KEY=operations

AUTH_GOOGLE_CLIENT_ID=your-google-oauth-client-id
AUTH_GOOGLE_CLIENT_SECRET=your-google-oauth-client-secret
AUTH_GOOGLE_HOSTED_DOMAIN=

HAPPYROBOT_WORKFLOW_WEBHOOK_URL=https://workflows.platform.happyrobot.ai/hooks/your-webhook-id
ANTHROPIC_API_KEY=your-anthropic-api-key
ANTHROPIC_MODEL=claude-sonnet-4-20250514
FAL_KEY=your-fal-api-key
```

Notes:

- `AUTH_SEED_EMAIL` and `AUTH_SEED_PASSWORD` are the minimum auth bootstrap values.
- Google login is optional.
- With `DATABASE_URL`, app state persists in Postgres.
- Without `DATABASE_URL`, the app falls back to the in-memory runtime store used by tests.

## Commands

Core commands:

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run test
npm run test:watch
npm run test:smoke
npm run test:e2e
npm run test:e2e:update
npm run db:generate
npm run db:migrate
npm run format
npm run format:write
```

## Routes

Recruiter routes:

- `/jobs`
  Recruiter jobs index and pipeline summary
- `/jobs/new`
  Role drafting, extraction review, limits, and publish flow
- `/jobs/[jobId]`
  Candidate pipeline review, recruiter actions, notes, evaluation, and audio
- `/settings`
  Recruiter account context, access visibility, and team/job access management
- `/teams`
  Redirects to `/settings`

Auth routes:

- `/auth/login`
  Recruiter login page
- `/auth/google`
  Starts Google OAuth flow
- `/auth/google/callback`
  Completes Google OAuth flow
- `/auth/logout`
  Clears the recruiter session

Public routes:

- `/`
  Product home / landing surface
- `/apply/[jobId]`
  Public candidate application flow

API routes:

- `/api/recruiter/jobs`
  Publish recruiter jobs
- `/api/recruiter/jobs/extract`
  Extract structured job draft from recruiter input
- `/api/recruiter/candidates/[candidateId]/notes`
  Persist recruiter-only candidate notes
- `/api/public-apply`
  Accept public candidate applications
- `/api/happyrobot/webhook`
  Receive runtime callbacks from HappyRobot

## Architecture

## Tenant Isolation Baseline

The recruiter product now uses a logical multi-tenant model with company-aware access control:

- recruiter auth resolves a `user + company membership + session`
- recruiter data is scoped by `companyId`
- opportunity visibility is granted through `teams` and `job_access_grants`
- sensitive mutations write a lightweight audit trail into `audit_events`

The current audit trail covers:

- team creation
- team member add and remove
- opportunity grant and revoke
- recruiter profile updates
- company settings updates

This is the current baseline, not the final compliance posture. The intended guarantee for this layer is:

- no recruiter should see jobs outside their company
- no recruiter should see jobs outside their granted teams
- non-admin recruiters should not be able to mutate admin-only settings
- auth redirects should resolve against the public auth base URL and sanitize unsafe `next` targets

Relevant tests now live under:

- `src/test/unit/auth/*`
- `src/test/unit/settings/*`
- `src/test/unit/teams/*`
- `src/test/integration/recruiter/*`

## Structure
The repository is split around product boundaries instead of generic layers.

High-level flow:

1. Recruiter drafts and publishes a role.
2. Candidate applies through the public link.
3. The app creates candidate, application, interview preparation, and interview run records.
4. Runtime payloads are normalized and dispatched to HappyRobot.
5. Webhooks update interview state, artifacts, and traces.
6. Evaluation is generated from transcript/evidence.
7. Recruiters review the outcome in the pipeline UI.

Main code areas:

- `src/app`
  App Router routes, layouts, and server entrypoints
- `src/components`
  Product UI components for recruiter, public apply, settings, and shared states
- `src/domain`
  Domain types for jobs, candidates, interviews, evaluation, and runtime boundaries
- `src/lib/auth`
  Password auth, Google auth, session handling, and recruiter auth server helpers
- `src/lib/db`
  Drizzle schema, client, migrations, and runtime store
- `src/lib/public-apply-submissions.ts`
  Public apply persistence and runtime snapshot assembly
- `src/lib/happyrobot-*`
  Dispatch, webhook normalization, and runtime orchestration
- `src/lib/job-*`
  Job extraction, recruiter jobs, and pipeline snapshot building
- `src/lib/team-access.ts`
  Company/team access model and recruiter job visibility
- `src/test`
  Unit, integration, smoke, and e2e coverage

## Persistence

The app uses Drizzle + Postgres when `DATABASE_URL` is configured.

Currently persisted records include:

- companies
- users
- company memberships
- sessions
- teams
- team memberships
- job access grants
- jobs
- candidates
- applications
- candidate notes
- interview runs
- interview preparation packages
- dispatch requests
- dispatch payloads
- dispatch responses
- webhook records
- runtime trace events
- evaluations

The fallback in-memory runtime store mirrors the same product behavior closely enough for tests and local development without Postgres.

## Authentication And Access

The recruiter product uses an app-owned auth model built around:

- users
- companies
- company memberships
- sessions

Current behavior:

- recruiter routes and recruiter APIs require authentication
- password login works from seeded local credentials
- optional Google sign-in creates the same app-owned recruiter session
- Google login only succeeds for verified emails that already map to a local recruiter user
- recruiter access is constrained by company and team/job visibility rules

For setup details, see [docs/auth.md](./docs/auth.md).

## Documentation Map

Project docs:

- [docs/auth.md](./docs/auth.md)
  Recruiter auth setup, seed credentials, Google OAuth, and behavior
- [docs/neon-postgres.md](./docs/neon-postgres.md)
  Neon/Postgres environment, persistence behavior, and migrations
- [docs/testing.md](./docs/testing.md)
  Test strategy and conventions
- [docs/domain-boundaries.md](./docs/domain-boundaries.md)
  Product/domain architecture boundaries
- [docs/job-extraction-schema.md](./docs/job-extraction-schema.md)
  Structured job extraction shape

Agent and workflow conventions:

- [AGENTS.md](./AGENTS.md)
  Repo-specific instructions for coding agents and task hygiene

## Product References

Local product references used to shape the MVP include:

- `Refs/What is Clara v2.md`
- `Refs/clara-mvp-functional-spec-v1.md`
- `Refs/clara-mvp-discovery-notes.md`
- `Refs/clara-mvp-linear-plan.md`

## Notes

- The repo currently has a mix of active product code and exploratory/reference assets under `Refs/`.
- If you are changing schema or persistence behavior, run `npm run db:migrate`.
- If you are touching recruiter auth or protected routes, read [docs/auth.md](./docs/auth.md) first.
