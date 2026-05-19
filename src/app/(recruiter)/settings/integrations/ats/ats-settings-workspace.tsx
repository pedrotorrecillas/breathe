"use client";

import type {
  ATSAdminSnapshot,
  ATSAvailableProvider,
} from "@/lib/ats-integrations/connections";

import {
  createMockATSConnectionAction,
  createZohoEnvConnectionAction,
  runManualATSSyncAction,
  saveATSTriggerRuleAction,
  saveATSWritebackPolicyAction,
} from "./actions";

function providerLabel(
  providers: ATSAvailableProvider[],
  provider: string,
) {
  return providers.find((item) => item.provider === provider)?.label ?? provider;
}

export function ATSSettingsWorkspace({
  snapshot,
  canManage,
}: {
  snapshot: ATSAdminSnapshot;
  canManage: boolean;
}) {
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
            {snapshot.connections.length} active
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
          </div>
        ) : null}

        <div className="mt-4 grid gap-3">
          {snapshot.availableProviders.map((provider) => {
            const connection = snapshot.connections.find(
              (item) => item.provider === provider.provider,
            );

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
                </div>
                {connection && canManage ? (
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
        <p className="ops-kicker text-slate-500">Stage triggers</p>
        <h2 className="mt-2 text-lg font-semibold text-slate-950">
          Configured rules
        </h2>
        {canManage && snapshot.connections.length ? (
          <form action={saveATSTriggerRuleAction} className="mt-4 grid gap-3">
            <select
              name="connectionId"
              className="rounded-md border border-slate-300 px-3 py-2 text-sm"
              aria-label="Trigger connection"
            >
              {snapshot.connections.map((connection) => (
                <option key={connection.id} value={connection.id}>
                  {providerLabel(snapshot.availableProviders, connection.provider)}
                </option>
              ))}
            </select>
            <input
              name="externalStageId"
              placeholder="External stage or status"
              className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
            <input
              name="externalJobId"
              placeholder="External job ID, optional"
              className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
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
                <p className="text-sm font-medium text-slate-950">{rule.name}</p>
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
          <form action={saveATSWritebackPolicyAction} className="mt-4 grid gap-3">
            <select
              name="connectionId"
              className="rounded-md border border-slate-300 px-3 py-2 text-sm"
              aria-label="Writeback connection"
            >
              {snapshot.connections.map((connection) => (
                <option key={connection.id} value={connection.id}>
                  {providerLabel(snapshot.availableProviders, connection.provider)}
                </option>
              ))}
            </select>
            <select
              name="reportMode"
              className="rounded-md border border-slate-300 px-3 py-2 text-sm"
              aria-label="Report writeback mode"
            >
              <option value="candidate_note">Candidate note</option>
              <option value="status_comment">Status comment</option>
              <option value="disabled">Disabled</option>
            </select>
            <input
              name="moveToExternalStageId"
              placeholder="Move to external stage after evaluation"
              className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
            <button
              type="submit"
              className="w-fit rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700"
            >
              Save writeback policy
            </button>
          </form>
        ) : null}
      </section>
    </div>
  );
}
