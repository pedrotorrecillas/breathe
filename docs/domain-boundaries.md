# Domain Boundaries

This repository keeps product logic separate from runtime, provider, and evaluation concerns.

## Where New Code Goes

- `src/domain/jobs`
  Job configuration, pipeline state, public apply metadata, and publish rules.
- `src/domain/candidates`
  Candidate profile, application, consent, and lifecycle state.
- `src/domain/interview-preparation`
  Generated interview packages, question sets, and scoring rubrics before a call runs.
- `src/domain/interviews`
  Operational interview run state, retries, and lifecycle tracking.
- `src/domain/runtime/happyrobot`
  HappyRobot request/response/webhook shapes and provider-facing normalization.
- `src/domain/evaluations`
  Post-call evaluation output, fit scoring, and requirement-level assessments.
- `src/lib`
  Cross-cutting helpers, app config, and route-agnostic utilities only.
- `src/app`
  Route files and server components for the public and recruiter surfaces.

## Boundary Rules

- Keep `HappyRobot` details out of product entities.
- Keep interview generation separate from the provider call payload.
- Keep evaluation output separate from the call runtime.
- Model `Candidate` and `Application` separately so a person can reuse the profile across jobs later.
- Keep job requirements editable without coupling them to runtime transport details.

## Current MVP Split

- Product domain: jobs, candidates, interview runs, and evaluations.
- Preparation layer: generated interview questions and scoring guidance.
- Runtime layer: HappyRobot dispatch and webhook normalization.
- Evaluation layer: post-interview scoring and summaries.
