# Testing Conventions

The baseline harness uses Vitest and React Testing Library.

## Commands

- `npm run test`
  Runs the full Vitest suite once.
- `npm run test:watch`
  Runs the suite in watch mode for local iteration.
- `npm run test:smoke`
  Runs only the smoke path under `src/test/smoke`.

## Placement

- `src/test/smoke`
  App-shell and route-level smoke checks.
- `src/test/unit`
  Small pure-function or component tests.
- `src/test/integration`
  Cross-component or route-level tests that still run in Vitest.
- `tests/e2e`
  Browser-driven end-to-end coverage, reserved for a later Playwright phase.

## Current Smoke Coverage

- `src/test/smoke/root-page.test.tsx`
  Verifies the Clara landing shell renders and exposes the recruiter entry link.
