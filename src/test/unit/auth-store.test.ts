import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  authenticateUser,
  authenticateGoogleUser,
  createAuthUser,
  getAuthenticatedRecruiterBySessionToken,
  getAuthSetupState,
  invalidateSession,
} from "@/lib/auth/store";
import { resetRuntimeStoreState } from "@/lib/db/runtime-store";

const ORIGINAL_ENV = {
  AUTH_SEED_COMPANY_NAME: process.env.AUTH_SEED_COMPANY_NAME,
  AUTH_SEED_COMPANY_SLUG: process.env.AUTH_SEED_COMPANY_SLUG,
  AUTH_SEED_EMAIL: process.env.AUTH_SEED_EMAIL,
  AUTH_SEED_NAME: process.env.AUTH_SEED_NAME,
  AUTH_SEED_PASSWORD: process.env.AUTH_SEED_PASSWORD,
  AUTH_SEED_WORKSPACE_KEY: process.env.AUTH_SEED_WORKSPACE_KEY,
};

function resetAuthEnv() {
  for (const [key, value] of Object.entries(ORIGINAL_ENV)) {
    if (typeof value === "string") {
      process.env[key] = value;
    } else {
      delete process.env[key];
    }
  }
}

describe("auth store", () => {
  beforeEach(async () => {
    resetAuthEnv();
    await resetRuntimeStoreState();
  });

  afterEach(async () => {
    resetAuthEnv();
    await resetRuntimeStoreState();
  });

  it("creates company auth records and resolves the active recruiter session", async () => {
    await createAuthUser({
      companyName: "Breathe Recruiting",
      displayName: "Recruiter Admin",
      email: "recruiter@breathe.test",
      password: "super-secret-password",
      workspaceKey: "hq",
    });

    const authenticated = await authenticateUser(
      "recruiter@breathe.test",
      "super-secret-password",
    );

    expect(authenticated).not.toBeNull();
    expect(authenticated?.recruiter.company.name).toBe("Breathe Recruiting");
    expect(authenticated?.recruiter.membership.workspaceKey).toBe("hq");

    const recruiter = await getAuthenticatedRecruiterBySessionToken(
      authenticated?.token,
    );

    expect(recruiter?.user.email).toBe("recruiter@breathe.test");
    expect(recruiter?.company.slug).toBe("breathe-recruiting");

    await invalidateSession(authenticated?.token);

    await expect(
      getAuthenticatedRecruiterBySessionToken(authenticated?.token),
    ).resolves.toBeNull();
  });

  it("bootstraps the initial recruiter account from auth seed env vars", async () => {
    process.env.AUTH_SEED_COMPANY_NAME = "Acme Logistics";
    process.env.AUTH_SEED_COMPANY_SLUG = "acme-logistics";
    process.env.AUTH_SEED_EMAIL = "owner@acme.test";
    process.env.AUTH_SEED_NAME = "Acme Owner";
    process.env.AUTH_SEED_PASSWORD = "seeded-password";
    process.env.AUTH_SEED_WORKSPACE_KEY = "operations";

    await expect(getAuthSetupState()).resolves.toEqual({
      hasSeedCredentials: true,
      hasUsers: true,
    });

    const authenticated = await authenticateUser(
      "owner@acme.test",
      "seeded-password",
    );

    expect(authenticated?.recruiter.company.slug).toBe("acme-logistics");
    expect(authenticated?.recruiter.session.activeWorkspaceKey).toBe(
      "operations",
    );
  });

  it("creates a recruiter session for verified Google accounts that match a local user", async () => {
    await createAuthUser({
      companyName: "Breathe Recruiting",
      displayName: "Recruiter Admin",
      email: "recruiter@breathe.test",
      password: "super-secret-password",
      workspaceKey: "hq",
    });

    const authenticated = await authenticateGoogleUser({
      email: "Recruiter@BREATHE.test",
      emailVerified: true,
    });

    expect(authenticated).not.toBeNull();
    expect(authenticated?.recruiter.user.email).toBe("recruiter@breathe.test");
    expect(authenticated?.recruiter.company.slug).toBe("breathe-recruiting");
    expect(authenticated?.recruiter.session.activeWorkspaceKey).toBe("hq");
  });

  it("rejects Google sign-in when the email is not verified or not mapped locally", async () => {
    await createAuthUser({
      companyName: "Breathe Recruiting",
      displayName: "Recruiter Admin",
      email: "recruiter@breathe.test",
      password: "super-secret-password",
    });

    await expect(
      authenticateGoogleUser({
        email: "recruiter@breathe.test",
        emailVerified: false,
      }),
    ).resolves.toBeNull();

    await expect(
      authenticateGoogleUser({
        email: "unknown@breathe.test",
        emailVerified: true,
      }),
    ).resolves.toBeNull();
  });
});
