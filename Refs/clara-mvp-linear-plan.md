# Clara MVP Linear Plan

Last updated: 2026-03-24
Status: draft

## Purpose

This document translates the current MVP functional spec into:

- proposed Linear epics
- proposed issue breakdown

The goal is to create a practical execution structure that is:

- product-shaped
- engineering-friendly
- still narrow enough for MVP delivery

## Recommended Linear Structure

Suggested top level:

- one Linear project for the overall MVP
- epics as the main workstreams
- issues underneath each epic

Suggested project name:

- `Clara MVP`

Suggested milestones/phases inside the project:

1. Foundations
2. Job Creation
3. Candidate Intake
4. HappyRobot Runtime
5. Evaluation And Pipeline
6. QA And Launch Readiness

## Proposed Epics

## Epic 1: App Shell And Recruiter Foundations

Goal:

Create the initial recruiter-facing app shell and the base technical foundations for the MVP.

Includes:

- app structure
- navigation shell
- localization scaffolding
- baseline auth assumptions if needed for internal MVP
- shared UI primitives

## Epic 2: Jobs List And Job Lifecycle

Goal:

Allow recruiters to view jobs, understand candidate counts by phase, and manage job visibility/activity state.

Includes:

- jobs list
- horizontal job cards
- job states
- public apply link visibility

## Epic 3: Job Configuration And Publish Flow

Goal:

Allow recruiters to create a job from a job description, auto-extract structure, edit it, configure limits, and publish it.

Includes:

- job creation page
- extraction workflow
- conditions/requirements/skills editing
- publish flow

## Epic 4: Public Candidate Apply Flow

Goal:

Allow candidates to apply through a public link and trigger interview creation.

Includes:

- public job landing/apply form
- form validation
- T&C acceptance
- candidate/application creation
- confirmation screen

## Epic 5: Interview Runtime Domain And HappyRobot Adapter

Goal:

Model and implement the operational interview layer around HappyRobot.

Includes:

- interview run model
- runtime normalization
- call dispatch
- webhook/callback ingestion
- operational status mapping
- artifact persistence

## Epic 6: Evaluation Pipeline And Candidate Report

Goal:

Generate evaluation output from the interview and make it usable in the recruiter product.

Includes:

- evaluation generation
- global category scoring
- per-requirement scoring
- candidate detail report
- audio access

## Epic 7: Job Pipeline And Recruiter Decisions

Goal:

Expose the candidate pipeline in each job and allow recruiters to take manual actions.

Includes:

- job detail pipeline
- candidate cards
- rejected tab
- shortlist / reject / hire actions
- move-back behavior

## Epic 8: Compliance, Audit And Traceability

Goal:

Ensure the MVP is operationally traceable and compliant enough for real customer conversations.

Includes:

- AI recommendation disclaimers
- T&C versioning
- audit events
- configuration snapshots
- human-requested handling safeguards

## Epic 9: ES/EN Localization

Goal:

Support the recruiter and candidate experience in Spanish and English.

Includes:

- UI translation scaffolding
- translated score labels
- browser language inference
- language switch support

## Epic 10: Design System Foundation On Shadcn

Goal:

Translate the current brand direction into a reusable product UI foundation.

Includes:

- app theme
- shell styling
- card patterns
- badges and states
- form styling

This epic should stay coordinated with product implementation, but can be phased to avoid blocking functional work.

## Issue Breakdown

## Epic 1: App Shell And Recruiter Foundations

### 1.1 Initialize the Clara MVP app with Next.js, TypeScript, Tailwind and shadcn/ui

Deliverables:

- project bootstrapped
- base dependencies installed
- shadcn configured
- base folder structure created

### 1.2 Create the recruiter app shell and top navigation

Deliverables:

- shell layout
- top nav matching target architecture
- `Jobs` as active area

### 1.3 Define the initial application routing structure

Deliverables:

- jobs list route
- job creation route
- job detail route
- public apply route

### 1.4 Set up the initial data access and domain module structure

Deliverables:

- clear separation between product domain, HR adapter, and evaluation logic

### 1.5 Add baseline error/loading/empty UI states

Deliverables:

- reusable loading skeletons
- empty jobs state
- generic error surface

## Epic 2: Jobs List And Job Lifecycle

### 2.1 Design and build the horizontal job card pattern

Deliverables:

- full-width job cards
- candidate counts by phase
- status display

### 2.2 Implement jobs list page

Deliverables:

- list jobs
- open job detail
- create new job CTA

### 2.3 Add job status model and lifecycle rules

Deliverables:

- draft
- active
- inactive

### 2.4 Generate and store a public apply link for published jobs

Deliverables:

- unique public link per job

### 2.5 Handle inactive jobs in public surfaces

Deliverables:

- public page message for jobs no longer accepting candidates

## Epic 3: Job Configuration And Publish Flow

### 3.1 Build the initial create-job page

Deliverables:

- title input
- interview language input
- job description input

### 3.2 Implement job-description extraction pipeline

Deliverables:

- one-pass extraction of:
  - job conditions
  - essential requirements
  - technical skills
  - interpersonal skills

### 3.3 Build editable job-conditions section

Deliverables:

- add/edit/remove conditions
- missing-value indicators

### 3.4 Build editable essential requirements section

Deliverables:

- edit text
- delete item
- mark optional/mandatory

### 3.5 Build editable technical skills section

Deliverables:

- add/edit/delete skill
- mark optional/mandatory

### 3.6 Build editable interpersonal skills section

Deliverables:

- add/edit/delete skill
- mark optional/mandatory

### 3.7 Implement interview limit configuration

Deliverables:

- total interview cap
- score-category caps if feasible

### 3.8 Implement job publish flow

Deliverables:

- validation
- persist job snapshot
- generate public link
- move job to active

## Epic 4: Public Candidate Apply Flow

### 4.1 Build the public job application page

Deliverables:

- job context visible
- candidate form rendered

### 4.2 Implement candidate application form validation

Deliverables:

- required full name and phone
- email optional
- CV or LinkedIn as one-of-two rule

### 4.3 Implement file upload handling for CV

Deliverables:

- CV upload flow
- asset reference stored

### 4.4 Implement T&C acceptance capture

Deliverables:

- required checkbox
- version + timestamp storage

### 4.5 Create candidate, application and initial interview run on submit

Deliverables:

- all three records created consistently

### 4.6 Build post-submit confirmation state

Deliverables:

- “we’ll call you now” confirmation page/state

## Epic 5: Interview Runtime Domain And HappyRobot Adapter

### 5.1 Define the InterviewRun domain model

Deliverables:

- pipeline status
- operational status
- provider ids
- runtime metadata fields

### 5.2 Implement runtime normalization before dispatch

Deliverables:

- normalized language
- normalized timezone
- outbound number resolution placeholder/logic

### 5.3 Build HappyRobot call dispatch adapter

Deliverables:

- normalized request payload
- call initiation flow

### 5.4 Implement HappyRobot webhook/callback ingestion

Deliverables:

- receive provider events
- verify/map payloads
- persist normalized updates

### 5.5 Map provider outcomes into internal operational statuses

Deliverables:

- completed
- no response
- failed job condition
- disconnected
- human requested
- error

### 5.6 Persist call artifacts and provider metadata

Deliverables:

- provider call id
- recording reference
- transcript reference if available
- provider payload snapshots if needed

### 5.7 Implement automatic transitions from runtime outcomes to pipeline outcomes

Deliverables:

- applicants -> interviewed
- applicants -> rejected
- applicants -> human requested special case

## Epic 6: Evaluation Pipeline And Candidate Report

### 6.1 Define evaluation data model

Deliverables:

- global score category
- per-requirement categories
- short explanations

### 6.2 Implement post-call evaluation trigger

Deliverables:

- evaluation starts after relevant interview completion event

### 6.3 Implement global categorical scoring

Deliverables:

- outstanding / great / good / average / low / poor

### 6.4 Implement per-requirement evaluation generation

Deliverables:

- categories by requirement
- explanation text

### 6.5 Build candidate detail report view

Deliverables:

- report grouped by section
- requirement rows
- visible score labels

### 6.6 Add audio player to candidate detail

Deliverables:

- playback from stored recording

## Epic 7: Job Pipeline And Recruiter Decisions

### 7.1 Build job detail page shell

Deliverables:

- job header
- phase columns
- rejected tab entry point

### 7.2 Build applicant/interviewed/shortlisted/hired pipeline columns

Deliverables:

- lane layout
- counts
- candidate cards

### 7.3 Build candidate card UI with reason/state badges

Deliverables:

- friendly state labels
- score badge when available
- action affordances

### 7.4 Implement rejected tab with explicit reasons

Deliverables:

- list rejected candidates
- visible reason labels

### 7.5 Implement shortlist and reject actions

Deliverables:

- recruiter can move candidate from interviewed to shortlisted or rejected

### 7.6 Implement hire action from shortlisted

Deliverables:

- shortlisted -> hired

### 7.7 Support moving candidates backward between manual stages

Deliverables:

- move back behavior where allowed

### 7.8 Build candidate detail open/close flow from pipeline

Deliverables:

- open candidate detail
- keep pipeline context

## Epic 8: Compliance, Audit And Traceability

### 8.1 Add recruiter-facing AI recommendation disclaimer

Deliverables:

- visible disclaimer in candidate detail/report context

### 8.2 Persist job configuration snapshots for each interview run

Deliverables:

- interview run linked to exact configuration used

### 8.3 Create audit event model and persistence

Deliverables:

- core audit events stored

### 8.4 Implement human-requested safeguards

Deliverables:

- human requested candidates are not auto-rejected

### 8.5 Persist compliance-critical timestamps and metadata

Deliverables:

- terms accepted
- runtime timestamps
- language/timezone metadata

## Epic 9: ES/EN Localization

### 9.1 Set up translation framework and dictionaries

Deliverables:

- English and Spanish message dictionaries

### 9.2 Implement browser language inference

Deliverables:

- initial locale selected from browser

### 9.3 Add manual language switching

Deliverables:

- recruiter can change UI language

### 9.4 Localize recruiter-facing MVP surfaces

Deliverables:

- jobs list
- create job
- job detail
- candidate detail

### 9.5 Localize candidate-facing application flow

Deliverables:

- public form
- validation
- confirmation state

### 9.6 Localize score labels and core statuses

Deliverables:

- translated category labels
- translated pipeline labels

## Epic 10: Design System Foundation On Shadcn

### 10.1 Create the initial Clara theme on top of shadcn/ui

Reference:

- [luminous-ops-brand-brief.md](/Users/pedrotorrecillas/Documents/Codex/breathe/luminous-ops-brand-brief.md)

Deliverables:

- token direction
- shell and surface treatment

### 10.2 Define reusable card patterns for jobs and candidates

Deliverables:

- job card
- pipeline card
- rejected candidate card

### 10.3 Define badge system for score and status states

Deliverables:

- score badges
- reason/status badges

### 10.4 Define form patterns for job creation and candidate apply

Deliverables:

- input/select/textarea patterns
- validation/error states

### 10.5 Apply the system to the main MVP surfaces

Deliverables:

- jobs list
- create job
- job detail
- candidate detail
- public apply page

## Suggested First Execution Order

Recommended sequence:

1. Epic 1: App Shell And Recruiter Foundations
2. Epic 10: Design System Foundation On Shadcn
3. Epic 3: Job Configuration And Publish Flow
4. Epic 2: Jobs List And Job Lifecycle
5. Epic 4: Public Candidate Apply Flow
6. Epic 5: Interview Runtime Domain And HappyRobot Adapter
7. Epic 6: Evaluation Pipeline And Candidate Report
8. Epic 7: Job Pipeline And Recruiter Decisions
9. Epic 8: Compliance, Audit And Traceability
10. Epic 9: ES/EN Localization

## Suggested First Wave Of Issues

If we want the first execution slice rather than all issues at once, I would start with:

- 1.1 Initialize the Clara MVP app with Next.js, TypeScript, Tailwind and shadcn/ui
- 1.2 Create the recruiter app shell and top navigation
- 10.1 Create the initial Clara theme on top of shadcn/ui
- 3.1 Build the initial create-job page
- 3.2 Implement job-description extraction pipeline
- 3.3 Build editable job-conditions section
- 3.4 Build editable essential requirements section
- 3.5 Build editable technical skills section
- 3.6 Build editable interpersonal skills section
- 3.8 Implement job publish flow
- 2.2 Implement jobs list page
- 4.1 Build the public job application page
- 4.2 Implement candidate application form validation
- 4.4 Implement T&C acceptance capture
- 5.1 Define the InterviewRun domain model
- 5.3 Build HappyRobot call dispatch adapter

This gives us a first end-to-end vertical slice:

- configure job
- publish job
- open public link
- apply
- create interview run
- dispatch call

## Notes

- These issues are intentionally product-sized, not yet engineering subtasks.
- Some of them may later split once we estimate implementation complexity.
- The HappyRobot adapter issues should be refined again once we lock the exact provider contract we will implement.
