import { StatusBadge } from "@/components/status-badge";
import { TeamManagementWorkspace } from "@/components/team-management-workspace";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireAuthenticatedRecruiter } from "@/lib/auth/server";
import {
  getRecruiterAccessProfile,
  listTeamManagementSnapshot,
  recruiterCanManageTeams,
} from "@/lib/team-access";

function prettyAuthProvider(value: "password" | "google") {
  return value === "google" ? "Google" : "Password";
}

function prettyRole(value: "owner" | "admin" | "recruiter") {
  if (value === "owner") {
    return "Owner";
  }

  if (value === "admin") {
    return "Admin";
  }

  return "Recruiter";
}

export default async function SettingsPage() {
  const recruiter = await requireAuthenticatedRecruiter();
  const canManageTeams = recruiterCanManageTeams(recruiter);
  const accessProfile = await getRecruiterAccessProfile(recruiter);
  const teamSnapshot = canManageTeams
    ? await listTeamManagementSnapshot(recruiter)
    : null;

  return (
    <div className="flex flex-1 flex-col gap-6 px-6 py-6 md:px-8">
      <header className="space-y-3">
        <StatusBadge intent="special" density="compact">
          Workspace settings
        </StatusBadge>
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
            Settings
          </h1>
          <p className="max-w-3xl text-sm leading-6 text-slate-600 md:text-[15px]">
            Manage your account context, understand what access you currently
            have, and, if you are an admin, control which teams can see each
            opportunity.
          </p>
        </div>
      </header>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,0.72fr)_minmax(0,1.28fr)]">
        <div className="grid gap-6 self-start xl:sticky xl:top-6">
          <Card>
            <CardHeader>
              <p className="ops-kicker text-muted-foreground">Account</p>
              <CardTitle>Profile and session context</CardTitle>
              <CardDescription>
                Basic information about the recruiter account currently signed
                in.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              <Card className="bg-white/88">
                <CardContent className="px-4 py-3">
                  <p className="ops-kicker text-muted-foreground">Name</p>
                  <p className="mt-2 text-sm font-medium text-slate-950">
                    {recruiter.user.displayName}
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-white/88">
                <CardContent className="px-4 py-3">
                  <p className="ops-kicker text-muted-foreground">Email</p>
                  <p className="mt-2 text-sm font-medium text-slate-950">
                    {recruiter.user.email}
                  </p>
                </CardContent>
              </Card>
              <div className="grid gap-3 sm:grid-cols-2">
                <Card className="bg-white/88">
                  <CardContent className="px-4 py-3">
                    <p className="ops-kicker text-muted-foreground">Role</p>
                    <p className="mt-2 text-sm font-medium text-slate-950">
                      {prettyRole(recruiter.membership.role)}
                    </p>
                  </CardContent>
                </Card>
                <Card className="bg-white/88">
                  <CardContent className="px-4 py-3">
                    <p className="ops-kicker text-muted-foreground">
                      Sign-in method
                    </p>
                    <p className="mt-2 text-sm font-medium text-slate-950">
                      {prettyAuthProvider(recruiter.user.authProvider)}
                    </p>
                  </CardContent>
                </Card>
              </div>
              <Card className="bg-white/88">
                <CardContent className="px-4 py-3">
                  <p className="ops-kicker text-muted-foreground">Company</p>
                  <p className="mt-2 text-sm font-medium text-slate-950">
                    {recruiter.company.name}
                  </p>
                </CardContent>
              </Card>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <p className="ops-kicker text-muted-foreground">Your access</p>
              <CardTitle>What you can currently see</CardTitle>
              <CardDescription>
                Visibility is granted through team membership, not just login.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <Card className="bg-white/88">
                  <CardContent className="px-4 py-3">
                    <p className="ops-kicker text-muted-foreground">Teams</p>
                    <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                      {accessProfile.teams.length}
                    </p>
                  </CardContent>
                </Card>
                <Card className="bg-white/88">
                  <CardContent className="px-4 py-3">
                    <p className="ops-kicker text-muted-foreground">
                      Visible jobs
                    </p>
                    <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                      {accessProfile.jobs.length}
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-2">
                <p className="ops-kicker text-muted-foreground">Teams</p>
                <div className="flex flex-wrap gap-2">
                  {accessProfile.teams.length ? (
                    accessProfile.teams.map((team) => (
                      <StatusBadge
                        key={team.id}
                        intent={team.isDefault ? "info" : "neutral"}
                        density="compact"
                      >
                        {team.name}
                      </StatusBadge>
                    ))
                  ) : (
                    <StatusBadge intent="warning" density="compact">
                      No team memberships
                    </StatusBadge>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <p className="ops-kicker text-muted-foreground">
                  Visible opportunities
                </p>
                <div className="flex flex-wrap gap-2">
                  {accessProfile.jobs.length ? (
                    accessProfile.jobs.map((job) => (
                      <StatusBadge
                        key={job.id}
                        intent="special"
                        density="compact"
                      >
                        {job.title}
                      </StatusBadge>
                    ))
                  ) : (
                    <StatusBadge intent="warning" density="compact">
                      No opportunities visible
                    </StatusBadge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {!canManageTeams ? (
            <Card className="border-amber-200/90 bg-amber-50/85">
              <CardHeader>
                <p className="ops-kicker text-amber-700">Admin-only</p>
                <CardTitle>Team management is restricted</CardTitle>
                <CardDescription className="text-amber-900/80">
                  Your account can view its own access, but only admins and
                  owners can change teams or opportunity visibility.
                </CardDescription>
              </CardHeader>
            </Card>
          ) : null}
        </div>

        <div className="min-w-0">
          {teamSnapshot ? (
            <TeamManagementWorkspace snapshot={teamSnapshot} />
          ) : (
            <Card className="h-full">
              <CardHeader>
                <p className="ops-kicker text-muted-foreground">
                  Access management
                </p>
                <CardTitle>No admin controls on this account</CardTitle>
                <CardDescription>
                  Ask an owner or admin to update team memberships or
                  opportunity grants if you need broader visibility.
                </CardDescription>
              </CardHeader>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
