import { StatusBadge } from "@/components/status-badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { type listTeamManagementSnapshot } from "@/lib/team-access";

import {
  AddTeamMemberForm,
  CreateTeamForm,
  RemoveTeamMemberForm,
  ToggleTeamJobAccessForm,
} from "@/app/(recruiter)/teams/team-action-forms";

type TeamManagementSnapshot = Awaited<
  ReturnType<typeof listTeamManagementSnapshot>
>;

function initials(value: string) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function pluralize(count: number, singular: string, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`;
}

function MetricCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string | number;
  detail: string;
}) {
  return (
    <Card className="bg-card/88">
      <CardContent className="px-4 py-4">
        <p className="ops-kicker text-muted-foreground">{label}</p>
        <p className="text-foreground mt-2 text-[1.55rem] leading-none font-semibold tracking-tight">
          {value}
        </p>
        <p className="text-muted-foreground mt-1 text-[11px] leading-5">
          {detail}
        </p>
      </CardContent>
    </Card>
  );
}

export function TeamManagementWorkspace({
  snapshot,
}: {
  snapshot: TeamManagementSnapshot;
}) {
  const restrictedJobs = snapshot.jobs.filter((job) =>
    snapshot.teams.some(
      (team) => !team.isDefault && team.grantedJobIds.includes(job.id),
    ),
  ).length;
  const sharedJobs = snapshot.jobs.length - restrictedJobs;
  const memberCoverage = snapshot.users.map((user) => ({
    ...user,
    teams: snapshot.teams.filter((team) =>
      team.members.some((member) => member.id === user.id),
    ),
  }));
  const teamSummaries = snapshot.teams.map((team) => ({
    ...team,
    grantedJobs: snapshot.jobs.filter((job) =>
      team.grantedJobIds.includes(job.id),
    ),
  }));

  return (
    <div className="grid gap-6">
      <header className="rounded-[1rem] border border-slate-200/80 bg-[radial-gradient(circle_at_top_left,rgba(94,126,255,0.14),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.97),rgba(246,249,252,0.9))] px-6 py-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl space-y-3">
            <StatusBadge intent="special" density="compact">
              Company access control
            </StatusBadge>
            <div className="space-y-2">
              <h2 className="text-3xl font-semibold tracking-tight text-slate-950">
                Teams and opportunity access
              </h2>
              <p className="max-w-2xl text-sm leading-6 text-slate-600 md:text-[15px]">
                Group recruiters into teams and decide exactly which
                opportunities each team can see. Default teams keep shared
                visibility simple; dedicated teams let you lock sensitive roles
                down to a smaller group.
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 xl:min-w-[34rem]">
            <Card className="border-cyan-200/80 bg-cyan-50/70">
              <CardContent className="px-4 py-3">
                <p className="ops-kicker text-cyan-800">Shared access</p>
                <p className="mt-2 text-sm leading-6 text-cyan-950">
                  {pluralize(sharedJobs, "job")} are still visible through the
                  default admin team.
                </p>
              </CardContent>
            </Card>
            <Card className="border-violet-200/80 bg-violet-50/80">
              <CardContent className="px-4 py-3">
                <p className="ops-kicker text-violet-700">Restricted access</p>
                <p className="mt-2 text-sm leading-6 text-violet-950">
                  {pluralize(restrictedJobs, "job")} already depend on a
                  dedicated team grant.
                </p>
              </CardContent>
            </Card>
            <Card className="border-amber-200/80 bg-amber-50/80">
              <CardContent className="px-4 py-3">
                <p className="ops-kicker text-amber-700">Current policy</p>
                <p className="mt-2 text-sm leading-6 text-amber-950">
                  Recruiters only see jobs granted to one of their teams.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <MetricCard
            label="Teams"
            value={snapshot.teams.length}
            detail="Access groups inside this company"
          />
          <MetricCard
            label="Members"
            value={snapshot.users.length}
            detail="Recruiters with company access"
          />
          <MetricCard
            label="Scoped jobs"
            value={snapshot.jobs.length}
            detail="Opportunities that can be granted team by team"
          />
        </div>
      </header>

      <div className="grid gap-6 xl:grid-cols-[minmax(18rem,0.82fr)_minmax(0,1.18fr)]">
        <div className="grid gap-6 self-start xl:sticky xl:top-6">
          <Card>
            <CardHeader>
              <p className="ops-kicker text-muted-foreground">Create team</p>
              <CardTitle>New access group</CardTitle>
              <CardDescription>
                Spin up a dedicated team for a confidential opportunity, a
                client account, or a hiring pod.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CreateTeamForm>
                <div className="space-y-2">
                  <label
                    className="text-sm font-medium text-slate-700"
                    htmlFor="team-name"
                  >
                    Team name
                  </label>
                  <Input
                    id="team-name"
                    name="name"
                    placeholder="AI opportunity team"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label
                    className="text-sm font-medium text-slate-700"
                    htmlFor="team-description"
                  >
                    Description
                  </label>
                  <Textarea
                    id="team-description"
                    name="description"
                    placeholder="Who should be in this team and what they should manage."
                  />
                </div>
              </CreateTeamForm>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <p className="ops-kicker text-muted-foreground">How it works</p>
              <CardTitle>Access model</CardTitle>
              <CardDescription>
                The fastest mental model for this screen.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Card className="bg-white/80">
                <CardContent className="px-4 py-3">
                  <p className="font-medium text-slate-950">
                    1. Put recruiters into teams
                  </p>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    Teams are the unit of visibility. A recruiter can belong to
                    more than one team.
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-white/80">
                <CardContent className="px-4 py-3">
                  <p className="font-medium text-slate-950">
                    2. Grant jobs to those teams
                  </p>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    If a recruiter belongs to any team with access, the
                    opportunity appears in their workspace.
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-white/80">
                <CardContent className="px-4 py-3">
                  <p className="font-medium text-slate-950">
                    3. Use the default team sparingly
                  </p>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    Default admin access is convenient for shared jobs, but
                    dedicated teams are safer for sensitive searches.
                  </p>
                </CardContent>
              </Card>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <p className="ops-kicker text-muted-foreground">Company roster</p>
              <CardTitle>Recruiters in this company</CardTitle>
              <CardDescription>
                A quick view of who currently has platform access and which
                teams they belong to.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {memberCoverage.map((user) => (
                <Card key={user.id} className="bg-white/88">
                  <CardContent className="px-4 py-3">
                    <div className="flex items-start gap-3">
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-slate-950 text-xs font-semibold text-white">
                        {initials(user.displayName || user.email)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-slate-950">
                          {user.displayName}
                        </p>
                        <p className="truncate text-xs text-slate-500">
                          {user.email}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {user.teams.length ? (
                            user.teams.map((team) => (
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
                              No team
                            </StatusBadge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <p className="ops-kicker text-muted-foreground">
                Opportunity coverage
              </p>
              <CardTitle>Which teams can see each job</CardTitle>
              <CardDescription>
                Use this matrix when you want to audit visibility before
                changing anything.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {snapshot.jobs.map((job) => {
                const teamsWithAccess = teamSummaries.filter((team) =>
                  team.grantedJobIds.includes(job.id),
                );

                return (
                  <Card
                    key={job.id}
                    className="bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(244,247,250,0.94))]"
                  >
                    <CardContent className="px-4 py-4">
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h2 className="truncate text-base font-semibold text-slate-950">
                              {job.title}
                            </h2>
                            <StatusBadge intent="neutral" density="compact">
                              {job.recruiterSlug}
                            </StatusBadge>
                          </div>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {teamsWithAccess.length ? (
                              teamsWithAccess.map((team) => (
                                <StatusBadge
                                  key={team.id}
                                  intent={team.isDefault ? "info" : "special"}
                                  density="compact"
                                >
                                  {team.name}
                                </StatusBadge>
                              ))
                            ) : (
                              <StatusBadge intent="warning" density="compact">
                                No team currently granted
                              </StatusBadge>
                            )}
                          </div>
                        </div>
                        <Card className="rounded-[0.8rem] bg-white/82">
                          <CardContent className="px-3 py-2 text-right">
                            <p className="ops-kicker text-slate-500">
                              Visibility
                            </p>
                            <p className="mt-1 text-sm font-medium text-slate-950">
                              {pluralize(teamsWithAccess.length, "team")}
                            </p>
                          </CardContent>
                        </Card>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </CardContent>
          </Card>

          <section className="grid gap-4">
            {teamSummaries.map((team) => (
              <Card key={team.id} className="overflow-hidden">
                <CardHeader className="border-b border-slate-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.95),rgba(246,249,252,0.88))]">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <CardTitle>{team.name}</CardTitle>
                        {team.isDefault ? (
                          <StatusBadge intent="info" density="compact">
                            Default
                          </StatusBadge>
                        ) : null}
                      </div>
                      <CardDescription className="mt-2 max-w-2xl">
                        {team.description || "No description yet."}
                      </CardDescription>
                    </div>

                    <div className="grid gap-2 sm:grid-cols-2">
                      <Card className="rounded-[0.8rem] bg-white/85">
                        <CardContent className="px-3 py-2">
                          <p className="ops-kicker text-slate-500">Members</p>
                          <p className="mt-1 text-sm font-medium text-slate-950">
                            {pluralize(team.members.length, "recruiter")}
                          </p>
                        </CardContent>
                      </Card>
                      <Card className="rounded-[0.8rem] bg-white/85">
                        <CardContent className="px-3 py-2">
                          <p className="ops-kicker text-slate-500">
                            Visible jobs
                          </p>
                          <p className="mt-1 text-sm font-medium text-slate-950">
                            {pluralize(
                              team.grantedJobs.length,
                              "opportunity",
                              "opportunities",
                            )}
                          </p>
                        </CardContent>
                      </Card>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {team.grantedJobs.length ? (
                      team.grantedJobs.map((job) => (
                        <StatusBadge
                          key={job.id}
                          intent={team.isDefault ? "info" : "special"}
                          density="compact"
                        >
                          {job.title}
                        </StatusBadge>
                      ))
                    ) : (
                      <StatusBadge intent="warning" density="compact">
                        No opportunities granted yet
                      </StatusBadge>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="grid gap-5 px-5 py-5 xl:grid-cols-[minmax(0,0.88fr)_minmax(0,1.12fr)]">
                  <section className="space-y-3">
                    <div>
                      <p className="ops-kicker text-slate-500">Members</p>
                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        Add existing recruiters by email and use teams to keep
                        access intentional.
                      </p>
                    </div>

                    <AddTeamMemberForm teamId={team.id} />

                    <div className="space-y-2">
                      {team.members.map((member) => (
                        <Card key={member.id} className="bg-slate-50/80">
                          <CardContent className="flex items-center justify-between gap-3 px-3 py-3">
                            <div className="flex min-w-0 items-center gap-3">
                              <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-slate-950 text-xs font-semibold text-white">
                                {initials(member.displayName || member.email)}
                              </div>
                              <div className="min-w-0">
                                <p className="truncate text-sm font-medium text-slate-950">
                                  {member.displayName}
                                </p>
                                <p className="truncate text-xs text-slate-500">
                                  {member.email}
                                </p>
                              </div>
                            </div>
                            {!team.isDefault ? (
                              <RemoveTeamMemberForm
                                teamId={team.id}
                                userId={member.id}
                              />
                            ) : (
                              <StatusBadge intent="info" density="compact">
                                Protected
                              </StatusBadge>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </section>

                  <section className="space-y-3">
                    <div>
                      <p className="ops-kicker text-slate-500">
                        Opportunity access
                      </p>
                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        Grant the jobs this team should see in the recruiter
                        workspace.
                      </p>
                    </div>

                    <div className="grid gap-2">
                      {snapshot.jobs.map((job) => {
                        const enabled = team.grantedJobIds.includes(job.id);

                        return (
                          <Card
                            key={job.id}
                            className={
                              enabled
                                ? "border-violet-200/90 bg-violet-50/70"
                                : "bg-slate-50/80"
                            }
                          >
                            <CardContent className="flex items-center justify-between gap-3 px-3 py-3">
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <p className="truncate text-sm font-medium text-slate-950">
                                    {job.title}
                                  </p>
                                  <StatusBadge
                                    intent={enabled ? "special" : "neutral"}
                                    density="compact"
                                  >
                                    {enabled ? "Visible" : "Hidden"}
                                  </StatusBadge>
                                </div>
                                <p className="truncate text-xs text-slate-500">
                                  {job.recruiterSlug}
                                </p>
                              </div>
                              <ToggleTeamJobAccessForm
                                teamId={team.id}
                                jobId={job.id}
                                enabled={enabled}
                              />
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </section>
                </CardContent>
              </Card>
            ))}
          </section>
        </div>
      </div>
    </div>
  );
}
