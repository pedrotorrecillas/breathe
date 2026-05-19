"use client";

import { useMemo, useState } from "react";

import type {
  ATSAdminSnapshot,
  ATSAvailableProvider,
} from "@/lib/ats-integrations/connections";
import { stageMappingValueForExternalStage } from "@/lib/ats-integrations/stage-mappings";
import type {
  ATSInternalStageKey,
  ATSWritebackPolicy,
} from "@/domain/ats-integrations/types";

import {
  createMockATSConnectionAction,
  createZohoEnvConnectionAction,
  configureZohoDemoDefaultsAction,
  approveATSWorkflowRequestAction,
  processATSWritebackActionAction,
  runManualATSSyncAction,
  saveATSConnectionStatusAction,
  saveATSSyncModeAction,
  saveATSTriggerRuleAction,
  saveATSWritebackPolicyAction,
  testATSConnectionAction,
} from "./actions";

function providerLabel(providers: ATSAvailableProvider[], provider: string) {
  return (
    providers.find((item) => item.provider === provider)?.label ?? provider
  );
}

function providerCapabilities(
  providers: ATSAvailableProvider[],
  provider: string,
) {
  return providers.find((item) => item.provider === provider)?.capabilities;
}

function syncModeOptions(input: {
  capabilities: ReturnType<typeof providerCapabilities>;
}) {
  const options = [{ value: "manual", label: "Manual" }];

  if (input.capabilities?.supportsPolling) {
    options.push({ value: "scheduled", label: "Scheduled polling" });
  }

  if (
    input.capabilities?.supportsWebhooks &&
    input.capabilities.supportsPolling
  ) {
    options.push({
      value: "webhook_plus_polling",
      label: "Webhook plus polling",
    });
  }

  return options;
}

function stageOptionLabel(input: {
  stage: ATSAdminSnapshot["externalStages"][number];
  jobs: ATSAdminSnapshot["externalJobs"];
}) {
  const job = input.jobs.find(
    (item) =>
      item.connectionId === input.stage.connectionId &&
      item.externalId === input.stage.externalJobId,
  );

  return job
    ? `${input.stage.name} · ${job.title}`
    : `${input.stage.name} · ${input.stage.externalId}`;
}

function stageOptionValue(stage: ATSAdminSnapshot["externalStages"][number]) {
  return stageMappingValueForExternalStage({
    externalJobId: stage.externalJobId,
    externalStageId: stage.externalId,
  });
}

function selectedStageMappingValue(input: {
  value: string | null | undefined;
  stages: ATSAdminSnapshot["externalStages"];
}) {
  if (!input.value) {
    return "";
  }

  if (input.stages.some((stage) => stageOptionValue(stage) === input.value)) {
    return input.value;
  }

  const legacyStage = input.stages.find(
    (stage) => stage.externalId === input.value,
  );

  return legacyStage ? stageOptionValue(legacyStage) : input.value;
}

function latestWritebackAttempt(input: {
  actionId: string;
  attempts: ATSAdminSnapshot["writebackAttempts"];
}) {
  return input.attempts
    .filter((attempt) => attempt.writebackActionId === input.actionId)
    .sort(
      (left, right) =>
        new Date(right.attemptedAt).getTime() -
        new Date(left.attemptedAt).getTime(),
    )[0];
}

function applicationStageLabel(
  application: ATSAdminSnapshot["externalApplications"][number],
) {
  if (application.jobTitle && application.stageName) {
    return `${application.jobTitle} · ${application.stageName}`;
  }

  if (application.jobTitle) {
    return application.jobTitle;
  }

  return application.stageName ?? application.externalStageId ?? "No stage";
}

const zohoDemoTriggerStageId = "Breathe Screen";
const zohoDemoWritebackStageId = "Interview Completed";
const zohoDemoTriggerActions = [
  "import_candidate",
  "prepare_interview",
  "queue_interview",
];

function zohoDemoTriggerReady(input: {
  snapshot: ATSAdminSnapshot;
  connectionId: string | null;
}) {
  return input.snapshot.triggerRules.some(
    (rule) =>
      rule.provider === "zoho_recruit" &&
      rule.enabled &&
      (!input.connectionId || rule.connectionId === input.connectionId) &&
      rule.externalStageId === zohoDemoTriggerStageId &&
      zohoDemoTriggerActions.every((action) =>
        rule.actions.includes(action as (typeof rule.actions)[number]),
      ),
  );
}

function zohoDemoWritebackReady(
  connection: ATSAdminSnapshot["connections"][number] | null,
) {
  const policy = connection?.writebackPolicy;

  return Boolean(
    policy &&
      policy.reportMode !== "disabled" &&
      policy.moveToExternalStageId === zohoDemoWritebackStageId &&
      policy.requiresRecruiterReview === false,
  );
}

function readinessStatusClass(isReady: boolean) {
  return isReady
    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
    : "border-amber-200 bg-amber-50 text-amber-800";
}

const defaultWritebackPolicy: ATSWritebackPolicy = {
  reportMode: "candidate_note",
  moveToExternalStageId: null,
  stageMoveMappings: {},
  requiresRecruiterReview: true,
};

const stageMoveMappingOptions: Array<{
  stage: ATSInternalStageKey;
  label: string;
}> = [
  { stage: "applicant", label: "Applicant" },
  { stage: "interviewed", label: "Interviewed" },
  { stage: "shortlisted", label: "Shortlisted" },
  { stage: "hired", label: "Hired" },
  { stage: "rejected", label: "Rejected" },
  { stage: "needs_human", label: "Needs human" },
];

export function ATSSettingsWorkspace({
  snapshot,
  canManage,
}: {
  snapshot: ATSAdminSnapshot;
  canManage: boolean;
}) {
  const activeConnectionCount = snapshot.connections.filter(
    (connection) => connection.status === "active",
  ).length;
  const firstConnectionId = snapshot.connections[0]?.id ?? "";
  const [triggerConnectionId, setTriggerConnectionId] =
    useState(firstConnectionId);
  const [writebackConnectionId, setWritebackConnectionId] =
    useState(firstConnectionId);
  const selectedWritebackConnection =
    snapshot.connections.find(
      (connection) => connection.id === writebackConnectionId,
    ) ?? null;
  const selectedWritebackPolicy =
    selectedWritebackConnection?.writebackPolicy ?? defaultWritebackPolicy;
  const selectedWritebackCapabilities = selectedWritebackConnection
    ? providerCapabilities(
        snapshot.availableProviders,
        selectedWritebackConnection.provider,
      )
    : null;
  const canWriteCandidateNotes =
    selectedWritebackCapabilities?.supportsCandidateNotes ?? true;
  const canWriteStatusComments =
    selectedWritebackCapabilities?.supportsStatusComments ?? true;
  const canMoveStages =
    selectedWritebackCapabilities?.supportsStageMove ?? true;
  const reportModeValue =
    (selectedWritebackPolicy.reportMode === "candidate_note" &&
      !canWriteCandidateNotes) ||
    (selectedWritebackPolicy.reportMode === "status_comment" &&
      !canWriteStatusComments &&
      !canMoveStages)
      ? "disabled"
      : selectedWritebackPolicy.reportMode;
  const triggerJobs = useMemo(
    () =>
      snapshot.externalJobs.filter(
        (job) =>
          job.connectionId === triggerConnectionId && job.status === "active",
      ),
    [snapshot.externalJobs, triggerConnectionId],
  );
  const triggerStages = useMemo(
    () =>
      snapshot.externalStages.filter(
        (stage) =>
          stage.connectionId === triggerConnectionId &&
          stage.status === "active",
      ),
    [snapshot.externalStages, triggerConnectionId],
  );
  const writebackStages = useMemo(
    () =>
      snapshot.externalStages.filter(
        (stage) =>
          stage.connectionId === writebackConnectionId &&
          stage.status === "active",
      ),
    [snapshot.externalStages, writebackConnectionId],
  );
  const zohoConnection =
    snapshot.connections.find(
      (connection) => connection.provider === "zoho_recruit",
    ) ?? null;
  const zohoConnectionReady = zohoConnection?.status === "active";
  const zohoTriggerReady = zohoDemoTriggerReady({
    snapshot,
    connectionId: zohoConnection?.id ?? null,
  });
  const zohoWritebackIsReady = zohoDemoWritebackReady(zohoConnection);
  const zohoSyncReady = Boolean(zohoConnection?.lastSyncAt);

  return (
    <div className="grid gap-5">
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="ops-kicker text-slate-500">Connections</p>
            <h2 className="mt-2 text-lg font-semibold text-slate-950">
              ATS providers
            </h2>
          </div>
          <span className="rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600">
            {activeConnectionCount} active
          </span>
        </div>

        {canManage ? (
          <div className="mt-4 flex flex-wrap gap-3">
            <form action={createMockATSConnectionAction}>
              <button
                type="submit"
                className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700"
              >
                Add Mock ATS
              </button>
            </form>
            <form action={createZohoEnvConnectionAction}>
              <button
                type="submit"
                className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700"
              >
                Add Zoho Recruit
              </button>
            </form>
            <form action={configureZohoDemoDefaultsAction}>
              <button
                type="submit"
                className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700"
              >
                Configure Zoho demo
              </button>
            </form>
            {snapshot.zohoDemoSetup.authorizationUrl ? (
              <a
                href={snapshot.zohoDemoSetup.authorizationUrl}
                target="_blank"
                rel="noreferrer"
                className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700"
              >
                Open Zoho OAuth
              </a>
            ) : null}
          </div>
        ) : null}

        <div className="mt-4 grid gap-3">
          {snapshot.availableProviders.map((provider) => {
            const connection = snapshot.connections.find(
              (item) => item.provider === provider.provider,
            );
            const capabilities = providerCapabilities(
              snapshot.availableProviders,
              provider.provider,
            );
            const connectionSyncMode = connection?.syncMode ?? "manual";

            return (
              <div
                key={provider.provider}
                className="flex items-center justify-between gap-4 rounded-md border border-slate-200 px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium text-slate-950">
                    {provider.label}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {connection
                      ? `Connected · ${connection.status}`
                      : provider.implemented
                        ? "Available"
                        : "Planned adapter"}
                  </p>
                  {connection?.lastError ? (
                    <p className="mt-1 max-w-xl text-xs text-rose-700">
                      {connection.lastError}
                    </p>
                  ) : null}
                </div>
                {connection && canManage ? (
                  <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
                    <form
                      action={saveATSSyncModeAction}
                      className="flex items-center gap-2"
                    >
                      <input
                        type="hidden"
                        name="connectionId"
                        value={connection.id}
                      />
                      <select
                        name="syncMode"
                        defaultValue={connectionSyncMode}
                        aria-label={`Sync mode for ${provider.label}`}
                        className="rounded-md border border-slate-300 px-2 py-2 text-xs text-slate-700"
                      >
                        {syncModeOptions({ capabilities }).map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <button
                        type="submit"
                        className="rounded-md border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700"
                      >
                        Save sync
                      </button>
                    </form>
                    <form action={testATSConnectionAction}>
                      <input
                        type="hidden"
                        name="connectionId"
                        value={connection.id}
                      />
                      <button
                        type="submit"
                        className="rounded-md border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700"
                      >
                        Test
                      </button>
                    </form>
                    {connection.status === "active" ||
                    connection.status === "paused" ? (
                      <form action={saveATSConnectionStatusAction}>
                        <input
                          type="hidden"
                          name="connectionId"
                          value={connection.id}
                        />
                        <input
                          type="hidden"
                          name="status"
                          value={
                            connection.status === "active"
                              ? "paused"
                              : "active"
                          }
                        />
                        <button
                          type="submit"
                          className="rounded-md border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700"
                        >
                          {connection.status === "active" ? "Pause" : "Resume"}
                        </button>
                      </form>
                    ) : null}
                    <form action={runManualATSSyncAction}>
                      <input
                        type="hidden"
                        name="connectionId"
                        value={connection.id}
                      />
                      <button
                        type="submit"
                        className="rounded-md border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700"
                      >
                        Sync now
                      </button>
                    </form>
                  </div>
                ) : (
                  <span className="text-xs font-medium text-slate-500">
                    {provider.provider}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="ops-kicker text-slate-500">Demo health</p>
            <h2 className="mt-2 text-lg font-semibold text-slate-950">
              Zoho demo readiness
            </h2>
          </div>
          <span
            className={`rounded-full border px-3 py-1 text-xs font-medium ${readinessStatusClass(
              zohoConnectionReady &&
                zohoTriggerReady &&
                zohoWritebackIsReady &&
                zohoSyncReady,
            )}`}
          >
            {zohoConnectionReady &&
            zohoTriggerReady &&
            zohoWritebackIsReady &&
            zohoSyncReady
              ? "Ready"
              : "Needs setup"}
          </span>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div className="rounded-md border border-slate-200 px-4 py-3">
            <p className="text-sm font-medium text-slate-950">
              {zohoConnectionReady ? "Connection active" : "Connection missing"}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {zohoConnection
                ? `${zohoConnection.displayName} · ${zohoConnection.status}`
                : "No Zoho Recruit connection"}
            </p>
          </div>
          <div className="rounded-md border border-slate-200 px-4 py-3">
            <p className="text-sm font-medium text-slate-950">
              {zohoTriggerReady ? "Trigger ready" : "Trigger missing"}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {zohoDemoTriggerStageId} · {zohoDemoTriggerActions.join(", ")}
            </p>
          </div>
          <div className="rounded-md border border-slate-200 px-4 py-3">
            <p className="text-sm font-medium text-slate-950">
              {zohoWritebackIsReady
                ? "Writeback ready"
                : "Writeback incomplete"}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Note plus stage move to {zohoDemoWritebackStageId}
            </p>
          </div>
          <div className="rounded-md border border-slate-200 px-4 py-3">
            <p className="text-sm font-medium text-slate-950">
              {zohoSyncReady ? "Synced" : "Not synced"}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {zohoConnection?.lastSyncAt
                ? `Last sync: ${zohoConnection.lastSyncAt}`
                : "Run Sync now after credentials are valid"}
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="ops-kicker text-slate-500">Imported candidates</p>
            <h2 className="mt-2 text-lg font-semibold text-slate-950">
              Imported ATS applications
            </h2>
          </div>
          <span className="rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600">
            {snapshot.externalApplications.length} synced
          </span>
        </div>
        <div className="mt-4 grid gap-3">
          {snapshot.externalApplications.length ? (
            snapshot.externalApplications.map((application) => (
              <div
                key={application.id}
                className="flex items-center justify-between gap-4 rounded-md border border-slate-200 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-950">
                    {application.candidateName}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {applicationStageLabel(application)}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {providerLabel(
                      snapshot.availableProviders,
                      application.provider,
                    )}{" "}
                    · {application.externalId}
                  </p>
                </div>
                <span className="shrink-0 rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600">
                  {application.internalCandidateId
                    ? "Linked to Breathe candidate"
                    : "External only"}
                </span>
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-600">
              No imported ATS applications yet. Run a sync to populate this
              list.
            </p>
          )}
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <p className="ops-kicker text-slate-500">Stage triggers</p>
        <h2 className="mt-2 text-lg font-semibold text-slate-950">
          Configured rules
        </h2>
        {canManage && snapshot.connections.length ? (
          <form action={saveATSTriggerRuleAction} className="mt-4 grid gap-3">
            <select
              name="connectionId"
              value={triggerConnectionId}
              onChange={(event) => setTriggerConnectionId(event.target.value)}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm"
              aria-label="Trigger connection"
            >
              {snapshot.connections.map((connection) => (
                <option key={connection.id} value={connection.id}>
                  {providerLabel(
                    snapshot.availableProviders,
                    connection.provider,
                  )}
                </option>
              ))}
            </select>
            {triggerStages.length ? (
              <select
                name="externalStageId"
                className="rounded-md border border-slate-300 px-3 py-2 text-sm"
                aria-label="External trigger stage"
              >
                {triggerStages.map((stage) => (
                  <option key={stage.id} value={stage.externalId}>
                    {stageOptionLabel({
                      stage,
                      jobs: snapshot.externalJobs,
                    })}
                  </option>
                ))}
              </select>
            ) : (
              <input
                name="externalStageId"
                placeholder="External stage or status"
                className="rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
            )}
            {triggerJobs.length ? (
              <select
                name="externalJobId"
                className="rounded-md border border-slate-300 px-3 py-2 text-sm"
                aria-label="External trigger job"
              >
                <option value="">Any imported job</option>
                {triggerJobs.map((job) => (
                  <option key={job.id} value={job.externalId}>
                    {job.title}
                  </option>
                ))}
              </select>
            ) : (
              <input
                name="externalJobId"
                placeholder="External job ID, optional"
                className="rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
            )}
            <div className="grid gap-2 rounded-md border border-slate-200 p-3">
              {[
                ["import_candidate", "Import candidate"],
                ["prepare_interview", "Prepare interview"],
                ["queue_interview", "Queue interview"],
                ["dispatch_interview", "Dispatch interview"],
              ].map(([value, label]) => (
                <label
                  key={value}
                  className="flex items-center gap-2 text-sm text-slate-700"
                >
                  <input
                    type="checkbox"
                    name="actions"
                    value={value}
                    defaultChecked={
                      value === "import_candidate" ||
                      value === "prepare_interview" ||
                      value === "queue_interview"
                    }
                    className="size-4 rounded border-slate-300"
                  />
                  {label}
                </label>
              ))}
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  name="requiresRecruiterApproval"
                  defaultChecked
                  className="size-4 rounded border-slate-300"
                />
                Require recruiter approval
              </label>
            </div>
            <button
              type="submit"
              className="w-fit rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700"
            >
              Save trigger
            </button>
          </form>
        ) : null}
        <div className="mt-4 grid gap-3">
          {snapshot.triggerRules.length ? (
            snapshot.triggerRules.map((rule) => (
              <div
                key={rule.id}
                className="rounded-md border border-slate-200 px-4 py-3"
              >
                <p className="text-sm font-medium text-slate-950">
                  {rule.name}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {providerLabel(snapshot.availableProviders, rule.provider)} ·{" "}
                  {rule.externalStageId}
                </p>
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-600">
              No trigger rules configured yet.
            </p>
          )}
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <p className="ops-kicker text-slate-500">Writeback policy</p>
        <h2 className="mt-2 text-lg font-semibold text-slate-950">
          Interview results
        </h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Breathe will queue ATS writebacks as provider-neutral actions before
          dispatching them through the selected adapter.
        </p>
        {!canManage ? (
          <p className="mt-3 text-sm text-amber-700">
            Only admins and owners can change ATS integration settings.
          </p>
        ) : null}
        {canManage && snapshot.connections.length ? (
          <form
            key={writebackConnectionId}
            action={saveATSWritebackPolicyAction}
            className="mt-4 grid gap-3"
          >
            <select
              name="connectionId"
              value={writebackConnectionId}
              onChange={(event) => setWritebackConnectionId(event.target.value)}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm"
              aria-label="Writeback connection"
            >
              {snapshot.connections.map((connection) => (
                <option key={connection.id} value={connection.id}>
                  {providerLabel(
                    snapshot.availableProviders,
                    connection.provider,
                  )}
                </option>
              ))}
            </select>
            <select
              name="reportMode"
              defaultValue={reportModeValue}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm"
              aria-label="Report writeback mode"
            >
              {canWriteCandidateNotes ? (
                <option value="candidate_note">Candidate note</option>
              ) : null}
              {canWriteStatusComments || canMoveStages ? (
                <option value="status_comment">Status comment</option>
              ) : null}
              <option value="disabled">Disabled</option>
            </select>
            {canMoveStages ? (
              writebackStages.length ? (
                <select
                  name="moveToExternalStageId"
                  defaultValue={selectedStageMappingValue({
                    value: selectedWritebackPolicy.moveToExternalStageId,
                    stages: writebackStages,
                  })}
                  className="rounded-md border border-slate-300 px-3 py-2 text-sm"
                  aria-label="Writeback target stage"
                >
                  <option value="">Do not move stage</option>
                  {writebackStages.map((stage) => (
                    <option key={stage.id} value={stageOptionValue(stage)}>
                      {stageOptionLabel({
                        stage,
                        jobs: snapshot.externalJobs,
                      })}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  name="moveToExternalStageId"
                  defaultValue={
                    selectedWritebackPolicy.moveToExternalStageId ?? ""
                  }
                  placeholder="Move to external stage after evaluation"
                  className="rounded-md border border-slate-300 px-3 py-2 text-sm"
                />
              )
            ) : (
              <input type="hidden" name="moveToExternalStageId" value="" />
            )}
            {canMoveStages ? (
              <div className="grid gap-2 rounded-md border border-slate-200 p-3">
                <p className="text-xs font-medium uppercase text-slate-500">
                  Manual stage mappings
                </p>
                <div className="grid gap-2 md:grid-cols-2">
                  {stageMoveMappingOptions.map((option) => (
                    <label
                      key={option.stage}
                      className="grid gap-1 text-xs font-medium text-slate-600"
                    >
                      <span>
                        Move Breathe {option.stage} to ATS stage
                      </span>
                      {writebackStages.length ? (
                        <select
                          name={`stageMoveMapping:${option.stage}`}
                          defaultValue={
                            selectedStageMappingValue({
                              value:
                                selectedWritebackPolicy.stageMoveMappings?.[
                                  option.stage
                                ],
                              stages: writebackStages,
                            })
                          }
                          className="rounded-md border border-slate-300 px-2 py-2 text-sm font-normal text-slate-700"
                          aria-label={`Move Breathe ${option.stage} to ATS stage`}
                        >
                          <option value="">Do not sync this stage</option>
                          {writebackStages.map((stage) => (
                            <option key={stage.id} value={stageOptionValue(stage)}>
                              {stageOptionLabel({
                                stage,
                                jobs: snapshot.externalJobs,
                              })}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          name={`stageMoveMapping:${option.stage}`}
                          defaultValue={
                            selectedWritebackPolicy.stageMoveMappings?.[
                              option.stage
                            ] ?? ""
                          }
                          placeholder={`External stage for ${option.label}`}
                          className="rounded-md border border-slate-300 px-2 py-2 text-sm font-normal text-slate-700"
                          aria-label={`Move Breathe ${option.stage} to ATS stage`}
                        />
                      )}
                    </label>
                  ))}
                </div>
              </div>
            ) : null}
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                name="requiresRecruiterReview"
                defaultChecked={selectedWritebackPolicy.requiresRecruiterReview}
                className="size-4 rounded border-slate-300"
              />
              Review writebacks before sending
            </label>
            <button
              type="submit"
              className="w-fit rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700"
            >
              Save writeback policy
            </button>
          </form>
        ) : null}
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <p className="ops-kicker text-slate-500">Workflow requests</p>
        <h2 className="mt-2 text-lg font-semibold text-slate-950">
          ATS-triggered work
        </h2>
        <div className="mt-4 grid gap-3">
          {snapshot.workflowRequests.length ? (
            snapshot.workflowRequests.map((request) => (
              <div
                key={request.id}
                className="flex items-center justify-between gap-4 rounded-md border border-slate-200 px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium text-slate-950">
                    {request.externalApplicationId}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {request.status} · {request.requestedActions.join(", ")}
                  </p>
                </div>
                {canManage && request.status === "queued" ? (
                  <form action={approveATSWorkflowRequestAction}>
                    <input
                      type="hidden"
                      name="workflowRequestId"
                      value={request.id}
                    />
                    <button
                      type="submit"
                      className="rounded-md border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700"
                    >
                      Approve
                    </button>
                  </form>
                ) : null}
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-600">
              No ATS workflow requests yet.
            </p>
          )}
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <p className="ops-kicker text-slate-500">Writeback actions</p>
        <h2 className="mt-2 text-lg font-semibold text-slate-950">
          ATS outbound queue
        </h2>
        <div className="mt-4 grid gap-3">
          {snapshot.writebackActions.length ? (
            snapshot.writebackActions.map((action) => {
              const lastAttempt = latestWritebackAttempt({
                actionId: action.id,
                attempts: snapshot.writebackAttempts,
              });

              return (
                <div
                  key={action.id}
                  className="flex items-center justify-between gap-4 rounded-md border border-slate-200 px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-950">
                      {action.actionType}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {action.status} · {action.targetExternalCandidateId}
                    </p>
                    {lastAttempt ? (
                      <p className="mt-1 text-xs text-slate-500">
                        Last attempt: {lastAttempt.status}
                        {lastAttempt.errorMessage
                          ? ` · ${lastAttempt.errorMessage}`
                          : ""}
                      </p>
                    ) : null}
                  </div>
                  {canManage &&
                  (action.status === "queued" ||
                    action.status === "retryable_error") ? (
                    <form action={processATSWritebackActionAction}>
                      <input
                        type="hidden"
                        name="writebackActionId"
                        value={action.id}
                      />
                      <button
                        type="submit"
                        className="rounded-md border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700"
                      >
                        {action.status === "retryable_error" ? "Retry" : "Send"}
                      </button>
                    </form>
                  ) : null}
                </div>
              );
            })
          ) : (
            <p className="text-sm text-slate-600">
              No ATS writeback actions queued yet.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
