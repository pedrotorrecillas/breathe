import { StatusBadge } from "@/components/status-badge";
import { requireAuthenticatedRecruiter } from "@/lib/auth/server";
import { getATSAdminSnapshot } from "@/lib/ats-integrations/connections";
import { recruiterCanManageTeams } from "@/lib/team-access";

import { ATSSettingsWorkspace } from "./ats-settings-workspace";

export default async function ATSSettingsPage() {
  const recruiter = await requireAuthenticatedRecruiter();
  const canManage = recruiterCanManageTeams(recruiter);
  const snapshot = await getATSAdminSnapshot(recruiter);

  return (
    <div className="flex flex-1 flex-col gap-6 px-6 py-6 md:px-8">
      <header className="space-y-3">
        <StatusBadge intent="special" density="compact">
          Admin settings
        </StatusBadge>
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
            ATS integrations
          </h1>
          <p className="max-w-3xl text-sm leading-6 text-slate-600 md:text-[15px]">
            Connect external recruiting systems, map external stages to Breathe
            triggers, and control how interview outcomes are written back.
          </p>
        </div>
      </header>

      <ATSSettingsWorkspace snapshot={snapshot} canManage={canManage} />
    </div>
  );
}
