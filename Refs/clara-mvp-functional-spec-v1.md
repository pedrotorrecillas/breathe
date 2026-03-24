# Clara MVP Functional Spec v1

Last updated: 2026-03-24
Status: draft

## Purpose

This document defines the first functional version of the Clara MVP based on discovery decisions so far.

It is intended to be:

- specific enough to guide product and engineering implementation
- narrow enough to preserve MVP focus
- realistic about the operational complexity introduced by HappyRobot

This spec should be used as the bridge between discovery notes and execution planning.

## Product Goal

Clara MVP should allow a recruiter to:

1. create a job from a job description
2. let candidates apply through a public link
3. automatically call those candidates by phone through HappyRobot
4. evaluate the resulting interview
5. review candidates in a pipeline and make manual decisions

The MVP must be credible enough to support customer conversations and early commercial validation.

## Product Principles

### 1. Interview-first

The product is centered on phone interviews, not on Copilot or analytics.

### 2. Recruiter-configurable, not recruiter-scripted

Recruiters configure job criteria and context.

Clara generates the interview runtime from that configuration.

Recruiters do not manually author the full interview script in the MVP.

### 3. Decision support only

Clara recommends and structures signal.

Humans make hiring decisions.

### 4. Simple UI, serious runtime

The recruiter experience should be clean and productized.

The backend/runtime model should still preserve the important telephony and compliance facts.

## In Scope

### Core user-facing scope

- jobs list
- job creation
- job detail with candidate pipeline
- candidate detail with report and audio
- public apply link per job
- candidate public application form
- automatic phone call after application
- recruiter actions:
  - shortlist
  - reject
  - hire

### Core system scope

- extraction of job conditions and scored requirements from job description
- real outbound calling through HappyRobot
- retry handling delegated to HappyRobot
- call outcome ingestion
- post-call evaluation
- bilingual UI and interview support in English and Spanish
- compliance baseline

## Out Of Scope

- Copilot
- Performance
- Billing
- real Settings area
- ATS integrations
- scheduled calling
- recruiter-authored interview scripts
- transcript tab
- CV tab inside candidate detail
- key moments UI
- multi-user roles
- multitenancy
- global intro/outro customization
- global FAQ customization
- global scoring settings
- manual retry controls
- provider-level telephony management UI

## Users

### Recruiter

Primary user of the dashboard.

Goals:

- create and publish jobs
- review candidate flow
- inspect reports
- manually move candidates forward or reject them

### Candidate

Primary user of the public application flow.

Goals:

- apply to a job
- provide basic contact and profile information
- receive the phone interview

## Main User Flows

## 1. Recruiter creates a job

1. Recruiter clicks `New job`
2. Recruiter enters:
   - job title
   - interview language
   - job description
3. Clara extracts:
   - job conditions
   - essential requirements
   - technical skills
   - interpersonal skills
4. Recruiter reviews and edits the extracted configuration
5. Recruiter sets interview limits
6. Recruiter publishes the job
7. System generates a public application link

## 2. Candidate applies

1. Candidate opens the public application link
2. Candidate fills the form
3. Candidate accepts T&C
4. Candidate submits the form
5. Candidate sees a confirmation state:
   - “Thanks, we’ll call you now”
6. System creates the candidate/application/interview run
7. System dispatches the call to HappyRobot

## 3. HappyRobot runs the interview

1. System prepares runtime call payload
2. HappyRobot calls the candidate
3. Candidate receives disclosure/consent during the call
4. Clara runs the interview flow
5. Call outcome and artifacts are returned/persisted
6. Evaluation is generated
7. Candidate is reflected in the correct pipeline state

## 4. Recruiter reviews candidate

1. Recruiter opens job detail
2. Recruiter sees candidate in pipeline
3. Recruiter opens candidate detail
4. Recruiter reviews:
   - audio
   - report
   - score categories
5. Recruiter manually chooses:
   - shortlist
   - reject
   - hire, if already shortlisted

## Navigation

We want to preserve the reference navigation architecture:

- `Jobs`
- `Performance`
- `Billing`
- `Settings`

For MVP:

- only `Jobs` is implemented as a real functional area

Device priority:

- desktop-first

## Jobs List

### Layout

- horizontal, full-width cards
- not a small grid layout

### Each job card should show

- job title
- current job status
- created date
- candidate counts by phase
- link into job detail

### Candidate counts shown on the card

At minimum:

- applicants
- interviewed
- shortlisted
- hired
- rejected, if useful

### Job actions

- create new job
- open job
- pause or close behavior can be added simply

## Job States

Recommended MVP job states:

- `Draft`
- `Active`
- `Inactive`

Notes:

- `Inactive` can cover both paused and closed external behavior for MVP
- inactive jobs should not accept new candidates through the public link
- the public link can show a simple not-accepting-candidates message

## Job Configuration

## Inputs provided by recruiter

- `Job title`
- `Interview language`
- `Job description`

## Extracted and editable sections

### 1. Job conditions

Examples:

- pay
- location
- schedule

These are operational conditions and can directly reject a candidate.

### 2. Essential requirements

These are job-level important criteria.

Each item is editable and marked:

- `Optional`
- `Mandatory`

### 3. Technical skills

Task-based or technical capability requirements.

Each item is editable and marked:

- `Optional`
- `Mandatory`

### 4. Interpersonal skills

Behavioral / soft-skill requirements.

Each item is editable and marked:

- `Optional`
- `Mandatory`

## Requirement semantics

`Mandatory` does not mean knockout in this MVP.

It means:

- higher weight in final scoring

Knockout behavior belongs to job conditions, not to scored requirements.

## Job configuration UX

- one long scrollable job setup experience
- not a rigid multi-step wizard
- extraction happens in one pass
- all extracted fields remain editable before publish

## Interview Limits

The system should support, if implementation cost is acceptable:

- total interview limit per job
- score-category caps per job

Expected behavior:

- when a relevant limit is hit, the job becomes inactive automatically

## Public Apply Link

Each published job has:

- one public apply link

Behavior:

- active while the job is active
- disabled when the job is inactive

## Candidate Public Application

## Candidate form fields

- `Full name` required
- `Phone` required
- `Email` optional but desirable
- `CV upload` or `LinkedIn` required as one-of-two alternatives
- `T&C acceptance` required

## Candidate-side confirmation

After submit, candidate sees:

- an immediate confirmation state indicating the system will call shortly

## Candidate legal handling

We must store:

- T&C accepted flag
- acceptance timestamp
- accepted version identifier

Open question:

- phone OTP validation remains undecided and likely post-MVP unless operational evidence makes it necessary

## Interview Runtime Model

## Canonical runtime shape

The system should conceptually follow this flow:

1. intake
2. runtime normalization
3. conversation policy
4. interview shaping
5. interview execution
6. post-call persistence

This does not mean we expose all of this in the UI.

It means the backend model should account for it.

## Runtime preparation inputs

Before dispatching a call to HappyRobot, we should normalize:

- candidate data
- job data
- interview language
- timezone
- outbound number
- job conditions
- scored requirements
- next-step messaging context

## Language handling

### Product rule

The interview is configured in one language end-to-end for MVP.

Supported languages:

- English
- Spanish

### Backend/runtime rule

We should still preserve richer language metadata when available:

- recruiter-selected interview language
- detected content language
- explicit language-related requirements
- runtime language actually used

This keeps the model future-ready.

## Timezone handling

We should persist:

- normalized timezone
- local call datetime
- UTC call datetime

## Outbound number handling

We should persist:

- selected outbound number

Implementation note:

- number pool logic should not be hardcoded deep in domain logic

## Interview Conversation Shape

Recommended runtime flow:

1. introduction
2. AI disclosure / consent
3. optional warm-up
4. job conditions check
5. requirement questioning
6. next steps / close

## Hard product rule

During requirement questioning, the system is:

`collecting data, not making live hiring decisions`

Implications:

- once in the scored questioning phase, the interview should generally continue neutrally
- requirement failures should be handled in post-call evaluation
- the agent should not “reject live” based on scored requirements

## Job conditions behavior

Job conditions can still stop the flow when appropriate.

If a candidate fails a real job condition:

- they can move directly to rejected

## Retry handling

HappyRobot owns retry logic for MVP.

We do not build retry controls in the recruiter product.

When retries are exhausted:

- the candidate is placed in `Rejected`

## Human request behavior

If the candidate requests a human during the call:

- the candidate remains in `Applicants`
- the candidate is marked `Human requested`
- the candidate must not be auto-rejected

## Core Domain Model

## Entities

### Job

Represents a published hiring flow.

Key fields:

- title
- description
- interview language
- status
- public apply link
- interview limits
- published timestamp

### JobCondition

Represents a hard operational condition for the role.

Examples:

- pay
- location
- schedule

Key fields:

- job id
- condition type
- value
- order
- active flag

### Requirement

Represents a scored evaluation item.

Key fields:

- job id
- section
- text
- weight class (`mandatory` / `optional`)
- order

Sections:

- essential
- technical
- interpersonal

### Candidate

Represents a person who applies.

Key fields:

- full name
- phone
- email
- cv asset reference
- linkedin url

### Application

Represents the candidate’s submission to a specific job.

Key fields:

- job id
- candidate id
- source
- terms accepted
- terms version
- submitted at

### InterviewRun

Central operational entity.

Represents the actual interview execution for a candidate/job combination.

Key fields:

- job id
- candidate id
- application id
- pipeline status
- operational status
- provider call id
- selected outbound number
- normalized language
- normalized timezone
- local call datetime
- UTC call datetime
- human requested flag
- rejection reason
- started at
- ended at

### InterviewArtifact

Represents persisted call artifacts.

Key fields:

- interview run id
- recording reference
- transcript reference
- provider payload snapshot reference

### Evaluation

Represents the scoring output for one interview run.

Key fields:

- interview run id
- global category
- generated at

And per requirement:

- requirement id
- category
- explanation
- evidence pointer / timestamp if available

### AuditEvent

Tracks important compliance and operational events.

Examples:

- job published
- terms accepted
- call initiated
- call completed
- human requested
- evaluation generated
- recruiter shortlisted candidate

## Status Model

## Product pipeline status

- `Applicants`
- `Interviewed`
- `Shortlisted`
- `Hired`
- `Rejected`

## Operational interview status

- `pending`
- `calling`
- `completed`
- `human_requested`
- `no_response`
- `failed_job_condition`
- `disconnected`
- `error`

This split exists to preserve runtime truth without polluting recruiter UX.

## Pipeline Transition Rules

### Automatic transitions

- application created -> candidate appears in `Applicants`
- successful completed interview -> candidate moves to `Interviewed`
- retries exhausted -> candidate moves to `Rejected`
- hard job condition failed -> candidate moves to `Rejected`
- human requested -> candidate remains in `Applicants`

### Manual recruiter transitions

- `Interviewed` -> `Shortlisted`
- `Interviewed` -> `Rejected`
- `Shortlisted` -> `Hired`

We also want the ability to move candidates backwards where needed.

## Rejected Model

Rejected candidates live in:

- a separate `Rejected` tab

Rejected reasons should be visible where possible.

Examples:

- failed job condition
- no response
- call disconnected
- recruiter rejected

## Candidate Detail

## Included in MVP

- audio player
- report view
- visible AI recommendation disclaimer
- shortlist action
- reject action
- hire action when candidate is shortlisted

## Not included in MVP

- transcript tab
- CV tab
- key moments rail
- full narrative summary section

## Evaluation Output

## Global categories

- `Outstanding`
- `Great`
- `Good`
- `Average`
- `Low`
- `Poor`

## Requirement categories

Use the same scale as global categories.

## Report structure

The report is organized by:

- essential requirements
- technical skills
- interpersonal skills

Each row should include:

- requirement text
- category
- short explanation
- evidence/timestamp when available

## Compliance

## Product posture

The product must explicitly communicate:

- the output is an AI recommendation
- the final decision belongs to a human recruiter

## Candidate compliance behavior

Before application:

- T&C must be accepted

During call:

- disclosure and consent are handled by the voice agent
- candidate can request a human

## Data we should persist for compliance and traceability

- T&C version and timestamp
- job/interview configuration snapshot
- interview language
- timezone
- runtime timestamps
- provider call metadata
- outcome/disposition
- artifacts

## Localization

## Supported languages in MVP

- English
- Spanish

## UI language behavior

- inferred from browser by default
- user can later change it

## Translation expectations

- recruiter UI translated
- score labels translated
- candidate-facing UI translated

## Integration Boundary With HappyRobot

We should implement a dedicated `HappyRobot adapter` boundary.

This boundary should own:

- call initiation
- webhook/callback ingestion
- provider payload normalization
- artifact capture

The rest of the product should operate on normalized internal concepts instead of provider-specific workflow details.

## Explicit Non-Goals For This Spec

- reflecting every internal HappyRobot node
- exposing provider-native statuses to the recruiter
- modeling country-specific logic in the first UI
- supporting complex runtime tools in the recruiter product

## Open Questions

### 1. OTP verification

Should candidate phone verification be required before call dispatch?

Current stance:

- probably post-MVP

### 2. Limit complexity

Do score-category caps enter the first build, or only total interview limits?

Current stance:

- include both if implementation remains tractable

### 3. Inactive job semantics

Do we preserve separate paused/closed states internally or collapse them fully in MVP?

Current stance:

- external behavior can be collapsed for MVP

### 4. Warm-up and next-steps detail

How much of the warm-up/closing behavior needs to be configurable versus simply handled by Clara runtime defaults?

Current stance:

- runtime defaults

## Next Step

Turn this spec into:

- product epics
- engineering epics
- a state/event map for HappyRobot integration
- Linear issues
