# ATS Integration Layer Design

## Goal

Design an independent ATS integration layer for Breathe/Nacar with a stable
canonical model, replaceable provider adapters, admin-configurable triggers, and
a first real demo integration with Zoho Recruit. The layer must support
two-way sync: importing jobs/candidates/applications/stages from an ATS,
triggering internal Breathe workflows when configured stage rules match, and
writing interview outcomes or stage changes back to the ATS.

## Non-Goals

- Do not replace Breathe's current candidate, interview, or evaluation domains.
- Do not couple Breathe product entities directly to Zoho field names.
- Do not build every future ATS adapter in the first implementation.
- Do not rely on Kombo, Merge, or any paid aggregator as a required dependency.
- Do not make ATS sync part of the public apply flow's critical path.

## Context

Breathe already separates product domains from provider-specific runtime
concerns. The existing boundaries are:

- `src/domain/candidates`: candidate profiles, applications, consent, lifecycle.
- `src/domain/jobs`: job configuration and pipeline state.
- `src/domain/interviews`: interview run state.
- `src/domain/runtime/happyrobot`: runtime provider details.
- `src/domain/evaluations`: post-call evaluation output.

The ATS layer should follow the same pattern: a new domain that owns ATS
concepts and a library layer that performs sync, mapping, triggers, and
writeback. Existing domains should only interact with it through explicit
interfaces.

## External Research

Kombo and Merge validate the shape of the problem: they normalize ATS objects
into common models, track external IDs, receive webhooks when possible, poll
when webhooks are unavailable, and expose provider-agnostic writeback actions.
Kombo is useful as an architecture reference and possible future adapter, but
not as the first required dependency because pricing is annual/customer-based
and not ideal for an early demo.

Zoho Recruit is the recommended first real demo adapter because:

- It has a Forever Free plan with one active job per recruiter license.
- Zoho documents API access across Recruit editions.
- Free edition API limits are enough for demo-scale sync.
- It exposes candidate/job status updates and notes-related APIs.
- It is known enough to be credible in a customer demo.

Relevant references:

- Zoho Recruit pricing: `https://www.zoho.com/recruit/pricing.html`
- Zoho Recruit API limits: `https://help.zoho.com/portal/en/kb/recruit/developer-guide/api-limits/articles/api-limits`
- Zoho Recruit API v2 limits: `https://www.zoho.com/recruit/developer-guide/apiv2/limits.html`
- Zoho Recruit change status: `https://www.zoho.com/recruit/developer-guide/apiv2/change-status.html`
- Zoho Recruit update records: `https://www.zoho.com/recruit/developer-guide/apiv2/update-records.html`
- Kombo ATS connectors: `https://docs.kombo.dev/ats/connectors`
- Kombo pricing/POC language: `https://www.kombo.dev/pricing`

## Recommended Approach

Build a Breathe-owned canonical ATS layer with provider adapters.

The first implementation should include:

1. `mock_ats` adapter for deterministic demos and tests.
2. `zoho_recruit` adapter for the first real external demo.
3. Canonical sync and writeback services shared by all adapters.
4. Admin configuration for connections, stage mappings, trigger rules, and
   writeback policies.
5. Explicit integration hooks from the ATS layer into existing candidate,
   interview, and evaluation workflows.

Kombo should remain an optional future adapter. If a customer needs a long-tail
ATS quickly, the `kombo` adapter can implement the same interface without
changing product logic.

## Architecture

### New Domain

Create `src/domain/ats-integrations`.

It owns only provider-neutral ATS concepts:

- `ATSProviderKey`
- `ATSConnection`
- `ATSConnectionStatus`
- `ATSCanonicalJob`
- `ATSCanonicalCandidate`
- `ATSCanonicalApplication`
- `ATSCanonicalStage`
- `ATSExternalReference`
- `ATSSyncCursor`
- `ATSSyncEvent`
- `ATSTriggerRule`
- `ATSWritebackAction`
- `ATSWritebackResult`
- `ATSFieldMapping`
- `ATSStageMapping`

No Zoho-specific field name should appear in these types.

### New Library Layer

Create `src/lib/ats-integrations`.

Suggested files:

- `adapters/types.ts`: adapter contract.
- `adapters/mock.ts`: local deterministic adapter.
- `adapters/zoho-recruit.ts`: Zoho API adapter.
- `canonicalize.ts`: converts provider records into canonical records.
- `connections.ts`: admin-managed connection CRUD and status checks.
- `sync.ts`: import loop, cursors, dedupe, and event creation.
- `triggers.ts`: evaluates stage/config rules and requests internal actions.
- `writeback.ts`: queues and dispatches provider writeback actions.
- `zoho/oauth.ts`: token exchange/refresh helpers.
- `zoho/client.ts`: low-level HTTP client with rate-limit handling.
- `zoho/mappers.ts`: Zoho-specific shape conversion.

Existing domains may call this layer, but this layer must not mutate existing
state implicitly. Sync should produce explicit canonical records and events.

### Storage

Create separate tables and runtime-store collections:

- `ats_connections`
- `ats_external_accounts`
- `ats_sync_cursors`
- `ats_external_jobs`
- `ats_external_candidates`
- `ats_external_applications`
- `ats_external_stages`
- `ats_stage_mappings`
- `ats_trigger_rules`
- `ats_sync_events`
- `ats_writeback_actions`
- `ats_writeback_attempts`

Keep payload JSON snapshots for demo speed, but include indexed columns for:

- `company_id`
- `provider`
- `connection_id`
- `external_id`
- `external_updated_at`
- `canonical_kind`
- `status`
- `last_seen_at`

Secrets must not be stored in plain payload snapshots. Use an encrypted secret
field or environment-backed secret reference before production. For the first
demo, storing only a redacted token preview and reading the real token from env
is acceptable.

### Adapter Contract

Every adapter implements the same capabilities:

```ts
export type ATSAdapter = {
  provider: ATSProviderKey;
  validateConnection(input: ATSConnectionAuth): Promise<ATSConnectionCheck>;
  listJobs(input: ATSSyncInput): Promise<ATSSyncPage<ATSProviderJob>>;
  listStages(input: ATSJobStagesInput): Promise<ATSProviderStage[]>;
  listApplications(
    input: ATSSyncInput,
  ): Promise<ATSSyncPage<ATSProviderApplication>>;
  getCandidate(
    input: ATSCandidateLookupInput,
  ): Promise<ATSProviderCandidate | null>;
  writeback(input: ATSWritebackAction): Promise<ATSWritebackResult>;
};
```

Adapters also declare capabilities:

```ts
export type ATSAdapterCapabilities = {
  supportsWebhooks: boolean;
  supportsPolling: boolean;
  supportsCandidateNotes: boolean;
  supportsReportLinks: boolean;
  supportsStageMove: boolean;
  supportsCustomFields: boolean;
  supportsAttachments: boolean;
};
```

The UI and admin rules must read capabilities before offering a writeback mode.

## Canonical Model

### Connection

An `ATSConnection` belongs to a company and provider. It stores:

- `id`
- `companyId`
- `provider`
- `status`: `draft | active | paused | error`
- `displayName`
- `authMode`: `oauth | api_token | env_token | mock`
- `secretRef`
- `externalAccountId`
- `lastSyncAt`
- `lastError`
- `createdAt`
- `updatedAt`

### External References

Every imported object keeps both canonical and provider identity:

- `provider`
- `connectionId`
- `externalId`
- `externalUrl`
- `externalUpdatedAt`
- `rawSnapshotRef`

The dedupe key is:

```text
companyId + provider + connectionId + kind + externalId
```

### Application

The canonical application is the central sync object. It links:

- external candidate
- external job
- external stage
- optional internal `candidateId`
- optional internal `applicationId`
- optional internal `jobId`
- current stage category
- status
- last external update time

Stage mapping must be per external job, not global.

## Zoho Recruit Adapter

### Demo Auth

Use OAuth where possible. For the first demo, support `env_token` mode:

- `ZOHO_RECRUIT_ACCESS_TOKEN`
- `ZOHO_RECRUIT_REFRESH_TOKEN`
- `ZOHO_RECRUIT_CLIENT_ID`
- `ZOHO_RECRUIT_CLIENT_SECRET`
- `ZOHO_RECRUIT_ACCOUNTS_BASE_URL`
- `ZOHO_RECRUIT_API_BASE_URL`

The admin screen can display connection status and masked credentials, but the
first implementation does not need a full OAuth install wizard.

For demo readiness, `npm run test:smoke:zoho` runs a non-destructive live
check when Zoho credentials are present. It validates the connection and reads
jobs/applications; it skips automatically without credentials.

### Sync Surface

Minimum Zoho sync:

- Job openings into `ATSCanonicalJob`.
- Candidates into `ATSCanonicalCandidate`.
- Candidate/job association or candidate status into `ATSCanonicalApplication`.
- Candidate statuses into `ATSCanonicalStage` where the API exposes them.

Because Zoho's status model differs from modern pipeline-stage ATSs, the first
adapter should treat status values as stages. The canonical layer should not
assume that every provider has a native per-job stage pipeline.

### Writeback Surface

Minimum writebacks:

- Add a candidate note through `POST /recruit/v2/Notes` using `Parent_Id` and
  `se_module: "Candidates"`, or update a configured report field with the
  Breathe interview summary.
- Change candidate/application status through Zoho's status endpoint.
- Store writeback attempts and responses for auditability.

If Zoho note creation is blocked by module permissions in Free edition, use a
configurable fallback:

1. update a custom field if available,
2. add a status comment during status change,
3. store the writeback as internal-only and mark the provider action as skipped.

The demo should make this fallback visible in admin health/status.

## Admin Configuration

Add an admin section under settings, likely `/settings/integrations/ats` or a
tab/section on the existing settings page.

The admin needs to configure:

- Provider and connection status.
- Sync mode: `manual`, `scheduled`, or `webhook_plus_polling`.
- Stage mappings from external stages/statuses to Breathe trigger meanings.
- Trigger rules:
  - when candidate enters external stage/status X,
  - for external job Y or all jobs,
  - create/update Breathe candidate/application,
  - generate interview preparation,
  - start interview workflow or mark for recruiter review.
- Writeback policy:
  - write report as note/custom field/status comment,
  - move external candidate to stage/status after outcome,
  - skip writeback until recruiter review.

Admin actions must be audited using the existing audit log pattern.

## Sync Flow

### Initial Sync

1. Admin activates a connection.
2. System validates credentials.
3. System lists external jobs and statuses/stages.
4. System stores canonical external jobs and stages.
5. System lists candidates/applications.
6. System stores external candidates/applications and links to internal records
   when deterministic matches exist.
7. System creates `ats_sync_events` for newly seen or changed applications.
8. Trigger rules evaluate the events.

### Incremental Sync

1. Sync job loads `ATSSyncCursor`.
2. Adapter fetches pages changed since the cursor if supported.
3. If changed-since is not supported, adapter pages recent records and dedupes
   by external ID plus `externalUpdatedAt`.
4. Changes are upserted into external tables.
5. Events are appended idempotently.
6. Triggers evaluate only new events.

### Webhooks

The first Zoho demo may rely on manual/scheduled polling. The architecture must
still reserve `/api/ats/webhooks/[provider]` for providers that support
webhooks later.

Webhook handling rules:

- verify signature when provider supports signatures,
- persist raw event,
- dedupe by provider event ID or body hash,
- enqueue provider-specific fetch/normalize work,
- never trust webhook payload as the only source of truth if a refetch is
  available.

## Trigger Flow

When a candidate enters a configured external stage/status:

1. `ATSSyncEvent` is created.
2. `triggers.ts` matches company, connection, job, and external stage/status.
3. If no internal candidate/application exists, the canonical application is
   linked or imported into Breathe's candidate/application model.
4. The trigger creates a Breathe workflow request:
   - generate interview preparation,
   - create interview run,
   - dispatch immediately or queue for recruiter approval.
5. Trigger execution stores a trace linked to the ATS event.

The first implementation can queue trigger results as internal actions instead
of dispatching immediately, as long as the interface makes automatic dispatch
possible.

## Writeback Flow

When Breathe produces an interview summary/evaluation:

1. Product code requests an `ATSWritebackAction`.
2. The action records intended provider, target external application/candidate,
   action type, payload, idempotency key, and status `queued`.
3. `writeback.ts` dispatches through the adapter.
4. The adapter returns `success`, `skipped`, `retryable_error`, or
   `terminal_error`.
5. Attempts are stored with provider response metadata.
6. The action is visible in admin/recruiter surfaces.

Idempotency key:

```text
connectionId + externalApplicationId + sourceObjectType + sourceObjectId + actionType
```

## Error Handling

- Credential failures pause the connection and show `needs_reauth`.
- Rate limits should back off and preserve cursors.
- Mapping errors should not block sync of unrelated jobs.
- Writeback failures should not change internal candidate state.
- Trigger failures should be retryable and traceable.
- External deletes should mark records `archived_external`, not delete internal
  candidate/application records.

## Testing Strategy

Unit tests:

- canonical type guards and mappers,
- adapter capability handling,
- idempotent sync event creation,
- trigger rule matching,
- writeback idempotency and retry classification,
- Zoho status/note fallback mapping.

Integration tests:

- settings/admin connection flow with `mock_ats`,
- sync import creates external records without touching unrelated domains,
- configured stage trigger imports/links candidate and creates an internal
  workflow request,
- evaluation summary creates queued writeback action,
- writeback success updates action/attempt state.

No e2e test is required for the first design implementation unless UI changes
become substantial.

## Rollout Plan

1. Add domain types and tests.
2. Add adapter interface plus `mock_ats`.
3. Add storage tables/runtime-store collections.
4. Add sync service and idempotent event creation.
5. Add trigger rule service.
6. Add writeback queue/service.
7. Add Zoho client and mapper.
8. Add minimal admin UI.
9. Wire one internal trigger path from external stage to Breathe workflow.
10. Wire one writeback path from evaluation summary to Zoho.
11. Add demo seed/config for Nacar.

## Open Decisions

1. Which exact Zoho account/region will be used for demo: US, EU, or another
   data center? This determines base URLs and OAuth account host.
2. Should the first trigger auto-dispatch interviews, or queue them for
   recruiter approval in the demo?
3. Which Zoho status names should represent the demo journey?
4. Should Breathe write the interview report as a candidate note first, or as a
   custom field/status comment fallback first?
5. Should the first admin UI live inside the existing settings page, or should
   integrations get a dedicated route?

## Recommended Defaults

- Zoho region: EU if the demo account can be created there, otherwise US.
- Trigger mode: queue for recruiter approval first; allow auto-dispatch via
  config but keep it off by default.
- Demo statuses: `New`, `Breathe Screen`, `Interview Completed`, `Shortlisted`,
  `Rejected`.
- Report writeback: note first, status comment fallback, custom field optional.
- Admin route: dedicated `/settings/integrations/ats` if navigation churn is
  acceptable; otherwise an admin-only card on `/settings` for the first pass.

## Review Checklist

- The ATS model is separate from existing product/runtime/evaluation domains.
- Provider-specific details are limited to adapter files.
- Zoho is useful for a real demo without making the architecture Zoho-shaped.
- The design supports future Recruitee, Ashby, Teamtailor, Greenhouse, Lever,
  and Kombo adapters.
- Admin configuration covers both triggers and writeback policy.
- Sync and writeback are idempotent and auditable.
- The first implementation can be small but still moves toward the full
  two-way sync objective.
