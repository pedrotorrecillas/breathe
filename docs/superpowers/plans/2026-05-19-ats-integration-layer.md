# ATS Integration Layer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an independent ATS integration layer with a canonical model, replaceable adapters, admin-configurable triggers, and a Zoho Recruit demo path for two-way sync and writeback.

**Architecture:** Add a new `ats-integrations` domain and library layer that owns provider-neutral ATS records, sync events, trigger rules, and writeback actions. Provider details stay inside adapters, with `mock_ats` for deterministic tests/demos and `zoho_recruit` for the first real external integration.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Drizzle/Postgres JSON payload tables, Vitest, existing runtime-store pattern, existing recruiter auth/settings/audit patterns.

---

## File Structure

Create:

- `src/domain/ats-integrations/types.ts`: canonical ATS domain types.
- `src/domain/ats-integrations/index.ts`: domain re-export.
- `src/lib/ats-integrations/adapters/types.ts`: provider adapter contract and provider payload types.
- `src/lib/ats-integrations/adapters/mock.ts`: deterministic mock adapter.
- `src/lib/ats-integrations/registry.ts`: adapter lookup.
- `src/lib/ats-integrations/connections.ts`: connection lifecycle and admin state helpers.
- `src/lib/ats-integrations/sync.ts`: sync orchestration and idempotent event creation.
- `src/lib/ats-integrations/triggers.ts`: stage trigger rule matching and internal action requests.
- `src/lib/ats-integrations/writeback.ts`: writeback queue, attempts, idempotency, provider dispatch.
- `src/lib/ats-integrations/workflow-requests.ts`: ATS trigger to internal workflow request bridge.
- `src/lib/ats-integrations/zoho/client.ts`: Zoho HTTP client with env-token auth and error mapping.
- `src/lib/ats-integrations/zoho/mappers.ts`: Zoho record to canonical/provider shapes.
- `src/lib/ats-integrations/adapters/zoho-recruit.ts`: Zoho adapter.
- `src/app/(recruiter)/settings/integrations/ats/page.tsx`: admin ATS settings page.
- `src/app/(recruiter)/settings/integrations/ats/actions.ts`: server actions for connection/config/sync/writeback.
- `src/app/(recruiter)/settings/integrations/ats/ats-settings-workspace.tsx`: client form/workspace.
- `src/app/api/ats/webhooks/[provider]/route.ts`: webhook intake scaffold.
- `src/test/unit/ats-integrations/types.test.ts`
- `src/test/unit/ats-integrations/mock-adapter.test.ts`
- `src/test/unit/ats-integrations/sync.test.ts`
- `src/test/unit/ats-integrations/triggers.test.ts`
- `src/test/unit/ats-integrations/writeback.test.ts`
- `src/test/unit/ats-integrations/workflow-requests.test.ts`
- `src/test/unit/ats-integrations/zoho-mappers.test.ts`
- `src/test/integration/recruiter/ats-settings-page.test.tsx`
- `src/test/integration/ats-webhook-route.test.ts`

Modify:

- `src/domain/index.ts`: export new ATS domain.
- `src/lib/db/schema.ts`: add ATS tables.
- `src/lib/db/runtime-store.ts`: add ATS collections and persistence.
- `src/lib/db/migrations/*`: generated migration after schema edits.
- `src/lib/audit/types.ts`: add ATS admin action names.
- `docs/domain-boundaries.md`: document ATS boundary.

Do not modify existing HappyRobot runtime internals during the first pass. Connect to interviews/evaluations through explicit action records and a thin request function only after ATS sync/writeback primitives are tested.

---

### Task 1: Canonical ATS Domain Types

**Files:**

- Create: `src/domain/ats-integrations/types.ts`
- Create: `src/domain/ats-integrations/index.ts`
- Modify: `src/domain/index.ts`
- Test: `src/test/unit/ats-integrations/types.test.ts`

- [ ] **Step 1: Write the failing type guard test**

Create `src/test/unit/ats-integrations/types.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import {
  atsProviderKeys,
  isATSProviderKey,
  type ATSConnection,
  type ATSCanonicalApplication,
} from "@/domain/ats-integrations";

describe("ATS integration domain types", () => {
  it("recognizes supported provider keys", () => {
    expect(atsProviderKeys).toEqual([
      "mock_ats",
      "zoho_recruit",
      "recruitee",
      "ashby",
      "teamtailor",
      "greenhouse",
      "lever",
      "kombo",
    ]);
    expect(isATSProviderKey("zoho_recruit")).toBe(true);
    expect(isATSProviderKey("unknown")).toBe(false);
  });

  it("keeps canonical applications provider-neutral", () => {
    const connection: ATSConnection = {
      id: "ats_conn_1",
      companyId: "company_1",
      provider: "zoho_recruit",
      status: "active",
      displayName: "Zoho demo",
      authMode: "env_token",
      secretRef: "env:ZOHO_RECRUIT_ACCESS_TOKEN",
      externalAccountId: "zoho_org_1",
      lastSyncAt: null,
      lastError: null,
      createdAt: "2026-05-19T10:00:00.000Z",
      updatedAt: "2026-05-19T10:00:00.000Z",
    };

    const application: ATSCanonicalApplication = {
      id: "ats_app_1",
      companyId: connection.companyId,
      connectionId: connection.id,
      provider: connection.provider,
      externalId: "candidate_1:job_1",
      externalCandidateId: "candidate_1",
      externalJobId: "job_1",
      externalStageId: "Breathe Screen",
      externalUrl: null,
      internalCandidateId: null,
      internalApplicationId: null,
      internalJobId: null,
      candidateName: "Ana Martin",
      candidateEmail: "ana@example.com",
      candidatePhone: "+34600000000",
      jobTitle: "Store Associate",
      stageName: "Breathe Screen",
      stageCategory: "screening",
      status: "active",
      externalUpdatedAt: "2026-05-19T10:01:00.000Z",
      lastSeenAt: "2026-05-19T10:02:00.000Z",
      rawSnapshot: { providerRecordId: "candidate_1" },
    };

    expect(application.provider).toBe("zoho_recruit");
    expect(Object.keys(application.rawSnapshot)).not.toContain("Candidate_Status");
  });
});
```

- [ ] **Step 2: Run the test and verify it fails**

Run:

```bash
npm test -- src/test/unit/ats-integrations/types.test.ts
```

Expected: FAIL because `@/domain/ats-integrations` does not exist.

- [ ] **Step 3: Implement the domain types**

Create `src/domain/ats-integrations/types.ts`:

```ts
import type { EntityId, ISODateTimeString } from "@/domain/shared/types";

export const atsProviderKeys = [
  "mock_ats",
  "zoho_recruit",
  "recruitee",
  "ashby",
  "teamtailor",
  "greenhouse",
  "lever",
  "kombo",
] as const;

export type ATSProviderKey = (typeof atsProviderKeys)[number];

export function isATSProviderKey(value: unknown): value is ATSProviderKey {
  return typeof value === "string" && atsProviderKeys.includes(value as ATSProviderKey);
}

export type ATSConnectionStatus = "draft" | "active" | "paused" | "error";
export type ATSAuthMode = "oauth" | "api_token" | "env_token" | "mock";

export type ATSConnection = {
  id: EntityId;
  companyId: EntityId;
  provider: ATSProviderKey;
  status: ATSConnectionStatus;
  displayName: string;
  authMode: ATSAuthMode;
  secretRef: string | null;
  externalAccountId: string | null;
  lastSyncAt: ISODateTimeString | null;
  lastError: string | null;
  createdAt: ISODateTimeString;
  updatedAt: ISODateTimeString;
};

export type ATSExternalRecordStatus = "active" | "archived_external" | "deleted_external";
export type ATSStageCategory =
  | "new"
  | "screening"
  | "interview"
  | "evaluation"
  | "offer"
  | "hired"
  | "rejected"
  | "other";

export type ATSRawSnapshot = Record<string, unknown>;

export type ATSCanonicalJob = {
  id: EntityId;
  companyId: EntityId;
  connectionId: EntityId;
  provider: ATSProviderKey;
  externalId: string;
  externalUrl: string | null;
  title: string;
  status: ATSExternalRecordStatus;
  externalUpdatedAt: ISODateTimeString | null;
  lastSeenAt: ISODateTimeString;
  rawSnapshot: ATSRawSnapshot;
};

export type ATSCanonicalCandidate = {
  id: EntityId;
  companyId: EntityId;
  connectionId: EntityId;
  provider: ATSProviderKey;
  externalId: string;
  externalUrl: string | null;
  fullName: string;
  email: string | null;
  phone: string | null;
  status: ATSExternalRecordStatus;
  externalUpdatedAt: ISODateTimeString | null;
  lastSeenAt: ISODateTimeString;
  rawSnapshot: ATSRawSnapshot;
};

export type ATSCanonicalStage = {
  id: EntityId;
  companyId: EntityId;
  connectionId: EntityId;
  provider: ATSProviderKey;
  externalJobId: string | null;
  externalId: string;
  name: string;
  category: ATSStageCategory;
  position: number;
  status: ATSExternalRecordStatus;
  lastSeenAt: ISODateTimeString;
  rawSnapshot: ATSRawSnapshot;
};

export type ATSCanonicalApplication = {
  id: EntityId;
  companyId: EntityId;
  connectionId: EntityId;
  provider: ATSProviderKey;
  externalId: string;
  externalCandidateId: string;
  externalJobId: string | null;
  externalStageId: string | null;
  externalUrl: string | null;
  internalCandidateId: EntityId | null;
  internalApplicationId: EntityId | null;
  internalJobId: EntityId | null;
  candidateName: string;
  candidateEmail: string | null;
  candidatePhone: string | null;
  jobTitle: string | null;
  stageName: string | null;
  stageCategory: ATSStageCategory;
  status: ATSExternalRecordStatus;
  externalUpdatedAt: ISODateTimeString | null;
  lastSeenAt: ISODateTimeString;
  rawSnapshot: ATSRawSnapshot;
};

export type ATSSyncCursor = {
  id: EntityId;
  companyId: EntityId;
  connectionId: EntityId;
  provider: ATSProviderKey;
  resource: "jobs" | "candidates" | "applications" | "stages";
  cursor: string | null;
  syncedUntil: ISODateTimeString | null;
  updatedAt: ISODateTimeString;
};

export type ATSSyncEventType =
  | "job_seen"
  | "candidate_seen"
  | "application_seen"
  | "application_stage_changed"
  | "external_record_archived";

export type ATSSyncEvent = {
  id: EntityId;
  companyId: EntityId;
  connectionId: EntityId;
  provider: ATSProviderKey;
  eventType: ATSSyncEventType;
  externalObjectType: "job" | "candidate" | "application" | "stage";
  externalObjectId: string;
  externalJobId: string | null;
  externalCandidateId: string | null;
  externalStageId: string | null;
  occurredAt: ISODateTimeString;
  processedAt: ISODateTimeString | null;
  idempotencyKey: string;
  payload: ATSRawSnapshot;
};

export type ATSTriggerAction = "import_candidate" | "prepare_interview" | "queue_interview" | "dispatch_interview";

export type ATSTriggerRule = {
  id: EntityId;
  companyId: EntityId;
  connectionId: EntityId;
  provider: ATSProviderKey;
  name: string;
  enabled: boolean;
  externalJobId: string | null;
  externalStageId: string;
  actions: ATSTriggerAction[];
  requiresRecruiterApproval: boolean;
  createdAt: ISODateTimeString;
  updatedAt: ISODateTimeString;
};

export type ATSWritebackActionType =
  | "candidate_note"
  | "candidate_report_link"
  | "candidate_custom_field"
  | "application_stage_move"
  | "status_comment";

export type ATSWritebackStatus = "queued" | "succeeded" | "skipped" | "retryable_error" | "terminal_error";

export type ATSWritebackAction = {
  id: EntityId;
  companyId: EntityId;
  connectionId: EntityId;
  provider: ATSProviderKey;
  actionType: ATSWritebackActionType;
  targetExternalCandidateId: string | null;
  targetExternalApplicationId: string | null;
  targetExternalJobId: string | null;
  targetExternalStageId: string | null;
  sourceObjectType: "evaluation" | "interview_run" | "manual_admin_action";
  sourceObjectId: EntityId;
  status: ATSWritebackStatus;
  idempotencyKey: string;
  payload: ATSRawSnapshot;
  createdAt: ISODateTimeString;
  updatedAt: ISODateTimeString;
};

export type ATSWritebackAttempt = {
  id: EntityId;
  writebackActionId: EntityId;
  attemptedAt: ISODateTimeString;
  status: ATSWritebackStatus;
  providerStatusCode: number | null;
  providerResponse: ATSRawSnapshot;
  errorMessage: string | null;
};

export type ATSWritebackResult = {
  status: ATSWritebackStatus;
  providerStatusCode: number | null;
  providerResponse: ATSRawSnapshot;
  errorMessage: string | null;
};
```

Create `src/domain/ats-integrations/index.ts`:

```ts
export * from "./types";
```

Modify `src/domain/index.ts`:

```ts
export * from "@/domain/ats-integrations/types";
export * from "@/domain/candidates/types";
export * from "@/domain/evaluations/types";
export * from "@/domain/interview-preparation/types";
export * from "@/domain/interviews/types";
export * from "@/domain/jobs/configuration";
export * from "@/domain/jobs/types";
export * from "@/domain/shared/types";
```

- [ ] **Step 4: Run the domain tests**

Run:

```bash
npm test -- src/test/unit/ats-integrations/types.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/domain/index.ts src/domain/ats-integrations src/test/unit/ats-integrations/types.test.ts
git commit -m "feat(ats): add canonical integration domain"
```

---

### Task 2: Runtime Store And Database Tables

**Files:**

- Modify: `src/lib/db/schema.ts`
- Modify: `src/lib/db/runtime-store.ts`
- Create: generated Drizzle migration under `src/lib/db/migrations/`
- Test: `src/test/unit/ats-integrations/store-shape.test.ts`

- [ ] **Step 1: Write the failing store-shape test**

Create `src/test/unit/ats-integrations/store-shape.test.ts`:

```ts
import { beforeEach, describe, expect, it } from "vitest";

import { loadRuntimeStoreState, resetRuntimeStoreState, saveRuntimeStoreState } from "@/lib/db/runtime-store";

describe("ATS runtime store state", () => {
  beforeEach(async () => {
    await resetRuntimeStoreState();
  });

  it("persists ATS collections in memory mode", async () => {
    const state = await loadRuntimeStoreState();
    expect(state.atsConnections).toEqual([]);
    expect(state.atsSyncEvents).toEqual([]);
    expect(state.atsWritebackActions).toEqual([]);

    state.atsConnections.push({
      id: "ats_conn_1",
      companyId: "company_1",
      provider: "mock_ats",
      status: "active",
      displayName: "Mock ATS",
      authMode: "mock",
      secretRef: null,
      externalAccountId: "mock_account",
      lastSyncAt: null,
      lastError: null,
      createdAt: "2026-05-19T10:00:00.000Z",
      updatedAt: "2026-05-19T10:00:00.000Z",
    });

    await saveRuntimeStoreState(state);

    const reloaded = await loadRuntimeStoreState();
    expect(reloaded.atsConnections).toHaveLength(1);
    expect(reloaded.atsConnections[0].provider).toBe("mock_ats");
  });
});
```

- [ ] **Step 2: Run the test and verify it fails**

Run:

```bash
npm test -- src/test/unit/ats-integrations/store-shape.test.ts
```

Expected: FAIL because runtime store lacks ATS collections.

- [ ] **Step 3: Add schema tables**

Modify `src/lib/db/schema.ts` by importing any needed Drizzle helpers already used in the file and adding tables after `evaluationsTable`:

```ts
export const atsConnectionsTable = pgTable("ats_connections", {
  id: text("id").primaryKey(),
  companyId: text("company_id").notNull(),
  provider: text("provider").notNull(),
  status: text("status").notNull(),
  position: integer("position").notNull(),
  payload: jsonb("payload").notNull(),
});

export const atsSyncCursorsTable = pgTable("ats_sync_cursors", {
  id: text("id").primaryKey(),
  companyId: text("company_id").notNull(),
  connectionId: text("connection_id").notNull(),
  provider: text("provider").notNull(),
  resource: text("resource").notNull(),
  updatedAt: text("updated_at").notNull(),
  position: integer("position").notNull(),
  payload: jsonb("payload").notNull(),
});

export const atsExternalJobsTable = pgTable("ats_external_jobs", {
  id: text("id").primaryKey(),
  companyId: text("company_id").notNull(),
  connectionId: text("connection_id").notNull(),
  provider: text("provider").notNull(),
  externalId: text("external_id").notNull(),
  externalUpdatedAt: text("external_updated_at"),
  position: integer("position").notNull(),
  payload: jsonb("payload").notNull(),
});

export const atsExternalCandidatesTable = pgTable("ats_external_candidates", {
  id: text("id").primaryKey(),
  companyId: text("company_id").notNull(),
  connectionId: text("connection_id").notNull(),
  provider: text("provider").notNull(),
  externalId: text("external_id").notNull(),
  externalUpdatedAt: text("external_updated_at"),
  position: integer("position").notNull(),
  payload: jsonb("payload").notNull(),
});

export const atsExternalApplicationsTable = pgTable("ats_external_applications", {
  id: text("id").primaryKey(),
  companyId: text("company_id").notNull(),
  connectionId: text("connection_id").notNull(),
  provider: text("provider").notNull(),
  externalId: text("external_id").notNull(),
  externalUpdatedAt: text("external_updated_at"),
  status: text("status").notNull(),
  position: integer("position").notNull(),
  payload: jsonb("payload").notNull(),
});

export const atsExternalStagesTable = pgTable("ats_external_stages", {
  id: text("id").primaryKey(),
  companyId: text("company_id").notNull(),
  connectionId: text("connection_id").notNull(),
  provider: text("provider").notNull(),
  externalId: text("external_id").notNull(),
  externalJobId: text("external_job_id"),
  position: integer("position").notNull(),
  payload: jsonb("payload").notNull(),
});

export const atsTriggerRulesTable = pgTable("ats_trigger_rules", {
  id: text("id").primaryKey(),
  companyId: text("company_id").notNull(),
  connectionId: text("connection_id").notNull(),
  provider: text("provider").notNull(),
  externalStageId: text("external_stage_id").notNull(),
  position: integer("position").notNull(),
  payload: jsonb("payload").notNull(),
});

export const atsSyncEventsTable = pgTable("ats_sync_events", {
  id: text("id").primaryKey(),
  companyId: text("company_id").notNull(),
  connectionId: text("connection_id").notNull(),
  provider: text("provider").notNull(),
  idempotencyKey: text("idempotency_key").notNull(),
  occurredAt: text("occurred_at").notNull(),
  position: integer("position").notNull(),
  payload: jsonb("payload").notNull(),
});

export const atsWritebackActionsTable = pgTable("ats_writeback_actions", {
  id: text("id").primaryKey(),
  companyId: text("company_id").notNull(),
  connectionId: text("connection_id").notNull(),
  provider: text("provider").notNull(),
  status: text("status").notNull(),
  idempotencyKey: text("idempotency_key").notNull(),
  position: integer("position").notNull(),
  payload: jsonb("payload").notNull(),
});

export const atsWritebackAttemptsTable = pgTable("ats_writeback_attempts", {
  id: text("id").primaryKey(),
  writebackActionId: text("writeback_action_id").notNull(),
  attemptedAt: text("attempted_at").notNull(),
  status: text("status").notNull(),
  position: integer("position").notNull(),
  payload: jsonb("payload").notNull(),
});
```

- [ ] **Step 4: Extend `RuntimeStoreState`**

In `src/lib/db/runtime-store.ts`, import ATS types and schema tables, then add collections:

```ts
import type {
  ATSCanonicalApplication,
  ATSCanonicalCandidate,
  ATSCanonicalJob,
  ATSCanonicalStage,
  ATSConnection,
  ATSSyncCursor,
  ATSSyncEvent,
  ATSTriggerRule,
  ATSWritebackAction,
  ATSWritebackAttempt,
} from "@/domain/ats-integrations/types";
```

Add to `RuntimeStoreState`:

```ts
atsConnections: ATSConnection[];
atsSyncCursors: ATSSyncCursor[];
atsExternalJobs: ATSCanonicalJob[];
atsExternalCandidates: ATSCanonicalCandidate[];
atsExternalApplications: ATSCanonicalApplication[];
atsExternalStages: ATSCanonicalStage[];
atsTriggerRules: ATSTriggerRule[];
atsSyncEvents: ATSSyncEvent[];
atsWritebackActions: ATSWritebackAction[];
atsWritebackAttempts: ATSWritebackAttempt[];
```

Add empty arrays to `memoryState`, `cloneState`, `loadRuntimeStoreState`, `saveRuntimeStoreState`, and `resetRuntimeStoreState`, following the existing payload-table pattern.

- [ ] **Step 5: Generate migration**

Run:

```bash
npm run db:generate
```

Expected: Drizzle creates one new migration file under `src/lib/db/migrations/`.

- [ ] **Step 6: Run focused store test**

Run:

```bash
npm test -- src/test/unit/ats-integrations/store-shape.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/lib/db/schema.ts src/lib/db/runtime-store.ts src/lib/db/migrations src/test/unit/ats-integrations/store-shape.test.ts
git commit -m "feat(ats): persist integration records"
```

---

### Task 3: Adapter Contract And Mock Adapter

**Files:**

- Create: `src/lib/ats-integrations/adapters/types.ts`
- Create: `src/lib/ats-integrations/adapters/mock.ts`
- Create: `src/lib/ats-integrations/registry.ts`
- Test: `src/test/unit/ats-integrations/mock-adapter.test.ts`

- [ ] **Step 1: Write the failing adapter test**

Create `src/test/unit/ats-integrations/mock-adapter.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import { getATSAdapter } from "@/lib/ats-integrations/registry";

describe("mock ATS adapter", () => {
  it("lists deterministic jobs, stages, applications, and candidates", async () => {
    const adapter = getATSAdapter("mock_ats");
    const connection = {
      id: "ats_conn_1",
      companyId: "company_1",
      provider: "mock_ats" as const,
      status: "active" as const,
      displayName: "Mock ATS",
      authMode: "mock" as const,
      secretRef: null,
      externalAccountId: "mock_account",
      lastSyncAt: null,
      lastError: null,
      createdAt: "2026-05-19T10:00:00.000Z",
      updatedAt: "2026-05-19T10:00:00.000Z",
    };

    await expect(adapter.validateConnection({ connection })).resolves.toMatchObject({
      ok: true,
    });

    const jobs = await adapter.listJobs({ connection, cursor: null, limit: 50 });
    expect(jobs.records[0]).toMatchObject({
      externalId: "mock_job_store_associate",
      title: "Store Associate",
    });

    const stages = await adapter.listStages({
      connection,
      externalJobId: "mock_job_store_associate",
    });
    expect(stages.map((stage) => stage.name)).toContain("Breathe Screen");

    const apps = await adapter.listApplications({
      connection,
      cursor: null,
      limit: 50,
    });
    expect(apps.records[0]).toMatchObject({
      externalCandidateId: "mock_candidate_ana",
      externalStageId: "mock_stage_breathe_screen",
    });

    await expect(
      adapter.getCandidate({
        connection,
        externalCandidateId: "mock_candidate_ana",
      }),
    ).resolves.toMatchObject({
      externalId: "mock_candidate_ana",
      fullName: "Ana Martin",
    });
  });
});
```

- [ ] **Step 2: Run the test and verify it fails**

Run:

```bash
npm test -- src/test/unit/ats-integrations/mock-adapter.test.ts
```

Expected: FAIL because adapter registry does not exist.

- [ ] **Step 3: Implement adapter contract**

Create `src/lib/ats-integrations/adapters/types.ts`:

```ts
import type {
  ATSConnection,
  ATSProviderKey,
  ATSRawSnapshot,
  ATSStageCategory,
  ATSWritebackAction,
  ATSWritebackResult,
} from "@/domain/ats-integrations/types";

export type ATSConnectionAuth = {
  connection: ATSConnection;
};

export type ATSConnectionCheck = {
  ok: boolean;
  externalAccountId: string | null;
  message: string;
};

export type ATSSyncInput = {
  connection: ATSConnection;
  cursor: string | null;
  limit: number;
};

export type ATSJobStagesInput = {
  connection: ATSConnection;
  externalJobId: string;
};

export type ATSCandidateLookupInput = {
  connection: ATSConnection;
  externalCandidateId: string;
};

export type ATSSyncPage<TRecord> = {
  records: TRecord[];
  nextCursor: string | null;
  hasMore: boolean;
};

export type ATSProviderJob = {
  externalId: string;
  externalUrl: string | null;
  title: string;
  status: "active" | "archived_external" | "deleted_external";
  externalUpdatedAt: string | null;
  raw: ATSRawSnapshot;
};

export type ATSProviderCandidate = {
  externalId: string;
  externalUrl: string | null;
  fullName: string;
  email: string | null;
  phone: string | null;
  status: "active" | "archived_external" | "deleted_external";
  externalUpdatedAt: string | null;
  raw: ATSRawSnapshot;
};

export type ATSProviderStage = {
  externalId: string;
  externalJobId: string | null;
  name: string;
  category: ATSStageCategory;
  position: number;
  raw: ATSRawSnapshot;
};

export type ATSProviderApplication = {
  externalId: string;
  externalCandidateId: string;
  externalJobId: string | null;
  externalStageId: string | null;
  externalUrl: string | null;
  candidateName: string;
  candidateEmail: string | null;
  candidatePhone: string | null;
  jobTitle: string | null;
  stageName: string | null;
  stageCategory: ATSStageCategory;
  status: "active" | "archived_external" | "deleted_external";
  externalUpdatedAt: string | null;
  raw: ATSRawSnapshot;
};

export type ATSAdapterCapabilities = {
  supportsWebhooks: boolean;
  supportsPolling: boolean;
  supportsCandidateNotes: boolean;
  supportsReportLinks: boolean;
  supportsStageMove: boolean;
  supportsCustomFields: boolean;
  supportsAttachments: boolean;
};

export type ATSAdapter = {
  provider: ATSProviderKey;
  capabilities: ATSAdapterCapabilities;
  validateConnection(input: ATSConnectionAuth): Promise<ATSConnectionCheck>;
  listJobs(input: ATSSyncInput): Promise<ATSSyncPage<ATSProviderJob>>;
  listStages(input: ATSJobStagesInput): Promise<ATSProviderStage[]>;
  listApplications(input: ATSSyncInput): Promise<ATSSyncPage<ATSProviderApplication>>;
  getCandidate(input: ATSCandidateLookupInput): Promise<ATSProviderCandidate | null>;
  writeback(input: ATSWritebackAction): Promise<ATSWritebackResult>;
};
```

- [ ] **Step 4: Implement mock adapter and registry**

Create `src/lib/ats-integrations/adapters/mock.ts` with deterministic arrays for one job, five stages, one candidate, and one application in `Breathe Screen`.

Create `src/lib/ats-integrations/registry.ts`:

```ts
import type { ATSProviderKey } from "@/domain/ats-integrations/types";
import { mockATSAdapter } from "@/lib/ats-integrations/adapters/mock";
import type { ATSAdapter } from "@/lib/ats-integrations/adapters/types";

const adapters: Record<ATSProviderKey, ATSAdapter | null> = {
  mock_ats: mockATSAdapter,
  zoho_recruit: null,
  recruitee: null,
  ashby: null,
  teamtailor: null,
  greenhouse: null,
  lever: null,
  kombo: null,
};

export function getATSAdapter(provider: ATSProviderKey): ATSAdapter {
  const adapter = adapters[provider];

  if (!adapter) {
    throw new Error(`ATS provider ${provider} is not implemented yet.`);
  }

  return adapter;
}
```

- [ ] **Step 5: Run adapter tests**

Run:

```bash
npm test -- src/test/unit/ats-integrations/mock-adapter.test.ts src/test/unit/ats-integrations/types.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/domain/ats-integrations/types.ts src/lib/ats-integrations src/test/unit/ats-integrations/mock-adapter.test.ts
git commit -m "feat(ats): add adapter contract and mock provider"
```

---

### Task 4: Sync Service And Idempotent Events

**Files:**

- Create: `src/lib/ats-integrations/sync.ts`
- Test: `src/test/unit/ats-integrations/sync.test.ts`

- [ ] **Step 1: Write failing sync test**

Create `src/test/unit/ats-integrations/sync.test.ts`:

```ts
import { beforeEach, describe, expect, it } from "vitest";

import { resetRuntimeStoreState, loadRuntimeStoreState, saveRuntimeStoreState } from "@/lib/db/runtime-store";
import { runATSSync } from "@/lib/ats-integrations/sync";

describe("ATS sync", () => {
  beforeEach(async () => {
    await resetRuntimeStoreState();
    const state = await loadRuntimeStoreState();
    state.atsConnections.push({
      id: "ats_conn_1",
      companyId: "company_1",
      provider: "mock_ats",
      status: "active",
      displayName: "Mock ATS",
      authMode: "mock",
      secretRef: null,
      externalAccountId: "mock_account",
      lastSyncAt: null,
      lastError: null,
      createdAt: "2026-05-19T10:00:00.000Z",
      updatedAt: "2026-05-19T10:00:00.000Z",
    });
    await saveRuntimeStoreState(state);
  });

  it("imports external records and creates idempotent sync events", async () => {
    const first = await runATSSync({
      companyId: "company_1",
      connectionId: "ats_conn_1",
      now: "2026-05-19T11:00:00.000Z",
    });
    expect(first.createdEvents).toBeGreaterThan(0);

    const afterFirst = await loadRuntimeStoreState();
    expect(afterFirst.atsExternalJobs).toHaveLength(1);
    expect(afterFirst.atsExternalCandidates).toHaveLength(1);
    expect(afterFirst.atsExternalApplications).toHaveLength(1);
    expect(afterFirst.atsSyncEvents.some((event) => event.eventType === "application_seen")).toBe(true);

    const second = await runATSSync({
      companyId: "company_1",
      connectionId: "ats_conn_1",
      now: "2026-05-19T11:01:00.000Z",
    });
    expect(second.createdEvents).toBe(0);
  });
});
```

- [ ] **Step 2: Run failing sync test**

Run:

```bash
npm test -- src/test/unit/ats-integrations/sync.test.ts
```

Expected: FAIL because `runATSSync` does not exist.

- [ ] **Step 3: Implement sync helpers**

Create `src/lib/ats-integrations/sync.ts` with:

- `canonicalRecordId(prefix, connectionId, externalId)`
- `upsertByProviderKey(records, record)`
- `eventIdempotencyKey(...)`
- `appendSyncEventOnce(state, event)`
- `runATSSync({ companyId, connectionId, now })`

Use `getATSAdapter(connection.provider)` and the adapter's `listJobs`, `listStages`, `listApplications`, and `getCandidate` methods.

Return:

```ts
export type RunATSSyncResult = {
  importedJobs: number;
  importedCandidates: number;
  importedApplications: number;
  importedStages: number;
  createdEvents: number;
};
```

- [ ] **Step 4: Run sync tests**

Run:

```bash
npm test -- src/test/unit/ats-integrations/sync.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/ats-integrations/sync.ts src/test/unit/ats-integrations/sync.test.ts
git commit -m "feat(ats): sync provider records idempotently"
```

---

### Task 5: Trigger Rules

**Files:**

- Create: `src/lib/ats-integrations/triggers.ts`
- Test: `src/test/unit/ats-integrations/triggers.test.ts`

- [ ] **Step 1: Write failing trigger test**

Create `src/test/unit/ats-integrations/triggers.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import { evaluateATSTriggerRules } from "@/lib/ats-integrations/triggers";

describe("ATS trigger rules", () => {
  it("matches enabled rules by connection, job, and stage", () => {
    const result = evaluateATSTriggerRules({
      rules: [
        {
          id: "rule_1",
          companyId: "company_1",
          connectionId: "ats_conn_1",
          provider: "mock_ats",
          name: "Screen candidates",
          enabled: true,
          externalJobId: "mock_job_store_associate",
          externalStageId: "mock_stage_breathe_screen",
          actions: ["import_candidate", "prepare_interview", "queue_interview"],
          requiresRecruiterApproval: true,
          createdAt: "2026-05-19T10:00:00.000Z",
          updatedAt: "2026-05-19T10:00:00.000Z",
        },
      ],
      event: {
        id: "ats_evt_1",
        companyId: "company_1",
        connectionId: "ats_conn_1",
        provider: "mock_ats",
        eventType: "application_seen",
        externalObjectType: "application",
        externalObjectId: "mock_app_1",
        externalJobId: "mock_job_store_associate",
        externalCandidateId: "mock_candidate_ana",
        externalStageId: "mock_stage_breathe_screen",
        occurredAt: "2026-05-19T10:05:00.000Z",
        processedAt: null,
        idempotencyKey: "key",
        payload: {},
      },
    });

    expect(result).toEqual([
      {
        ruleId: "rule_1",
        actions: ["import_candidate", "prepare_interview", "queue_interview"],
        requiresRecruiterApproval: true,
      },
    ]);
  });
});
```

- [ ] **Step 2: Implement trigger matching**

Create `src/lib/ats-integrations/triggers.ts`:

```ts
import type { ATSSyncEvent, ATSTriggerAction, ATSTriggerRule } from "@/domain/ats-integrations/types";

export type ATSTriggerMatch = {
  ruleId: string;
  actions: ATSTriggerAction[];
  requiresRecruiterApproval: boolean;
};

export function evaluateATSTriggerRules(input: {
  rules: ATSTriggerRule[];
  event: ATSSyncEvent;
}): ATSTriggerMatch[] {
  return input.rules
    .filter((rule) => {
      if (!rule.enabled) return false;
      if (rule.companyId !== input.event.companyId) return false;
      if (rule.connectionId !== input.event.connectionId) return false;
      if (rule.provider !== input.event.provider) return false;
      if (rule.externalStageId !== input.event.externalStageId) return false;
      if (rule.externalJobId && rule.externalJobId !== input.event.externalJobId) return false;
      return true;
    })
    .map((rule) => ({
      ruleId: rule.id,
      actions: rule.actions,
      requiresRecruiterApproval: rule.requiresRecruiterApproval,
    }));
}
```

- [ ] **Step 3: Run trigger tests**

Run:

```bash
npm test -- src/test/unit/ats-integrations/triggers.test.ts
```

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/lib/ats-integrations/triggers.ts src/test/unit/ats-integrations/triggers.test.ts
git commit -m "feat(ats): match stage trigger rules"
```

---

### Task 6: Writeback Queue

**Files:**

- Create: `src/lib/ats-integrations/writeback.ts`
- Test: `src/test/unit/ats-integrations/writeback.test.ts`

- [ ] **Step 1: Write failing writeback test**

Create `src/test/unit/ats-integrations/writeback.test.ts`:

```ts
import { beforeEach, describe, expect, it } from "vitest";

import { enqueueATSWriteback, processATSWritebackAction } from "@/lib/ats-integrations/writeback";
import { loadRuntimeStoreState, resetRuntimeStoreState, saveRuntimeStoreState } from "@/lib/db/runtime-store";

describe("ATS writeback queue", () => {
  beforeEach(async () => {
    await resetRuntimeStoreState();
    const state = await loadRuntimeStoreState();
    state.atsConnections.push({
      id: "ats_conn_1",
      companyId: "company_1",
      provider: "mock_ats",
      status: "active",
      displayName: "Mock ATS",
      authMode: "mock",
      secretRef: null,
      externalAccountId: "mock_account",
      lastSyncAt: null,
      lastError: null,
      createdAt: "2026-05-19T10:00:00.000Z",
      updatedAt: "2026-05-19T10:00:00.000Z",
    });
    await saveRuntimeStoreState(state);
  });

  it("enqueues idempotently and records provider attempts", async () => {
    const queued = await enqueueATSWriteback({
      companyId: "company_1",
      connectionId: "ats_conn_1",
      provider: "mock_ats",
      actionType: "candidate_note",
      targetExternalCandidateId: "mock_candidate_ana",
      targetExternalApplicationId: "mock_app_1",
      targetExternalJobId: "mock_job_store_associate",
      targetExternalStageId: null,
      sourceObjectType: "evaluation",
      sourceObjectId: "eval_1",
      payload: { body: "Breathe interview summary" },
      now: "2026-05-19T12:00:00.000Z",
    });

    const duplicate = await enqueueATSWriteback({
      companyId: "company_1",
      connectionId: "ats_conn_1",
      provider: "mock_ats",
      actionType: "candidate_note",
      targetExternalCandidateId: "mock_candidate_ana",
      targetExternalApplicationId: "mock_app_1",
      targetExternalJobId: "mock_job_store_associate",
      targetExternalStageId: null,
      sourceObjectType: "evaluation",
      sourceObjectId: "eval_1",
      payload: { body: "Breathe interview summary" },
      now: "2026-05-19T12:00:01.000Z",
    });

    expect(duplicate.id).toBe(queued.id);

    await processATSWritebackAction({
      writebackActionId: queued.id,
      now: "2026-05-19T12:01:00.000Z",
    });

    const state = await loadRuntimeStoreState();
    expect(state.atsWritebackActions).toHaveLength(1);
    expect(state.atsWritebackActions[0].status).toBe("succeeded");
    expect(state.atsWritebackAttempts).toHaveLength(1);
  });
});
```

- [ ] **Step 2: Implement writeback queue**

Create `src/lib/ats-integrations/writeback.ts`:

- `buildATSWritebackIdempotencyKey(input)`
- `enqueueATSWriteback(input)`
- `processATSWritebackAction({ writebackActionId, now })`

Use `getATSAdapter(action.provider).writeback(action)` and append one `ATSWritebackAttempt` for every dispatch.

- [ ] **Step 3: Run writeback tests**

Run:

```bash
npm test -- src/test/unit/ats-integrations/writeback.test.ts
```

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/lib/ats-integrations/writeback.ts src/test/unit/ats-integrations/writeback.test.ts
git commit -m "feat(ats): queue provider writebacks"
```

---

### Task 7: Zoho Recruit Mapping And Adapter

**Files:**

- Create: `src/lib/ats-integrations/zoho/client.ts`
- Create: `src/lib/ats-integrations/zoho/mappers.ts`
- Create: `src/lib/ats-integrations/adapters/zoho-recruit.ts`
- Modify: `src/lib/ats-integrations/registry.ts`
- Test: `src/test/unit/ats-integrations/zoho-mappers.test.ts`

- [ ] **Step 1: Write Zoho mapper tests**

Create `src/test/unit/ats-integrations/zoho-mappers.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import {
  mapZohoCandidateToProviderCandidate,
  mapZohoCandidateToProviderApplication,
  mapZohoJobOpeningToProviderJob,
} from "@/lib/ats-integrations/zoho/mappers";

describe("Zoho Recruit mappers", () => {
  it("maps job openings into provider jobs", () => {
    expect(
      mapZohoJobOpeningToProviderJob({
        id: "58431000000012345",
        Posting_Title: "Store Associate",
        Job_Opening_Status: "In-progress",
        Modified_Time: "2026-05-19T10:00:00+02:00",
      }),
    ).toMatchObject({
      externalId: "58431000000012345",
      title: "Store Associate",
      status: "active",
    });
  });

  it("maps candidates into provider candidates and applications", () => {
    const zohoCandidate = {
      id: "58431000000054321",
      Full_Name: "Ana Martin",
      Email: "ana@example.com",
      Mobile: "+34600000000",
      Candidate_Status: "Breathe Screen",
      Associated_Tags: [],
      Modified_Time: "2026-05-19T10:05:00+02:00",
    };

    expect(mapZohoCandidateToProviderCandidate(zohoCandidate)).toMatchObject({
      externalId: "58431000000054321",
      fullName: "Ana Martin",
      email: "ana@example.com",
    });

    expect(
      mapZohoCandidateToProviderApplication({
        candidate: zohoCandidate,
        fallbackJobId: "zoho_job_unknown",
        fallbackJobTitle: "Unknown Zoho Job",
      }),
    ).toMatchObject({
      externalCandidateId: "58431000000054321",
      externalStageId: "Breathe Screen",
      stageName: "Breathe Screen",
      stageCategory: "screening",
    });
  });
});
```

- [ ] **Step 2: Implement mappers and client**

Create `src/lib/ats-integrations/zoho/mappers.ts` with defensive helpers:

- `stringField(record, key)`
- `mapZohoStatusToStageCategory(status)`
- `mapZohoJobOpeningToProviderJob(record)`
- `mapZohoCandidateToProviderCandidate(record)`
- `mapZohoCandidateToProviderApplication({ candidate, fallbackJobId, fallbackJobTitle })`

Create `src/lib/ats-integrations/zoho/client.ts`:

- `getZohoRecruitConfigFromEnv()`
- `createZohoRecruitClient(connection)`
- `zohoRecruitRequest(path, init)`

Do not log access tokens. Throw errors with status code and sanitized response body.

- [ ] **Step 3: Implement Zoho adapter**

Create `src/lib/ats-integrations/adapters/zoho-recruit.ts`:

- `validateConnection`: call `GET /recruit/v2/Job_Openings?per_page=1`; return `ok: true` when Zoho returns a `data` array and `externalAccountId` from the connection or `"zoho_recruit"`.
- `listJobs`: fetch `Job_Openings`.
- `listStages`: derive stages from configured default statuses or seen candidate statuses.
- `listApplications`: fetch `Candidates` and map candidate status to application.
- `getCandidate`: fetch `Candidates/{id}`.
- `writeback`: support `candidate_note`, `status_comment`, and `application_stage_move` using available Zoho endpoints; return `skipped` with explanation when the configured free account does not support a specific action.

Register `zohoRecruitAdapter` in `src/lib/ats-integrations/registry.ts`.

- [ ] **Step 4: Run Zoho unit tests**

Run:

```bash
npm test -- src/test/unit/ats-integrations/zoho-mappers.test.ts
```

Expected: PASS without real Zoho network calls.

- [ ] **Step 5: Commit**

```bash
git add src/lib/ats-integrations/zoho src/lib/ats-integrations/adapters/zoho-recruit.ts src/lib/ats-integrations/registry.ts src/test/unit/ats-integrations/zoho-mappers.test.ts
git commit -m "feat(ats): add Zoho Recruit adapter"
```

---

### Task 8: Admin Settings Surface

**Files:**

- Create: `src/app/(recruiter)/settings/integrations/ats/page.tsx`
- Create: `src/app/(recruiter)/settings/integrations/ats/actions.ts`
- Create: `src/app/(recruiter)/settings/integrations/ats/ats-settings-workspace.tsx`
- Modify: `src/lib/audit/types.ts`
- Test: `src/test/integration/recruiter/ats-settings-page.test.tsx`

- [ ] **Step 1: Write failing page test**

Create `src/test/integration/recruiter/ats-settings-page.test.tsx` following the existing settings page mock pattern:

```ts
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import ATSSettingsPage from "@/app/(recruiter)/settings/integrations/ats/page";

vi.mock("@/lib/auth/server", () => ({
  requireAuthenticatedRecruiter: vi.fn(async () => ({
    user: { id: "user_1", displayName: "Recruiter Admin", email: "admin@example.com", authProvider: "password" },
    company: { id: "company_1", slug: "nacar", name: "Nacar", defaultWorkspaceKey: null },
    membership: { id: "membership_1", companyId: "company_1", userId: "user_1", role: "owner", workspaceKey: null },
  })),
}));

vi.mock("@/lib/team-access", () => ({
  recruiterCanManageTeams: vi.fn(() => true),
}));

vi.mock("@/lib/ats-integrations/connections", () => ({
  getATSAdminSnapshot: vi.fn(async () => ({
    connections: [],
    triggerRules: [],
    availableProviders: [
      { provider: "mock_ats", label: "Mock ATS", implemented: true },
      { provider: "zoho_recruit", label: "Zoho Recruit", implemented: true },
    ],
  })),
}));

describe("ATS settings page", () => {
  it("renders admin controls for ATS integrations", async () => {
    render(await ATSSettingsPage());

    expect(screen.getByRole("heading", { name: /ATS integrations/i })).toBeInTheDocument();
    expect(screen.getByText(/Zoho Recruit/i)).toBeInTheDocument();
    expect(screen.getByText(/Stage triggers/i)).toBeInTheDocument();
    expect(screen.getByText(/Writeback policy/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Implement admin snapshot helper**

Create `src/lib/ats-integrations/connections.ts`:

- `getATSAdminSnapshot(recruiter)`
- `createOrUpdateATSConnectionActionModel(...)`
- `buildDefaultZohoDemoConnection(companyId, now)`
- `listATSAvailableProviders()`

- [ ] **Step 3: Implement page and workspace**

Use existing `Card`, `StatusBadge`, `Button`, `Input`, and `Select` components. Keep UI dense and operational:

- connection status cards,
- provider selector,
- manual sync button,
- stage trigger list,
- writeback policy section,
- last sync/error details.

Do not add marketing copy or a hero.

- [ ] **Step 4: Add actions**

In `actions.ts`, implement server actions:

- `createMockATSConnectionAction`
- `createZohoEnvConnectionAction`
- `runManualATSSyncAction`
- `saveATSTriggerRuleAction`
- `saveATSWritebackPolicyAction`, storing the policy as a provider-neutral config payload on the connection record.

Each action must:

- require authenticated recruiter,
- require admin/owner permissions,
- append an audit event,
- call `revalidatePath("/settings/integrations/ats")`.

- [ ] **Step 5: Run admin integration test**

Run:

```bash
npm test -- src/test/integration/recruiter/ats-settings-page.test.tsx
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add 'src/app/(recruiter)/settings/integrations/ats' src/lib/ats-integrations/connections.ts src/lib/audit/types.ts src/test/integration/recruiter/ats-settings-page.test.tsx
git commit -m "feat(ats): add admin integration settings"
```

---

### Task 9: Webhook Route Scaffold

**Files:**

- Create: `src/app/api/ats/webhooks/[provider]/route.ts`
- Test: `src/test/integration/ats-webhook-route.test.ts`

- [ ] **Step 1: Write webhook route test**

Create `src/test/integration/ats-webhook-route.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import { POST } from "@/app/api/ats/webhooks/[provider]/route";

describe("ATS webhook route", () => {
  it("rejects unsupported providers", async () => {
    const response = await POST(
      new Request("http://test.local/api/ats/webhooks/unknown", {
        method: "POST",
        body: JSON.stringify({ id: "evt_1" }),
      }),
      { params: Promise.resolve({ provider: "unknown" }) },
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: "Unsupported ATS provider.",
    });
  });

  it("accepts known providers as a stored no-op scaffold", async () => {
    const response = await POST(
      new Request("http://test.local/api/ats/webhooks/mock_ats", {
        method: "POST",
        body: JSON.stringify({ id: "evt_1" }),
      }),
      { params: Promise.resolve({ provider: "mock_ats" }) },
    );

    expect(response.status).toBe(202);
  });
});
```

- [ ] **Step 2: Implement route**

Create `src/app/api/ats/webhooks/[provider]/route.ts`:

```ts
import { NextResponse } from "next/server";

import { isATSProviderKey } from "@/domain/ats-integrations/types";

type ATSWebhookRouteContext = {
  params: Promise<{ provider: string }>;
};

export async function POST(request: Request, context: ATSWebhookRouteContext) {
  const { provider } = await context.params;

  if (!isATSProviderKey(provider)) {
    return NextResponse.json({ error: "Unsupported ATS provider." }, { status: 400 });
  }

  const payload = await request.json().catch(() => null);

  if (!payload || typeof payload !== "object") {
    return NextResponse.json({ error: "ATS webhook payload must be valid JSON." }, { status: 400 });
  }

  return NextResponse.json(
    {
      status: "accepted",
      provider,
    },
    { status: 202 },
  );
}
```

This task deliberately stores no raw webhook events. It reserves the route and validates provider routing without claiming full webhook support.

- [ ] **Step 3: Run route test**

Run:

```bash
npm test -- src/test/integration/ats-webhook-route.test.ts
```

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/ats/webhooks/[provider]/route.ts src/test/integration/ats-webhook-route.test.ts
git commit -m "feat(ats): add webhook intake scaffold"
```

---

### Task 10: Breathe Workflow And Evaluation Writeback Hooks

**Files:**

- Create: `src/lib/ats-integrations/workflow-requests.ts`
- Modify: `src/lib/db/schema.ts`
- Modify: `src/lib/db/runtime-store.ts`
- Modify: `src/lib/public-apply-submissions.ts`
- Create: generated Drizzle migration under `src/lib/db/migrations/`
- Test: `src/test/unit/ats-integrations/workflow-requests.test.ts`

- [ ] **Step 1: Write workflow request and evaluation hook tests**

Create `src/test/unit/ats-integrations/workflow-requests.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import type { CandidateEvaluation } from "@/domain/evaluations/types";
import {
  buildATSWorkflowRequestsForEvent,
  enqueueATSWritebacksForEvaluation,
} from "@/lib/ats-integrations/workflow-requests";

describe("ATS workflow requests", () => {
  it("creates queued workflow requests from trigger matches", () => {
    const requests = buildATSWorkflowRequestsForEvent({
      event: {
        id: "ats_evt_1",
        companyId: "company_1",
        connectionId: "ats_conn_1",
        provider: "mock_ats",
        eventType: "application_seen",
        externalObjectType: "application",
        externalObjectId: "mock_app_1",
        externalJobId: "mock_job_store_associate",
        externalCandidateId: "mock_candidate_ana",
        externalStageId: "mock_stage_breathe_screen",
        occurredAt: "2026-05-19T10:00:00.000Z",
        processedAt: null,
        idempotencyKey: "event_key",
        payload: {},
      },
      matches: [
        {
          ruleId: "rule_1",
          actions: ["import_candidate", "prepare_interview", "queue_interview"],
          requiresRecruiterApproval: true,
        },
      ],
      now: "2026-05-19T10:01:00.000Z",
    });

    expect(requests).toEqual([
      {
        id: "ats_workflow_ats_evt_1_rule_1",
        companyId: "company_1",
        atsSyncEventId: "ats_evt_1",
        atsTriggerRuleId: "rule_1",
        externalApplicationId: "mock_app_1",
        internalCandidateId: null,
        internalApplicationId: null,
        requestedActions: ["import_candidate", "prepare_interview", "queue_interview"],
        requiresRecruiterApproval: true,
        status: "queued",
        createdAt: "2026-05-19T10:01:00.000Z",
        updatedAt: "2026-05-19T10:01:00.000Z",
      },
    ]);
  });

  it("enqueues writeback actions for linked ATS applications", () => {
    const evaluation: CandidateEvaluation = {
      id: "eval_1",
      companyId: "company_1",
      interviewRunId: "run_1",
      generatedAt: "2026-05-19T11:00:00.000Z",
      finalNumericScore: 86,
      finalScoreState: "Great",
      blocks: [],
      weightConfigSnapshot: {
        mandatoryRequirementWeight: 0.8,
        optionalRequirementWeight: 0.2,
        essentialBlockWeight: 0.45,
        technicalBlockWeight: 0.45,
        interpersonalBlockWeight: 0.1,
      },
      fitClassification: "strong_fit",
    };

    const actions = enqueueATSWritebacksForEvaluation({
      evaluation,
      interviewRun: {
        id: "run_1",
        companyId: "company_1",
        candidateId: "candidate_1",
        applicationId: "app_1",
        jobId: "job_1",
        interviewPreparationId: null,
        provider: "happyrobot",
        status: "completed",
        pipelineStage: "interviewed",
        dispatch: {
          dispatchedAt: null,
          providerCallId: null,
          providerAgentId: null,
          providerSessionId: null,
          outboundNumber: null,
        },
        metadata: {
          selectedLanguage: "es",
          candidateTimezone: {
            timezone: null,
            localDateTime: null,
            utcDateTime: null,
          },
          disclosedWithAi: true,
          disclosureText: "",
          callbackRequestedAt: null,
          failureReason: null,
          providerOutcomeLabel: null,
        },
        trace: {
          createdAt: "2026-05-19T10:00:00.000Z",
          normalizedAt: null,
          initiatedAt: null,
          completedAt: "2026-05-19T11:00:00.000Z",
          lastEventAt: "2026-05-19T11:00:00.000Z",
        },
        artifacts: {
          recordingUrl: null,
          transcriptUrl: null,
          transcriptAssetRef: null,
          providerPayloadSnapshotRef: null,
          recordingDurationSeconds: null,
        },
      },
      atsApplications: [
        {
          id: "ats_app_1",
          companyId: "company_1",
          connectionId: "ats_conn_1",
          provider: "mock_ats",
          externalId: "mock_app_1",
          externalCandidateId: "mock_candidate_ana",
          externalJobId: "mock_job_store_associate",
          externalStageId: "mock_stage_breathe_screen",
          externalUrl: null,
          internalCandidateId: "candidate_1",
          internalApplicationId: "app_1",
          internalJobId: "job_1",
          candidateName: "Ana Martin",
          candidateEmail: "ana@example.com",
          candidatePhone: "+34600000000",
          jobTitle: "Store Associate",
          stageName: "Breathe Screen",
          stageCategory: "screening",
          status: "active",
          externalUpdatedAt: "2026-05-19T10:00:00.000Z",
          lastSeenAt: "2026-05-19T10:00:00.000Z",
          rawSnapshot: {},
        },
      ],
      existingActions: [],
      now: "2026-05-19T11:01:00.000Z",
    });

    expect(actions).toHaveLength(1);
    expect(actions[0]).toMatchObject({
      provider: "mock_ats",
      actionType: "candidate_note",
      targetExternalCandidateId: "mock_candidate_ana",
      sourceObjectType: "evaluation",
      sourceObjectId: "eval_1",
      status: "queued",
    });
  });
});
```

- [ ] **Step 2: Run the test and verify it fails**

Run:

```bash
npm test -- src/test/unit/ats-integrations/workflow-requests.test.ts
```

Expected: FAIL because `workflow-requests.ts` does not exist.

- [ ] **Step 3: Add workflow request storage**

Add this type to `src/domain/ats-integrations/types.ts`:

```ts
export type ATSWorkflowRequest = {
  id: EntityId;
  companyId: EntityId;
  atsSyncEventId: EntityId;
  atsTriggerRuleId: EntityId;
  externalApplicationId: string;
  internalCandidateId: EntityId | null;
  internalApplicationId: EntityId | null;
  requestedActions: ATSTriggerAction[];
  requiresRecruiterApproval: boolean;
  status: "queued" | "completed" | "skipped" | "error";
  createdAt: ISODateTimeString;
  updatedAt: ISODateTimeString;
};
```

Add `ats_workflow_requests` to `src/lib/db/schema.ts`:

```ts
export const atsWorkflowRequestsTable = pgTable("ats_workflow_requests", {
  id: text("id").primaryKey(),
  companyId: text("company_id").notNull(),
  atsSyncEventId: text("ats_sync_event_id").notNull(),
  atsTriggerRuleId: text("ats_trigger_rule_id").notNull(),
  status: text("status").notNull(),
  position: integer("position").notNull(),
  payload: jsonb("payload").notNull(),
});
```

Add `atsWorkflowRequests: ATSWorkflowRequest[]` to `RuntimeStoreState`, `memoryState`, `cloneState`, `loadRuntimeStoreState`, `saveRuntimeStoreState`, and `resetRuntimeStoreState`.

- [ ] **Step 4: Implement workflow request helpers**

Create `src/lib/ats-integrations/workflow-requests.ts`:

```ts
import type { ATSCanonicalApplication, ATSSyncEvent, ATSWorkflowRequest, ATSWritebackAction } from "@/domain/ats-integrations/types";
import type { CandidateEvaluation } from "@/domain/evaluations/types";
import type { InterviewRun } from "@/domain/interviews/types";
import type { ATSTriggerMatch } from "@/lib/ats-integrations/triggers";

export function buildATSWorkflowRequestsForEvent(input: {
  event: ATSSyncEvent;
  matches: ATSTriggerMatch[];
  now: string;
}): ATSWorkflowRequest[] {
  return input.matches.map((match) => ({
    id: `ats_workflow_${input.event.id}_${match.ruleId}`,
    companyId: input.event.companyId,
    atsSyncEventId: input.event.id,
    atsTriggerRuleId: match.ruleId,
    externalApplicationId: input.event.externalObjectId,
    internalCandidateId: null,
    internalApplicationId: null,
    requestedActions: match.actions,
    requiresRecruiterApproval: match.requiresRecruiterApproval,
    status: "queued",
    createdAt: input.now,
    updatedAt: input.now,
  }));
}

export function enqueueATSWritebacksForEvaluation(input: {
  evaluation: CandidateEvaluation;
  interviewRun: InterviewRun;
  atsApplications: ATSCanonicalApplication[];
  existingActions: ATSWritebackAction[];
  now: string;
}): ATSWritebackAction[] {
  const linkedApplication = input.atsApplications.find(
    (application) =>
      application.internalApplicationId === input.interviewRun.applicationId ||
      application.internalCandidateId === input.interviewRun.candidateId,
  );

  if (!linkedApplication) {
    return [];
  }

  const idempotencyKey = [
    linkedApplication.connectionId,
    linkedApplication.externalId,
    "evaluation",
    input.evaluation.id,
    "candidate_note",
  ].join(":");

  if (input.existingActions.some((action) => action.idempotencyKey === idempotencyKey)) {
    return [];
  }

  return [
    {
      id: `ats_writeback_${idempotencyKey.replace(/[^a-zA-Z0-9]+/g, "_")}`,
      companyId: input.evaluation.companyId,
      connectionId: linkedApplication.connectionId,
      provider: linkedApplication.provider,
      actionType: "candidate_note",
      targetExternalCandidateId: linkedApplication.externalCandidateId,
      targetExternalApplicationId: linkedApplication.externalId,
      targetExternalJobId: linkedApplication.externalJobId,
      targetExternalStageId: null,
      sourceObjectType: "evaluation",
      sourceObjectId: input.evaluation.id,
      status: "queued",
      idempotencyKey,
      payload: {
        summary: `${input.evaluation.finalScoreState}: ${input.evaluation.finalNumericScore ?? "Pending"}`,
        fitClassification: input.evaluation.fitClassification,
      },
      createdAt: input.now,
      updatedAt: input.now,
    },
  ];
}
```

- [ ] **Step 5: Hook evaluation generation**

In `src/lib/public-apply-submissions.ts`, inside `generateEvaluationForCompletedRun`, after the evaluation is inserted into `input.state.evaluations`, call `enqueueATSWritebacksForEvaluation` and append any returned actions to `input.state.atsWritebackActions`.

Use this import:

```ts
import { enqueueATSWritebacksForEvaluation } from "@/lib/ats-integrations/workflow-requests";
```

Use this call:

```ts
const writebackActions = enqueueATSWritebacksForEvaluation({
  evaluation,
  interviewRun: snapshot.interviewRun,
  atsApplications: input.state.atsExternalApplications,
  existingActions: input.state.atsWritebackActions,
  now: generatedAt.toISOString(),
});

input.state.atsWritebackActions.push(...writebackActions);
```

- [ ] **Step 6: Generate migration**

Run:

```bash
npm run db:generate
```

Expected: Drizzle creates a migration that adds `ats_workflow_requests`.

- [ ] **Step 7: Run focused tests**

Run:

```bash
npm test -- src/test/unit/ats-integrations/workflow-requests.test.ts src/test/unit/ats-integrations/writeback.test.ts
```

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src/domain/ats-integrations/types.ts src/lib/db/schema.ts src/lib/db/runtime-store.ts src/lib/db/migrations src/lib/ats-integrations/workflow-requests.ts src/lib/public-apply-submissions.ts src/test/unit/ats-integrations/workflow-requests.test.ts
git commit -m "feat(ats): connect triggers and evaluation writeback"
```

---

### Task 11: Documentation And Full Verification

**Files:**

- Modify: `docs/domain-boundaries.md`

- [ ] **Step 1: Update domain boundaries**

Add an ATS section to `docs/domain-boundaries.md`:

```md
- `src/domain/ats-integrations`
  Provider-neutral ATS connections, external records, sync events, trigger rules,
  and writeback actions. Provider-specific API fields belong under
  `src/lib/ats-integrations/adapters/*` or `src/lib/ats-integrations/zoho/*`.
```

Add boundary rules:

```md
- Keep ATS provider fields out of product candidate, job, interview, and
  evaluation entities.
- Treat ATS sync/writeback as asynchronous and auditable; do not make public
  apply or interview runtime depend on live ATS availability.
```

- [ ] **Step 2: Run focused ATS test suite**

Run:

```bash
npm test -- src/test/unit/ats-integrations src/test/integration/recruiter/ats-settings-page.test.tsx src/test/integration/ats-webhook-route.test.ts
```

Expected: PASS.

- [ ] **Step 3: Run existing affected tests**

Run:

```bash
npm test -- src/test/unit/domain-boundaries.test.ts src/test/integration/recruiter/settings-page.test.tsx src/test/unit/settings/actions.test.ts src/test/unit/evaluation-summary.test.ts
```

Expected: PASS.

- [ ] **Step 4: Run full unit/integration suite**

Run:

```bash
npm test
```

Expected: PASS.

- [ ] **Step 5: Commit docs and verification fixes**

```bash
git add docs/domain-boundaries.md src/test src/lib src/domain src/app
git commit -m "docs(ats): document integration boundaries"
```

Only include files that changed in this task. Do not stage unrelated files.

---

## Self-Review Checklist

- [ ] Canonical types contain no Zoho-specific fields.
- [ ] Provider-specific parsing lives under adapter/Zoho files.
- [ ] `mock_ats` can run the demo path without external services.
- [ ] `zoho_recruit` is registered but all unit tests avoid real network calls.
- [ ] Sync is idempotent by provider, connection, object kind, external ID, and external update timestamp.
- [ ] Trigger matching is configurable per company, connection, job, and stage/status.
- [ ] Writeback is queued, idempotent, attempted through adapters, and auditable.
- [ ] Admin actions require recruiter auth and admin/owner permissions.
- [ ] Existing candidate/interview/evaluation domains are touched only through explicit hooks.
- [ ] Tests cover the new layer plus affected existing settings/evaluation paths.
