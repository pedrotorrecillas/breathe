import { randomBytes, randomUUID } from "node:crypto";

import { hashPassword } from "@/lib/auth/password";
import { loadRuntimeStoreState, saveRuntimeStoreState } from "@/lib/db/runtime-store";

async function main() {
  const email = process.argv[2]?.trim().toLowerCase();

  if (!email) {
    throw new Error("Usage: tsx scripts/grant-google-recruiter-access.ts <email>");
  }

  const state = await loadRuntimeStoreState();
  const existing = state.users.find((user) => user.normalizedEmail === email);

  if (existing) {
    console.log(
      JSON.stringify(
        {
          ok: true,
          existed: true,
          email,
          userId: existing.id,
        },
        null,
        2,
      ),
    );
    return;
  }

  const company = state.companies.find((item) => item.slug === "breathe-staging") ?? state.companies[0];

  if (!company) {
    throw new Error("No company found in auth state.");
  }

  const templateMembership =
    state.memberships.find((item) => item.companyId === company.id) ?? null;
  const now = new Date().toISOString();
  const userId = `user_${randomUUID()}`;
  const membershipId = `membership_${randomUUID()}`;

  state.users.push({
    id: userId,
    email,
    normalizedEmail: email,
    displayName: "Pedro Torrecillas",
    passwordHash: await hashPassword(randomBytes(24).toString("base64url")),
    authProvider: "google",
    createdAt: now,
    updatedAt: now,
  });

  state.memberships.push({
    id: membershipId,
    companyId: company.id,
    userId,
    role: templateMembership?.role ?? "owner",
    workspaceKey: templateMembership?.workspaceKey ?? company.defaultWorkspaceKey ?? null,
    createdAt: now,
    updatedAt: now,
  });

  await saveRuntimeStoreState(state);

  console.log(
    JSON.stringify(
      {
        ok: true,
        existed: false,
        email,
        userId,
        membershipId,
        companyId: company.id,
      },
      null,
      2,
    ),
  );
}

void main();
