import { loadRuntimeStoreState } from "@/lib/db/runtime-store";

async function main() {
  const state = await loadRuntimeStoreState();

  console.log(
    JSON.stringify(
      {
        companies: state.companies.map((company) => ({
          id: company.id,
          slug: company.slug,
          name: company.name,
          defaultWorkspaceKey: company.defaultWorkspaceKey,
        })),
        users: state.users.map((user) => ({
          id: user.id,
          email: user.email,
          authProvider: user.authProvider,
        })),
        memberships: state.memberships.map((membership) => ({
          id: membership.id,
          companyId: membership.companyId,
          userId: membership.userId,
          role: membership.role,
          workspaceKey: membership.workspaceKey,
        })),
        jobs: state.jobs.map((job) => ({
          id: job.id,
          recruiterSlug: job.recruiterSlug,
          title: job.title,
        })),
      },
      null,
      2,
    ),
  );
}

void main();
