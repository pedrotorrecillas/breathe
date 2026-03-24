# Clara MVP Discovery Notes

Last updated: 2026-03-24
Status: working draft

## Purpose

This document captures the product and scope decisions made so far for the Clara MVP.

It is intended to help us:

- keep the MVP focused on the real product core
- avoid drifting into adjacent features too early
- turn current discussions into a cleaner spec and later into Linear issues

This is a working document and should be updated as we refine the HappyRobot flow and close remaining open questions.

## Source Alignment

These notes are informed by:

- product decisions from current MVP discovery discussions
- the broader Clara system context in [clara-onboarding-guide.md](/Users/pedrotorrecillas/Documents/Codex/breathe/clara-onboarding-guide.md)

Important update after reviewing the HappyRobot sections in the onboarding guide:

- HappyRobot is not just “the dialer”
- there is a meaningful pre-call normalization layer before voice execution
- the runtime call prompt behaves more like a structured operating contract than a plain script
- the interview phase is primarily for structured data collection, not live hiring decisions

## Product Direction

The MVP is not Copilot-first.

The MVP must deliver the core Clara promise:

`receive a candidate, call them by phone, interview them, evaluate them, and help a recruiter move them through a hiring pipeline`

Copilot, advanced analytics, billing, and settings are out of scope for the first cut.

## Stack Direction

Current preferred stack:

- `Next.js`
- `TypeScript`
- `Tailwind CSS`
- `shadcn/ui`
- `HappyRobot` for real phone interviews

Rationale:

- move fast on product UI and recruiter workflows
- keep a modern frontend foundation
- share types across frontend and backend logic
- integrate with real telephony from day one

## High-Level MVP Goals

The MVP should be good enough to help close customers, not just demo a technical prototype.

The product must support:

- real outbound phone interviews
- recruiter-configurable job setup
- bilingual experience in `English` and `Spanish`
- human-in-the-loop positioning and compliant behavior
- public candidate application flow
- recruiter-facing evaluation and pipeline management

## HappyRobot Reality Check

Based on the onboarding guide, the real HappyRobot/voice flow has more structure than our original lightweight assumption.

For MVP planning, we should model the call system in six conceptual layers:

1. intake
2. runtime normalization
3. conversation policy
4. interview shaping
5. interview execution
6. post-call side effects

This does not mean we need to expose all six layers in the product, but it does mean our backend/domain model should leave room for them.

### What changes in our notes because of this

- We should explicitly model a pre-call normalization step before dispatching to HappyRobot.
- We should treat interview runtime configuration as a composed object, not just “job prompt text”.
- We should preserve a clean distinction between:
  - job conditions that can stop the flow
  - requirement questioning that continues neutrally for data collection
- We should assume language handling is more dynamic than a single hardcoded language flag.
- We should persist more runtime metadata from the call than we first wrote down.

## Domain Modeling Direction

After reviewing the HappyRobot flow in more detail, the strongest implementation recommendation is:

`design the product around InterviewRun as the central operational entity`

Why:

- a candidate can exist independently from a specific interview attempt
- a job can be configured and published independently from any one candidate
- the real runtime complexity lives at the intersection of candidate, job, telephony execution, and evaluation
- HappyRobot introduces operational metadata that belongs to the call execution, not directly to the job or candidate

### Core entities we should model from day one

- `Job`
- `JobCondition`
- `Requirement`
- `Candidate`
- `Application`
- `InterviewRun`
- `InterviewArtifact`
- `Evaluation`
- `AuditEvent`

### Most important entity

`InterviewRun` should carry the operational truth of the interview execution.

At minimum it should be able to hold:

- candidate reference
- job reference
- product-stage status
- operational runtime status
- provider call identifiers
- selected outbound number
- normalized language metadata
- normalized timezone metadata
- timestamps for start/end
- human-requested outcome
- rejection/disposition reason
- artifact references
- evaluation reference

### Product simplicity vs runtime complexity

The product should stay simple on the surface, but the internal model should not pretend the runtime is simple.

Working principle:

- simple UI
- richer backend/domain model

## What The MVP Includes

### Core product

- recruiter dashboard focused on `Jobs`
- job creation flow
- public apply link per job
- candidate application form
- automatic call trigger after application
- HappyRobot-powered phone interview
- recruiter-facing candidate evaluation
- pipeline management inside each job
- explicit rejected handling and reasons

### Candidate evaluation

- global categorical score
- requirement-level categorical scoring
- report view in candidate detail
- audio playback from candidate detail

### Compliance baseline

- AI recommendation only positioning
- explicit human-in-the-loop
- candidate can request a human during the call
- T&C acceptance before application
- compliance-related interview metadata stored

### Language

- UI in English and Spanish
- interview language set per job
- end-to-end same-language flow for MVP

## What Is Out Of Scope For The MVP

- Copilot
- Performance analytics
- Billing
- Settings as a real product area
- global intro/outro customization
- global FAQs
- global evaluation weights
- multi-user roles
- multitenancy / multi-account support
- ATS integrations
- scheduling calls for later
- transcript tab
- CV tab in candidate detail
- key moments
- advanced technical call state history
- manual retry controls

## Product Architecture And Navigation

We want to mirror the navigation architecture of the reference product.

Top-level navigation structure:

- `Jobs`
- `Performance`
- `Billing`
- `Settings`

For the MVP:

- `Jobs` is the only fully implemented area
- the rest can be omitted, hidden, or treated as future surfaces

Primary UX flow:

`Jobs list -> Job detail -> Candidate detail`

Device priority:

- desktop-first

## Jobs Experience

### Jobs list

The jobs list should use horizontal, full-width cards rather than small grid cards.

Each job card should show at least:

- job title
- job status
- created date
- candidate counts by phase
- main actions such as `New job`

Potential actions:

- create new job
- open job detail
- pause/close job behavior can be added, but exact UX can stay simple

### Job lifecycle

Current direction:

- each job gets one public application link
- the link stays active while the job is active
- pausing/closing can likely share similar external behavior for MVP
- if a job is no longer accepting candidates, the public page can show a simple message telling the candidate to contact the responsible company/job contact

Open simplification:

- `Paused` and `Closed` may be collapsed behaviorally for the MVP even if we keep separate internal states later

## Job Creation And Configuration

### Main principles

- job configuration is generated from the `job description`
- Clara extracts structure automatically in one pass
- recruiter can edit everything before publishing
- Clara generates interview questions internally
- recruiter does not manually author interview questions in the MVP

### Job creation flow

The job setup should be a long single-page scroll experience, not a rigid multi-step wizard.

The recruiter provides:

- `Job title`
- `Interview language`
- `Job description`

Clara then extracts and proposes:

- `Job conditions`
- `Essential requirements`
- `Technical skills`
- `Interpersonal skills`

Everything is editable before publish.

The onboarding guide suggests that the runtime prompt is assembled from multiple layers rather than one monolithic prompt.

For MVP we should still keep the recruiter-facing setup simple, but internally we should assume the interview runtime is composed from:

- normalized job metadata
- normalized candidate metadata
- language strategy
- job conditions
- scored requirements
- runtime telephony settings
- next-steps messaging

### Job conditions

Job conditions come from the job description and are editable.

Examples:

- pay
- location
- schedule

These are operational/job-condition checks and are separate from scored requirements.

If a candidate fails a real job condition, they can go directly to `Rejected`.

### Scored sections

The scored structure should include:

- `Essential requirements`
- `Technical skills`
- `Interpersonal skills`

Each item can be marked:

- `Optional`
- `Mandatory`

Important:

- `mandatory` vs `optional` only affects scoring weight
- this does not behave like a knockout question

### Limits

The MVP should ideally support both:

- total interview limit per job
- score-category caps per job

When a limit is reached:

- the job should pause automatically

It would also be useful to surface the relevant counters in the UI.

This is still subject to implementation complexity review.

## Candidate Entry Flow

### Source

For the MVP, candidates enter through a `public apply link`.

No ATS integration yet.

### Candidate form

Minimum form fields currently agreed:

- `Full name`
- `Phone`
- `Email` (desirable, not mandatory)
- `CV upload` or `LinkedIn` as alternatives

Rules:

- CV and LinkedIn are alternatives
- if the candidate provides LinkedIn but not CV, they can still continue

### Application confirmation

After applying, the candidate should see a confirmation state similar to:

`Thanks, we will call you now`

This allows a short delay before the phone call actually starts.

### Candidate legal acceptance

The public form must include:

- mandatory T&C acceptance checkbox

We should store:

- acceptance timestamp
- accepted policy/version

Open question:

- phone verification with OTP may be useful, but is currently considered optional and likely post-MVP unless the HappyRobot reference flow strongly suggests it is needed

## Interview Trigger And Call Flow

### Trigger behavior

In the MVP, the call is triggered automatically when a candidate is added via the public application flow.

### Canonical flow shape

The onboarding guide suggests a real voice flow closer to:

1. intake webhook / candidate trigger
2. pre-call enrichment and normalization
3. runtime language and timezone resolution
4. caller number selection
5. prompt/runtime assembly
6. HappyRobot voice execution
7. post-call metadata persistence and downstream evaluation

We should treat this as the conceptual shape of our own MVP flow even if our first implementation collapses some of these into one service.

### Recommended architectural split

We should conceptually separate the implementation into four layers:

1. `product domain`
2. `interview preparation`
3. `HappyRobot adapter`
4. `evaluation pipeline`

This does not require four deployable services in MVP, but it should shape the code boundaries.

#### 1. Product domain

Owns:

- jobs
- candidates
- applications
- interview runs
- recruiter decisions

#### 2. Interview preparation

Owns:

- job description parsing
- extraction of conditions/requirements/skills
- runtime payload preparation for HappyRobot

#### 3. HappyRobot adapter

Owns:

- call initiation
- provider callback/webhook handling
- mapping provider payloads into internal statuses
- artifact and runtime metadata persistence

#### 4. Evaluation pipeline

Owns:

- transcript/artifact evaluation
- score generation
- requirement-level report generation

### Recommended adapter boundary

We should not let raw HappyRobot workflow concepts leak everywhere in product code.

Examples of things that should stay inside an adapter boundary:

- agent family selection
- number randomizer behavior
- provider callback formats
- language-change runtime tool details
- provider-specific path or mode metadata

The product/domain layer should consume normalized concepts instead.

### Voice layer

HappyRobot will handle:

- real phone calling
- retry logic
- core interview execution

We should present recruiter-facing call states in a friendly way rather than expose raw technical call status.

### Pre-call normalization requirements

The onboarding guide makes it clear that a real call needs more normalization than we had initially documented.

For each interview run, we should aim to resolve and persist at least:

- candidate phone number
- selected outbound number
- candidate/job locale if available
- normalized interview language
- normalized timezone
- current local datetime at call runtime
- current UTC datetime at call runtime
- chosen HappyRobot agent/mode

This is especially important because the guide shows explicit nodes for:

- caller number randomization
- timezone normalization
- content-language detection
- language-requirement detection
- agent selection / enrichment

### Telephony configuration

The onboarding guide suggests caller number selection is operational logic, not business logic.

Implications for MVP:

- we should not hardcode caller pools deep inside workflow code
- selected outbound number should be treated as configuration/runtime metadata
- if we start with only one market or number pool, the model should still leave room for country-aware caller-number selection later

### What we should expose vs hide

We should expose in product/UI:

- friendly interview status
- candidate disposition
- reportable rejected reason
- human requested

We should generally hide from product/UI:

- low-level provider statuses
- workflow node names
- raw runtime branching logic
- provider-specific telephony details

### Language strategy

Our earlier notes said the interview language is set per job. That is still directionally correct for MVP, but the guide shows the real system uses a richer language strategy.

For MVP we should update the model to distinguish:

- recruiter-selected interview language
- detected content language from the job description
- detected or declared language requirement inside requirements
- runtime language-switch capability if HappyRobot supports it

Product behavior can remain simple, but the backend should avoid assuming there is only one language signal.

### Interview execution principle

The onboarding guide is very explicit that the requirement-questioning phase is:

`data collection, not live decisioning`

That should become a hard product rule in the MVP spec.

Implications:

- hard job conditions may stop the flow
- scored requirements should generally continue neutrally once that section starts
- the agent should not “reject” candidates mid-requirement-flow
- negative answers should still be captured cleanly for post-call scoring

### Retry handling

We do not need to build retry controls in the MVP.

If retries are exhausted:

- the candidate moves to `Rejected`

Internally, however, we should still leave room to persist:

- attempt counts if HappyRobot sends them
- last known operational status
- final transport outcome

### Human request

If a candidate asks for a human during the call:

- they stay under `Applicants`
- they are marked as a special `Human requested` case
- they must not be auto-rejected downstream

### Runtime conversation shape

The onboarding guide suggests the actual interview is not a flat script. A closer target shape is:

1. introduction / disclosure / consent
2. optional broad warm-up / ice-breaker questions
3. job conditions check
4. scored requirement questioning
5. next steps / closing

Useful nuances from the guide that should influence our spec:

- broad opening questions are worth preserving
- requirement questions should be asked one at a time
- questions should not be merged into overloaded prompts
- there is a distinct “next steps” block after questioning

### Tools during the call

The onboarding guide references runtime tools such as:

- language change tool
- reschedule tool

Even if we do not expose these in the MVP product surface, we should avoid designing our system as if a call is only “prompt in, transcript out”.

### Post-call data

The onboarding guide also implies there are meaningful post-call side effects and metadata payloads.

For MVP we should plan to persist, when available:

- provider call id / room id
- destination and source number used
- normalized locale/language metadata
- raw provider status/classification if we receive it
- recording pointer
- transcript pointer or transcript artifact
- runtime path/mode metadata if relevant

Even if some of these are not shown in the MVP UI, they are worth storing because they support:

- debugging
- evaluation reproducibility
- compliance traceability
- future transcript/report features

## Pipeline Model

Main job pipeline columns:

- `Applicants`
- `Interviewed`
- `Shortlisted`
- `Hired`

Rejected candidates live in:

- a separate `Rejected` tab

### Meaning of Applicants

`Applicants` includes candidates who:

- have applied
- have not yet completed the interview
- may be in progress / calling / retrying
- may have requested a human

### Automatic transitions

- from `Applicants` to `Interviewed` when Clara successfully contacts and interviews the candidate
- from `Applicants` to `Rejected` when retries are exhausted
- from `Applicants` to `Rejected` when a hard job condition is failed

### Manual transitions

Recruiter actions:

- `Shortlist`
- `Reject`
- `Hire`

Rules:

- `Hire` happens from `Shortlisted`
- moving candidates backwards should be allowed in principle

### Recommended two-level status model

To keep product UX clean without losing operational truth, we should model two distinct status layers:

#### Product pipeline status

- `Applicants`
- `Interviewed`
- `Shortlisted`
- `Hired`
- `Rejected`

#### Interview run operational status

- `pending`
- `calling`
- `completed`
- `human_requested`
- `no_response`
- `failed_job_condition`
- `disconnected`
- `error`

This split should help us keep the UI simple while still supporting a realistic voice runtime.

## Rejected Handling

Rejected candidates should live in a dedicated area, not in the main pipeline columns.

Rejected reasons should be explicit when possible.

Examples:

- failed job condition
- no response
- call disconnected
- recruiter rejected

The exact reason should be visible on the card/list item where possible.

The onboarding guide suggests we should eventually distinguish between:

- transport/call outcome
- conversation/interview outcome

For MVP recruiter UX, we can still collapse this into friendly reasons, but the internal model should leave room for both.

## Candidate Detail

### MVP candidate detail contents

The candidate detail surface should include:

- audio player
- `Report` tab/view
- recruiter actions
- visible AI recommendation disclaimer

### Out of scope for candidate detail MVP

- transcript tab
- CV tab
- key moments
- overall narrative explanation block above the report

### Audio playback

Audio playback is only needed inside candidate detail for the MVP.

Not required from cards or list views.

## Evaluation Model

### Global score

The candidate gets one categorical overall score.

Agreed categories:

- `Outstanding`
- `Great`
- `Good`
- `Average`
- `Low`
- `Poor`

### Requirement-level score

Each scored item uses the same category labels as the global score.

### Report structure

The report should be organized by scored blocks such as:

- `Essential requirements`
- `Technical skills`
- `Interpersonal skills`

Each requirement row should include:

- the requirement itself
- its categorical result
- brief supporting explanation
- evidence/timestamp linkage if available in the implementation

### Job conditions in the report

Job conditions do not need to appear as a dedicated visible report block in the MVP.

They mainly drive operational rejection logic rather than report presentation.

### No general explanation summary

We do not need a high-level “overall explanation” paragraph above the report in the MVP.

## Compliance Decisions

The MVP must position Clara as:

- decision support only
- not an autonomous hiring decision maker

### Visible product behavior

We should show an explicit recruiter-facing disclaimer that the output is an AI recommendation only.

### Candidate-side compliance

- T&C accepted before application
- recording / disclosure / relevant legal statements handled during the call
- candidate can request a human during the call

### Persistence

It makes sense to store, even if not always expose in UI:

- interview configuration/version used
- language used
- language signals and runtime language resolution
- normalized timezone and runtime local/UTC time
- selected outbound number
- provider call metadata / ids
- timestamps
- result metadata
- compliance-related acceptance data

The HappyRobot guide makes these runtime values more important than they first appeared.

They are not implementation noise; they are part of how the interview actually operates.

### Runtime data we should consider non-negotiable

For MVP, the following should be treated as important persisted runtime data even if mostly hidden from UI:

- accepted T&C version and timestamp
- interview configuration snapshot/version
- normalized interview language
- language detection signals if available
- normalized timezone
- local call datetime
- UTC call datetime
- selected outbound number
- provider call id
- recording reference
- transcript or transcript reference
- final operational outcome
- recruiter-facing disposition

### Editing after publish

Recruiters will not be able to edit a published job in the MVP.

## Language And Localization

The MVP should support:

- recruiter UI in `English` and `Spanish`
- interview in `English` and `Spanish`

Current rules:

- UI language inferred from browser initially
- user can later change it
- score labels should be translated in the UI
- the interview flow is end-to-end in one language for now
- language should remain configurable in the model so future recruiter/report language flexibility is possible

Update after reviewing the HappyRobot notes:

- we should treat this as a product simplification, not as a fundamental system truth
- the system model should allow richer language handling later because the real runtime already has language detection and language-change behavior

Open clarification:

- localized FAQ/context systems are not relevant yet because those features are out of scope for the MVP

## Settings That Were Explicitly Removed From The MVP

The following were discussed and then intentionally removed:

- global intro instructions
- global outro instructions
- global FAQ knowledge base
- global evaluation rules
- global scoring weights

This is a useful simplification and should be preserved unless a strong implementation need emerges later.

## Reference Visual/Product Direction

The team wants to stay close to the reference Clara product in:

- navigation architecture
- recruiter workflow shape
- pipeline-driven job detail
- candidate report layout
- overall UX mental model

Important visual/product directions gathered so far:

- desktop-first
- horizontally structured jobs list
- clean, premium, operational B2B dashboard
- report-driven candidate review
- product should feel sellable, not like an internal admin tool

## Shadcn / Design System Direction

The `Luminous Ops` brand brief should be translated into a `shadcn/ui`-based system as a separate design-system effort.

High-level interpretation:

- avoid generic HR SaaS styling
- avoid magical/futuristic AI aesthetics
- emphasize operational infrastructure
- use a technical, luminous, industrial visual language
- keep product UI sober, legible, and system-oriented

This should become a dedicated issue or epic rather than being mixed directly into functional MVP scope.

Reference file:

- [luminous-ops-brand-brief.md](/Users/pedrotorrecillas/Documents/Codex/breathe/luminous-ops-brand-brief.md)

## Open Questions

These are the main unresolved product questions at this stage:

### 1. HappyRobot reference flow

The onboarding guide already helped clarify several things:

- there is a richer pre-call normalization layer
- there is explicit language/timezone/caller-number runtime resolution
- the interview section is collection-first, not live decisioning
- the runtime prompt is a structured operating contract

Remaining things we still need to operationalize in the final spec:

- concrete webhook/event contract we will implement around HappyRobot
- exact mapping from provider outcomes to recruiter-facing statuses
- exact handling of disconnects and partial interviews
- exact metadata contract for recording/transcript/artifacts
- whether any runtime tools such as rescheduling matter for our first cut

### 2. OTP validation

Phone verification by OTP could improve quality and trust, but may add friction and implementation complexity.

Current status:

- open question
- likely post-MVP unless the reference flow suggests it is essential

### 3. Limit complexity

We want:

- total interview caps
- score-category caps

But we still need to validate whether the second one adds too much implementation complexity for the first cut.

### 4. Paused vs Closed

We may not need a strong behavioral distinction in the MVP, even if we keep separate concepts later.

### 5. Warm-up and next-steps behavior

The onboarding guide makes both of these feel important:

- a short broad warm-up before requirement questioning
- a structured next-steps closing block

We still need to decide how explicit these should be in the first spec and whether recruiters will ever control any of that in future versions.

## Current Strong Recommendations

These recommendations should guide the next functional spec.

### Keep in scope at the domain level

- `InterviewRun` as the central runtime entity
- normalized language/timezone/outbound-number metadata
- provider call identifiers and artifacts
- split between pipeline status and operational status
- post-call evaluation as a distinct stage

### Keep out of product scope for now

- direct exposure of HappyRobot internal workflow logic
- runtime tool controls such as language switch or reschedule
- country-specific prompt branches
- provider-specific technical detail in recruiter UI
- complex telephony management surfaces

### Product posture

The right posture for the MVP is:

`simple product on top of a serious runtime`

That should be the lens for future scoping decisions.

## Next Step

Before turning this into specs/issues, we should merge this document with the upcoming HappyRobot reference flow notes.

Then we can produce:

- a tighter MVP functional spec
- state diagrams / transition rules
- epics and issues for Linear
