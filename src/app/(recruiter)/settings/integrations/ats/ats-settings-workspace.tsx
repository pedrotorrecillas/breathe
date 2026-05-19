"use client";

import type {
  ATSAdminSnapshot,
  ATSAvailableProvider,
} from "@/lib/ats-integrations/connections";

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

        <div className="mt-4 grid gap-3">
          {snapshot.availableProviders.map((provider) => (
            <div
              key={provider.provider}
              className="flex items-center justify-between gap-4 rounded-md border border-slate-200 px-4 py-3"
            >
              <div>
                <p className="text-sm font-medium text-slate-950">
                  {provider.label}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {provider.implemented ? "Available" : "Planned adapter"}
                </p>
              </div>
              <span className="text-xs font-medium text-slate-500">
                {provider.provider}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <p className="ops-kicker text-slate-500">Stage triggers</p>
        <h2 className="mt-2 text-lg font-semibold text-slate-950">
          Configured rules
        </h2>
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
      </section>
    </div>
  );
}
