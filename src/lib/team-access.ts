import { randomUUID } from "node:crypto";

import type { CandidateEvaluation } from "@/domain/evaluations/types";
import type { InterviewRun } from "@/domain/interviews/types";
import type {
  AuthenticatedRecruiter,
  CompanyMembershipRecord,
  JobAccessGrantRecord,
  TeamMembershipRecord,
  TeamRecord,
} from "@/lib/auth/types";
import {
  loadRuntimeStoreState,
  saveRuntimeStoreState,
  type RuntimeStoreState,
} from "@/lib/db/runtime-store";
import type { SeededPublicJobRecord } from "@/lib/job-seeds";

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

function canManageMembership(membership: CompanyMembershipRecord) {
  return membership.role === "owner" || membership.role === "admin";
}

function defaultTeamSlug() {
  return "company-admins";
}

function defaultTeamName() {
  return "Company Admins";
}

const seededDemoCompanyId = "company_seed_demo";

function normalizeCompanyOwnership(input: {
  currentCompanyId: string | null | undefined;
  fallbackCompanyId?: string | null;
  soleCompanyId: string | null;
}) {
  const currentCompanyId = input.currentCompanyId?.trim() || null;
  const fallbackCompanyId = input.fallbackCompanyId?.trim() || null;

  if (currentCompanyId && currentCompanyId !== seededDemoCompanyId) {
    return currentCompanyId;
  }

  if (fallbackCompanyId && fallbackCompanyId !== seededDemoCompanyId) {
    return fallbackCompanyId;
  }

  if (
    input.soleCompanyId &&
    (!currentCompanyId || currentCompanyId === seededDemoCompanyId)
  ) {
    return input.soleCompanyId;
  }

  return currentCompanyId ?? fallbackCompanyId ?? input.soleCompanyId;
}

function uniqueById<T extends { id: string }>(items: T[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.id)) {
      return false;
    }
    seen.add(item.id);
    return true;
  });
}

function companyJobs(state: RuntimeStoreState, companyId: string) {
  return state.jobs.filter((job) => job.companyId === companyId);
}

function teamMembers(
  state: RuntimeStoreState,
  companyId: string,
  teamId: string,
) {
  const memberIds = state.teamMemberships
    .filter((membership) => membership.companyId === companyId && membership.teamId === teamId)
    .map((membership) => membership.userId);

  return uniqueById(
    state.users.filter((user) => memberIds.includes(user.id)),
  );
}

export function normalizeAccessControlState(state: RuntimeStoreState) {
  let didChange = false;
  const soleCompanyId =
    state.companies.length === 1 ? state.companies[0]?.id ?? null : null;

  state.jobs = state.jobs.map((job) => {
    const nextCompanyId = normalizeCompanyOwnership({
      currentCompanyId: job.companyId,
      soleCompanyId,
    });

    if (!nextCompanyId || nextCompanyId === job.companyId) {
      return job;
    }

    didChange = true;
    return {
      ...job,
      companyId: nextCompanyId,
    };
  });

  const jobCompanyById = new Map(
    state.jobs.map((job) => [job.id, job.companyId]),
  );

  state.applications = state.applications.map((application) => {
    const nextCompanyId = normalizeCompanyOwnership({
      currentCompanyId: application.companyId,
      fallbackCompanyId: jobCompanyById.get(application.jobId),
      soleCompanyId,
    });

    if (!nextCompanyId || nextCompanyId === application.companyId) {
      return application;
    }

    didChange = true;
    return {
      ...application,
      companyId: nextCompanyId,
    };
  });

  const applicationCompanyById = new Map(
    state.applications.map((application) => [application.id, application.companyId]),
  );

  state.candidateNotes = state.candidateNotes.map((note) => {
    const nextCompanyId = normalizeCompanyOwnership({
      currentCompanyId: note.companyId,
      fallbackCompanyId:
        applicationCompanyById.get(note.applicationId) ??
        jobCompanyById.get(note.jobId),
      soleCompanyId,
    });

    if (!nextCompanyId || nextCompanyId === note.companyId) {
      return note;
    }

    didChange = true;
    return {
      ...note,
      companyId: nextCompanyId,
    };
  });

  state.interviewRuns = state.interviewRuns.map((interviewRun) => {
    const nextCompanyId = normalizeCompanyOwnership({
      currentCompanyId: interviewRun.companyId,
      fallbackCompanyId:
        applicationCompanyById.get(interviewRun.applicationId) ??
        jobCompanyById.get(interviewRun.jobId),
      soleCompanyId,
    });

    if (!nextCompanyId || nextCompanyId === interviewRun.companyId) {
      return interviewRun;
    }

    didChange = true;
    return {
      ...interviewRun,
      companyId: nextCompanyId,
    } satisfies InterviewRun;
  });

  const interviewRunCompanyById = new Map(
    state.interviewRuns.map((interviewRun) => [interviewRun.id, interviewRun.companyId]),
  );

  state.evaluations = state.evaluations.map((evaluation) => {
    const nextCompanyId = normalizeCompanyOwnership({
      currentCompanyId: evaluation.companyId,
      fallbackCompanyId: interviewRunCompanyById.get(evaluation.interviewRunId),
      soleCompanyId,
    });

    if (!nextCompanyId || nextCompanyId === evaluation.companyId) {
      return evaluation;
    }

    didChange = true;
    return {
      ...evaluation,
      companyId: nextCompanyId,
    } satisfies CandidateEvaluation;
  });

  for (const company of state.companies) {
    const companyId = company.id;
    const now = new Date().toISOString();

    let defaultTeam =
      state.teams.find(
        (team) => team.companyId === companyId && team.slug === defaultTeamSlug(),
      ) ?? null;

    if (!defaultTeam) {
      defaultTeam = {
        id: `team_${randomUUID()}`,
        companyId,
        slug: defaultTeamSlug(),
        name: defaultTeamName(),
        description: "Default admin team for company-wide recruiter access.",
        isDefault: true,
        createdAt: now,
        updatedAt: now,
      };
      state.teams.push(defaultTeam);
      didChange = true;
    }

    const adminMemberships = state.memberships.filter(
      (membership) =>
        membership.companyId === companyId && canManageMembership(membership),
    );

    for (const membership of adminMemberships) {
      const exists = state.teamMemberships.some(
        (teamMembership) =>
          teamMembership.companyId === companyId &&
          teamMembership.teamId === defaultTeam.id &&
          teamMembership.userId === membership.userId,
      );

      if (!exists) {
        state.teamMemberships.push({
          id: `team_membership_${randomUUID()}`,
          companyId,
          teamId: defaultTeam.id,
          userId: membership.userId,
          createdAt: now,
          updatedAt: now,
        });
        didChange = true;
      }
    }

    for (const job of companyJobs(state, companyId)) {
      const hasGrant = state.jobAccessGrants.some(
        (grant) => grant.companyId === companyId && grant.jobId === job.id,
      );

      if (!hasGrant) {
        state.jobAccessGrants.push({
          id: `job_access_${randomUUID()}`,
          companyId,
          teamId: defaultTeam.id,
          jobId: job.id,
          createdAt: now,
          updatedAt: now,
        });
        didChange = true;
      }
    }
  }

  return {
    didChange,
    state,
  };
}

export async function loadNormalizedRuntimeState() {
  const state = await loadRuntimeStoreState();
  const normalized = normalizeAccessControlState(state);

  if (normalized.didChange) {
    await saveRuntimeStoreState(normalized.state);
  }

  return normalized.state;
}

export function recruiterCanManageTeams(recruiter: AuthenticatedRecruiter) {
  return canManageMembership(recruiter.membership);
}

export function getAccessibleJobIdsForRecruiter(
  state: RuntimeStoreState,
  recruiter: AuthenticatedRecruiter,
) {
  const companyId =
    recruiter.company?.id ??
    recruiter.membership?.companyId ??
    recruiter.session?.companyId;

  if (!companyId) {
    return new Set<string>();
  }

  const teamIds = state.teamMemberships
    .filter(
      (membership) =>
        membership.companyId === companyId && membership.userId === recruiter.user.id,
    )
    .map((membership) => membership.teamId);

  return new Set(
    state.jobAccessGrants
      .filter(
        (grant) =>
          grant.companyId === companyId && teamIds.includes(grant.teamId),
      )
      .map((grant) => grant.jobId),
  );
}

export function filterJobsForRecruiter(
  state: RuntimeStoreState,
  recruiter: AuthenticatedRecruiter,
) {
  const accessibleJobIds = getAccessibleJobIdsForRecruiter(state, recruiter);
  return state.jobs.filter(
    (job) =>
      job.companyId === recruiter.company.id && accessibleJobIds.has(job.id),
  );
}

export async function listRecruiterScopedJobs(recruiter: AuthenticatedRecruiter) {
  const state = await loadNormalizedRuntimeState();
  return filterJobsForRecruiter(state, recruiter);
}

export async function getRecruiterAccessProfile(
  recruiter: AuthenticatedRecruiter,
) {
  const state = await loadNormalizedRuntimeState();
  const companyId = recruiter.company.id;
  const teamIds = state.teamMemberships
    .filter(
      (membership) =>
        membership.companyId === companyId && membership.userId === recruiter.user.id,
    )
    .map((membership) => membership.teamId);

  const teams = state.teams.filter(
    (team) => team.companyId === companyId && teamIds.includes(team.id),
  );

  return {
    teams,
    jobs: filterJobsForRecruiter(state, recruiter),
  };
}

export async function findRecruiterScopedJobBySlug(
  recruiter: AuthenticatedRecruiter,
  recruiterSlug: string,
) {
  const jobs = await listRecruiterScopedJobs(recruiter);
  return jobs.find((job) => job.recruiterSlug === recruiterSlug) ?? null;
}

export async function recruiterCanAccessJobId(
  recruiter: AuthenticatedRecruiter,
  jobId: string,
) {
  if (
    !recruiter.company?.id &&
    !recruiter.membership?.companyId &&
    !recruiter.session?.companyId
  ) {
    return true;
  }

  if (!recruiter.company?.id && recruiter.membership?.companyId) {
    const state = await loadNormalizedRuntimeState();
    const application = state.applications.find((item) => item.jobId === jobId);
    return application?.companyId === recruiter.membership.companyId;
  }

  const jobs = await listRecruiterScopedJobs(recruiter);
  return jobs.some((job) => job.id === jobId);
}

export async function createTeam(params: {
  recruiter: AuthenticatedRecruiter;
  name: string;
  description?: string | null;
}) {
  const state = await loadNormalizedRuntimeState();

  if (!recruiterCanManageTeams(params.recruiter)) {
    throw new Error("Only company admins can manage teams.");
  }

  const companyId = params.recruiter.company.id;
  const slugBase = slugify(params.name) || `team-${randomUUID()}`;
  let slug = slugBase;
  let suffix = 2;

  while (
    state.teams.some((team) => team.companyId === companyId && team.slug === slug)
  ) {
    slug = `${slugBase}-${suffix}`;
    suffix += 1;
  }

  const now = new Date().toISOString();
  const team: TeamRecord = {
    id: `team_${randomUUID()}`,
    companyId,
    slug,
    name: params.name.trim(),
    description: params.description?.trim() || null,
    isDefault: false,
    createdAt: now,
    updatedAt: now,
  };
  state.teams.push(team);
  await saveRuntimeStoreState(state);
  return team;
}

export async function addTeamMemberByEmail(params: {
  recruiter: AuthenticatedRecruiter;
  teamId: string;
  email: string;
}) {
  const state = await loadNormalizedRuntimeState();

  if (!recruiterCanManageTeams(params.recruiter)) {
    throw new Error("Only company admins can manage teams.");
  }

  const companyId = params.recruiter.company.id;
  const team = state.teams.find(
    (item) => item.companyId === companyId && item.id === params.teamId,
  );

  if (!team) {
    throw new Error("Team not found.");
  }

  const normalizedEmail = params.email.trim().toLowerCase();
  const user = state.users.find((item) => item.normalizedEmail === normalizedEmail);

  if (!user) {
    throw new Error("That email does not belong to an existing recruiter account.");
  }

  const companyMembership = state.memberships.find(
    (membership) =>
      membership.companyId === companyId && membership.userId === user.id,
  );

  if (!companyMembership) {
    throw new Error("That user does not belong to this company.");
  }

  const existingMembership = state.teamMemberships.find(
    (membership) =>
      membership.companyId === companyId &&
      membership.teamId === team.id &&
      membership.userId === user.id,
  );

  if (existingMembership) {
    return existingMembership;
  }

  const now = new Date().toISOString();
  const teamMembership: TeamMembershipRecord = {
    id: `team_membership_${randomUUID()}`,
    companyId,
    teamId: team.id,
    userId: user.id,
    createdAt: now,
    updatedAt: now,
  };
  state.teamMemberships.push(teamMembership);
  await saveRuntimeStoreState(state);
  return teamMembership;
}

export async function removeTeamMember(params: {
  recruiter: AuthenticatedRecruiter;
  teamId: string;
  userId: string;
}) {
  const state = await loadNormalizedRuntimeState();

  if (!recruiterCanManageTeams(params.recruiter)) {
    throw new Error("Only company admins can manage teams.");
  }

  const nextMemberships = state.teamMemberships.filter(
    (membership) =>
      !(
        membership.companyId === params.recruiter.company.id &&
        membership.teamId === params.teamId &&
        membership.userId === params.userId
      ),
  );

  if (nextMemberships.length === state.teamMemberships.length) {
    return false;
  }

  state.teamMemberships = nextMemberships;
  await saveRuntimeStoreState(state);
  return true;
}

export async function grantTeamAccessToJob(params: {
  recruiter: AuthenticatedRecruiter;
  teamId: string;
  jobId: string;
}) {
  const state = await loadNormalizedRuntimeState();

  if (!recruiterCanManageTeams(params.recruiter)) {
    throw new Error("Only company admins can manage teams.");
  }

  const companyId = params.recruiter.company.id;
  const existingGrant = state.jobAccessGrants.find(
    (grant) =>
      grant.companyId === companyId &&
      grant.teamId === params.teamId &&
      grant.jobId === params.jobId,
  );

  if (existingGrant) {
    return existingGrant;
  }

  const now = new Date().toISOString();
  const grant: JobAccessGrantRecord = {
    id: `job_access_${randomUUID()}`,
    companyId,
    teamId: params.teamId,
    jobId: params.jobId,
    createdAt: now,
    updatedAt: now,
  };
  state.jobAccessGrants.push(grant);
  await saveRuntimeStoreState(state);
  return grant;
}

export async function revokeTeamAccessToJob(params: {
  recruiter: AuthenticatedRecruiter;
  teamId: string;
  jobId: string;
}) {
  const state = await loadNormalizedRuntimeState();

  if (!recruiterCanManageTeams(params.recruiter)) {
    throw new Error("Only company admins can manage teams.");
  }

  const nextGrants = state.jobAccessGrants.filter(
    (grant) =>
      !(
        grant.companyId === params.recruiter.company.id &&
        grant.teamId === params.teamId &&
        grant.jobId === params.jobId
      ),
  );

  if (nextGrants.length === state.jobAccessGrants.length) {
    return false;
  }

  state.jobAccessGrants = nextGrants;
  await saveRuntimeStoreState(state);
  return true;
}

export async function listTeamManagementSnapshot(
  recruiter: AuthenticatedRecruiter,
) {
  const state = await loadNormalizedRuntimeState();
  const companyId = recruiter.company.id;
  const teams = state.teams.filter((team) => team.companyId === companyId);
  const jobs = state.jobs.filter((job) => job.companyId === companyId);
  const companyUsers = state.users.filter((user) =>
    state.memberships.some(
      (membership) =>
        membership.companyId === companyId && membership.userId === user.id,
    ),
  );

  return {
    teams: teams.map((team) => ({
      ...team,
      members: teamMembers(state, companyId, team.id).map((user) => ({
        id: user.id,
        email: user.email,
        displayName: user.displayName,
      })),
      grantedJobIds: state.jobAccessGrants
        .filter((grant) => grant.companyId === companyId && grant.teamId === team.id)
        .map((grant) => grant.jobId),
    })),
    jobs: jobs.map((job) => ({
      id: job.id,
      title: job.title,
      recruiterSlug: job.recruiterSlug,
    })),
    users: companyUsers.map((user) => ({
      id: user.id,
      email: user.email,
      displayName: user.displayName,
    })),
  };
}

export async function listJobAccessSummary(
  recruiter: AuthenticatedRecruiter,
  jobId: string,
) {
  const state = await loadNormalizedRuntimeState();
  const companyId = recruiter.company.id;
  const job = state.jobs.find(
    (item) => item.companyId === companyId && item.id === jobId,
  );

  if (!job) {
    return null;
  }

  const grantedTeamIds = state.jobAccessGrants
    .filter((grant) => grant.companyId === companyId && grant.jobId === job.id)
    .map((grant) => grant.teamId);

  return {
    jobId: job.id,
    teams: state.teams
      .filter((team) => team.companyId === companyId && grantedTeamIds.includes(team.id))
      .map((team) => ({
        id: team.id,
        name: team.name,
        members: teamMembers(state, companyId, team.id).map((user) => ({
          id: user.id,
          email: user.email,
          displayName: user.displayName,
        })),
      })),
  };
}
