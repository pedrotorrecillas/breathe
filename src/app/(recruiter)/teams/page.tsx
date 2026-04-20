import { redirect } from "next/navigation";

import { DataPoint } from "@/components/section-card";
import { StatusBadge } from "@/components/status-badge";
import { buttonVariants } from "@/components/ui/button-variants";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { requireAuthenticatedRecruiter } from "@/lib/auth/server";
import { cn } from "@/lib/utils";
import {
  listTeamManagementSnapshot,
  recruiterCanManageTeams,
} from "@/lib/team-access";

import {
  addTeamMemberAction,
  createTeamAction,
  removeTeamMemberAction,
  toggleTeamJobAccessAction,
} from "./actions";

export default async function TeamsPage() {
  const recruiter = await requireAuthenticatedRecruiter();

  if (!recruiterCanManageTeams(recruiter)) {
    redirect("/jobs");
  }

  const snapshot = await listTeamManagementSnapshot(recruiter);

  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-slate-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.95),rgba(246,249,252,0.88))] px-6 py-5 md:px-8">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="space-y-3">
            <h1 className="font-heading text-3xl font-semibold text-slate-950">
              Teams
            </h1>
            <div className="grid gap-3 sm:grid-cols-3">
              <DataPoint
                label="Teams"
                value={snapshot.teams.length}
                detail="Access groups inside this company"
              />
              <DataPoint
                label="Members"
                value={snapshot.users.length}
                detail="Recruiters in this company"
              />
              <DataPoint
                label="Scoped jobs"
                value={snapshot.jobs.length}
                detail="Jobs can be granted to one or more teams"
              />
            </div>
          </div>
        </div>
      </header>

      <div className="grid gap-6 px-6 py-6 md:px-8 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <section className="rounded-[1rem] border border-slate-200/85 bg-white/92 p-5 shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
          <div className="space-y-2">
            <p className="ops-kicker text-slate-500">Create team</p>
            <h2 className="text-xl font-semibold text-slate-950">New access group</h2>
            <p className="text-sm leading-6 text-slate-600">
              Create a team, add recruiters, and then grant the jobs that team should be able to access.
            </p>
          </div>

          <form action={createTeamAction} className="mt-5 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700" htmlFor="team-name">
                Team name
              </label>
              <Input id="team-name" name="name" placeholder="AI opportunity team" required />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700" htmlFor="team-description">
                Description
              </label>
              <Textarea
                id="team-description"
                name="description"
                placeholder="Who should be in this team and what they should manage."
              />
            </div>
            <button
              type="submit"
              className={cn(
                buttonVariants(),
                "rounded-[0.75rem] bg-slate-950 px-4 text-white hover:bg-slate-800",
              )}
            >
              Create team
            </button>
          </form>
        </section>

        <section className="grid gap-4">
          {snapshot.teams.map((team) => (
            <article
              key={team.id}
              className="rounded-[1rem] border border-slate-200/85 bg-white/92 p-5 shadow-[0_10px_24px_rgba(15,23,42,0.04)]"
            >
              <div className="flex flex-col gap-3 border-b border-slate-200/80 pb-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-xl font-semibold text-slate-950">{team.name}</h2>
                    {team.isDefault ? (
                      <StatusBadge intent="info" density="compact">
                        Default
                      </StatusBadge>
                    ) : null}
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {team.description || "No description yet."}
                  </p>
                </div>
                <StatusBadge intent="neutral" density="compact">
                  {team.members.length} members
                </StatusBadge>
              </div>

              <div className="mt-4 grid gap-5 xl:grid-cols-[minmax(0,0.88fr)_minmax(0,1.12fr)]">
                <section className="space-y-3">
                  <div>
                    <p className="ops-kicker text-slate-500">Members</p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      Add existing recruiters by email.
                    </p>
                  </div>

                  <form action={addTeamMemberAction} className="flex flex-col gap-2 sm:flex-row">
                    <input type="hidden" name="teamId" value={team.id} />
                    <Input
                      name="email"
                      type="email"
                      placeholder="recruiter@company.com"
                      required
                    />
                    <button
                      type="submit"
                      className={cn(
                        buttonVariants({ variant: "outline" }),
                        "rounded-[0.75rem]",
                      )}
                    >
                      Add member
                    </button>
                  </form>

                  <div className="space-y-2">
                    {team.members.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center justify-between gap-3 rounded-[0.75rem] border border-slate-200/80 bg-slate-50/80 px-3 py-2"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-slate-950">
                            {member.displayName}
                          </p>
                          <p className="truncate text-xs text-slate-500">{member.email}</p>
                        </div>
                        {!team.isDefault ? (
                          <form action={removeTeamMemberAction}>
                            <input type="hidden" name="teamId" value={team.id} />
                            <input type="hidden" name="userId" value={member.id} />
                            <button
                              type="submit"
                              className={cn(
                                buttonVariants({ variant: "outline", size: "sm" }),
                                "rounded-[0.65rem]",
                              )}
                            >
                              Remove
                            </button>
                          </form>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </section>

                <section className="space-y-3">
                  <div>
                    <p className="ops-kicker text-slate-500">Opportunity access</p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      Toggle which jobs this team can see in the recruiter workspace.
                    </p>
                  </div>

                  <div className="space-y-2">
                    {snapshot.jobs.map((job) => {
                      const enabled = team.grantedJobIds.includes(job.id);

                      return (
                        <div
                          key={job.id}
                          className="flex items-center justify-between gap-3 rounded-[0.75rem] border border-slate-200/80 bg-slate-50/80 px-3 py-2"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-slate-950">
                              {job.title}
                            </p>
                            <p className="truncate text-xs text-slate-500">{job.recruiterSlug}</p>
                          </div>
                          <form action={toggleTeamJobAccessAction}>
                            <input type="hidden" name="teamId" value={team.id} />
                            <input type="hidden" name="jobId" value={job.id} />
                            <input
                              type="hidden"
                              name="enabled"
                              value={enabled ? "true" : "false"}
                            />
                            <button
                              type="submit"
                              className={cn(
                                buttonVariants({
                                  variant: enabled ? "default" : "outline",
                                  size: "sm",
                                }),
                                "rounded-[0.65rem]",
                              )}
                            >
                              {enabled ? "Granted" : "Grant access"}
                            </button>
                          </form>
                        </div>
                      );
                    })}
                  </div>
                </section>
              </div>
            </article>
          ))}
        </section>
      </div>
    </div>
  );
}
