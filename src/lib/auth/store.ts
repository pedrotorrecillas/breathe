import { createHash, randomBytes, randomUUID } from "node:crypto";

import {
  loadRuntimeStoreState,
  saveRuntimeStoreState,
  type RuntimeStoreState,
} from "@/lib/db/runtime-store";
import { getDatabaseClient, hasDatabaseUrl } from "@/lib/db/client";

import { SESSION_TTL_MS } from "@/lib/auth/constants";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import type {
  AuthSessionRecord,
  AuthState,
  AuthenticatedRecruiter,
  AuthUserRecord,
  CompanyMembershipRecord,
  CompanyMembershipRole,
  CompanyRecord,
} from "@/lib/auth/types";
import {
  companiesTable,
  companyMembershipsTable,
  sessionsTable,
  usersTable,
} from "@/lib/db/schema";

type SeededCredentials = {
  companyName: string;
  companySlug: string;
  email: string;
  name: string;
  password: string;
  workspaceKey: string | null;
};

const SESSION_LAST_SEEN_REFRESH_MS = 5 * 60 * 1000;

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function normalizeSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

function cloneAuthState(state: RuntimeStoreState): AuthState {
  return {
    companies: [...state.companies],
    memberships: [...state.memberships],
    sessions: [...state.sessions],
    users: [...state.users],
  };
}

async function loadAuthState() {
  const state = await loadRuntimeStoreState();
  return {
    auth: cloneAuthState(state),
    state,
  };
}

async function saveAuthState(state: RuntimeStoreState, auth: AuthState) {
  if (hasDatabaseUrl()) {
    const db = getDatabaseClient();

    await db.transaction(async (tx) => {
      await tx.delete(companyMembershipsTable);
      await tx.delete(sessionsTable);
      await tx.delete(usersTable);
      await tx.delete(companiesTable);

      if (auth.companies.length > 0) {
        await tx.insert(companiesTable).values(
          auth.companies.map((item, index) => ({
            id: item.id,
            slug: item.slug,
            name: item.name,
            defaultWorkspaceKey: item.defaultWorkspaceKey,
            position: index,
            payload: item,
          })),
        );
      }

      if (auth.users.length > 0) {
        await tx.insert(usersTable).values(
          auth.users.map((item, index) => ({
            id: item.id,
            email: item.email,
            normalizedEmail: item.normalizedEmail,
            passwordHash: item.passwordHash,
            authProvider: item.authProvider,
            position: index,
            payload: item,
          })),
        );
      }

      if (auth.memberships.length > 0) {
        await tx.insert(companyMembershipsTable).values(
          auth.memberships.map((item, index) => ({
            id: item.id,
            companyId: item.companyId,
            userId: item.userId,
            role: item.role,
            workspaceKey: item.workspaceKey,
            position: index,
            payload: item,
          })),
        );
      }

      if (auth.sessions.length > 0) {
        await tx.insert(sessionsTable).values(
          auth.sessions.map((item, index) => ({
            id: item.id,
            userId: item.userId,
            companyId: item.companyId,
            membershipId: item.membershipId,
            tokenHash: item.tokenHash,
            activeWorkspaceKey: item.activeWorkspaceKey,
            expiresAt: item.expiresAt,
            lastSeenAt: item.lastSeenAt,
            position: index,
            payload: item,
          })),
        );
      }
    });

    return;
  }

  state.companies = auth.companies;
  state.memberships = auth.memberships;
  state.sessions = auth.sessions;
  state.users = auth.users;
  await saveRuntimeStoreState(state);
}

function shouldRefreshSessionLastSeen(
  session: AuthSessionRecord,
  now: Date,
) {
  const lastSeenAt = new Date(session.lastSeenAt).getTime();

  if (Number.isNaN(lastSeenAt)) {
    return true;
  }

  return now.getTime() - lastSeenAt >= SESSION_LAST_SEEN_REFRESH_MS;
}

function readSeededCredentials(): SeededCredentials | null {
  const email = process.env.AUTH_SEED_EMAIL?.trim();
  const password = process.env.AUTH_SEED_PASSWORD;

  if (!email || !password) {
    return null;
  }

  const companyName =
    process.env.AUTH_SEED_COMPANY_NAME?.trim() || "Breathe Recruiting";
  const companySlug =
    normalizeSlug(process.env.AUTH_SEED_COMPANY_SLUG || companyName) ||
    "breathe";
  const name = process.env.AUTH_SEED_NAME?.trim() || "Recruiter Admin";
  const workspaceKey = process.env.AUTH_SEED_WORKSPACE_KEY?.trim() || null;

  return {
    companyName,
    companySlug,
    email,
    name,
    password,
    workspaceKey,
  };
}

export async function ensureSeededAuthState() {
  const seededCredentials = readSeededCredentials();
  const runtimeState = await loadRuntimeStoreState();

  if (!seededCredentials) {
    return {
      hasSeedCredentials: false,
      hasUsers: runtimeState.users.length > 0,
    };
  }

  const { auth, state } = {
    auth: cloneAuthState(runtimeState),
    state: runtimeState,
  };
  const normalizedEmail = normalizeEmail(seededCredentials.email);
  const now = new Date().toISOString();
  let authChanged = false;

  let company =
    auth.companies.find(
      (item) => item.slug === seededCredentials.companySlug,
    ) ?? null;

  if (!company) {
    company = {
      id: `company_${randomUUID()}`,
      slug: seededCredentials.companySlug,
      name: seededCredentials.companyName,
      defaultWorkspaceKey: seededCredentials.workspaceKey,
      createdAt: now,
      updatedAt: now,
    };
    auth.companies.push(company);
    authChanged = true;
  }

  let user =
    auth.users.find((item) => item.normalizedEmail === normalizedEmail) ?? null;

  if (!user) {
    user = {
      id: `user_${randomUUID()}`,
      email: seededCredentials.email,
      normalizedEmail,
      displayName: seededCredentials.name,
      passwordHash: await hashPassword(seededCredentials.password),
      authProvider: "password",
      createdAt: now,
      updatedAt: now,
    };
    auth.users.push(user);
    authChanged = true;
  }

  const existingMembership = auth.memberships.find(
    (item) => item.companyId === company.id && item.userId === user.id,
  );

  if (!existingMembership) {
    auth.memberships.push({
      id: `membership_${randomUUID()}`,
      companyId: company.id,
      userId: user.id,
      role: "owner",
      workspaceKey: seededCredentials.workspaceKey,
      createdAt: now,
      updatedAt: now,
    });
    authChanged = true;
  }

  if (
    company.name !== seededCredentials.companyName ||
    company.defaultWorkspaceKey !== seededCredentials.workspaceKey
  ) {
    company.name = seededCredentials.companyName;
    company.defaultWorkspaceKey = seededCredentials.workspaceKey;
    company.updatedAt = now;
    authChanged = true;
  }

  if (
    user.email !== seededCredentials.email ||
    user.displayName !== seededCredentials.name
  ) {
    user.email = seededCredentials.email;
    user.displayName = seededCredentials.name;
    user.updatedAt = now;
    authChanged = true;
  }

  const passwordMatches = await verifyPassword(
    seededCredentials.password,
    user.passwordHash,
  );

  if (!passwordMatches) {
    user.passwordHash = await hashPassword(seededCredentials.password);
    user.updatedAt = now;
    authChanged = true;
  }

  if (authChanged) {
    await saveAuthState(state, auth);
  }

  return {
    hasSeedCredentials: true,
    hasUsers: auth.users.length > 0,
  };
}

export async function getAuthSetupState() {
  return ensureSeededAuthState();
}

function hashSessionToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function createSessionRecord(
  user: AuthUserRecord,
  company: CompanyRecord,
  membership: CompanyMembershipRecord,
) {
  const issuedAt = new Date();
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(issuedAt.getTime() + SESSION_TTL_MS).toISOString();

  const session: AuthSessionRecord = {
    id: `session_${randomUUID()}`,
    userId: user.id,
    companyId: company.id,
    membershipId: membership.id,
    tokenHash: hashSessionToken(token),
    activeWorkspaceKey: membership.workspaceKey ?? company.defaultWorkspaceKey,
    expiresAt,
    createdAt: issuedAt.toISOString(),
    lastSeenAt: issuedAt.toISOString(),
  };

  return {
    session,
    token,
  };
}

function isSessionExpired(session: AuthSessionRecord, now = Date.now()) {
  return new Date(session.expiresAt).getTime() <= now;
}

function removeExpiredSessions(auth: AuthState, now = Date.now()) {
  const nextSessions = auth.sessions.filter(
    (session) => !isSessionExpired(session, now),
  );
  const changed = nextSessions.length !== auth.sessions.length;

  if (changed) {
    auth.sessions = nextSessions;
  }

  return changed;
}

function findAuthenticatedRecruiter(
  auth: AuthState,
  session: AuthSessionRecord,
): AuthenticatedRecruiter | null {
  const user = auth.users.find((item) => item.id === session.userId);
  const company = auth.companies.find((item) => item.id === session.companyId);
  const membership = auth.memberships.find(
    (item) => item.id === session.membershipId,
  );

  if (!user || !company || !membership) {
    return null;
  }

  return {
    company,
    membership,
    session,
    user,
  };
}

function findPrimaryMembership(
  auth: AuthState,
  userId: string,
): CompanyMembershipRecord | null {
  return auth.memberships.find((item) => item.userId === userId) ?? null;
}

function createAuthenticatedSession(
  auth: AuthState,
  user: AuthUserRecord,
  company: CompanyRecord,
  membership: CompanyMembershipRecord,
) {
  const { session, token } = createSessionRecord(user, company, membership);
  auth.sessions = auth.sessions.filter(
    (item) =>
      item.userId !== user.id ||
      item.companyId !== company.id ||
      item.membershipId !== membership.id,
  );
  auth.sessions.push(session);

  return {
    recruiter: {
      company,
      membership,
      session,
      user,
    },
    token,
  };
}

export async function authenticateUser(email: string, password: string) {
  await ensureSeededAuthState();

  const { auth, state } = await loadAuthState();
  const normalizedEmail = normalizeEmail(email);
  const user = auth.users.find(
    (item) => item.normalizedEmail === normalizedEmail,
  );

  if (!user) {
    return null;
  }

  const passwordMatches = await verifyPassword(password, user.passwordHash);

  if (!passwordMatches) {
    return null;
  }

  const membership = findPrimaryMembership(auth, user.id);

  if (!membership) {
    return null;
  }

  const company = auth.companies.find(
    (item) => item.id === membership.companyId,
  );

  if (!company) {
    return null;
  }

  const authenticated = createAuthenticatedSession(
    auth,
    user,
    company,
    membership,
  );
  await saveAuthState(state, auth);

  return authenticated;
}

export async function authenticateGoogleUser(params: {
  email: string;
  emailVerified: boolean;
}) {
  await ensureSeededAuthState();

  if (!params.emailVerified) {
    return null;
  }

  const { auth, state } = await loadAuthState();
  const normalizedEmail = normalizeEmail(params.email);
  const user = auth.users.find(
    (item) => item.normalizedEmail === normalizedEmail,
  );

  if (!user) {
    return null;
  }

  const membership = findPrimaryMembership(auth, user.id);

  if (!membership) {
    return null;
  }

  const company = auth.companies.find(
    (item) => item.id === membership.companyId,
  );

  if (!company) {
    return null;
  }

  const authenticated = createAuthenticatedSession(
    auth,
    user,
    company,
    membership,
  );
  await saveAuthState(state, auth);

  return authenticated;
}

export async function getAuthenticatedRecruiterBySessionToken(
  sessionToken: string | null | undefined,
) {
  await ensureSeededAuthState();

  if (!sessionToken) {
    return null;
  }

  const { auth, state } = await loadAuthState();
  const authChanged = removeExpiredSessions(auth);
  const tokenHash = hashSessionToken(sessionToken);
  const session = auth.sessions.find((item) => item.tokenHash === tokenHash);

  if (!session) {
    if (authChanged) {
      await saveAuthState(state, auth);
    }

    return null;
  }

  if (isSessionExpired(session)) {
    auth.sessions = auth.sessions.filter((item) => item.id !== session.id);
    await saveAuthState(state, auth);
    return null;
  }

  const recruiter = findAuthenticatedRecruiter(auth, session);

  if (!recruiter) {
    auth.sessions = auth.sessions.filter((item) => item.id !== session.id);
    await saveAuthState(state, auth);
    return null;
  }

  let nextSession = session;
  const now = new Date();

  if (shouldRefreshSessionLastSeen(session, now)) {
    nextSession = {
      ...session,
      lastSeenAt: now.toISOString(),
    };
    auth.sessions = auth.sessions.map((item) =>
      item.id === session.id ? nextSession : item,
    );
    await saveAuthState(state, auth);
  } else if (authChanged) {
    await saveAuthState(state, auth);
  }

  return {
    ...recruiter,
    session: nextSession,
  };
}

export async function invalidateSession(
  sessionToken: string | null | undefined,
) {
  if (!sessionToken) {
    return;
  }

  const { auth, state } = await loadAuthState();
  const nextSessions = auth.sessions.filter(
    (item) => item.tokenHash !== hashSessionToken(sessionToken),
  );

  if (nextSessions.length === auth.sessions.length) {
    return;
  }

  auth.sessions = nextSessions;
  await saveAuthState(state, auth);
}

export async function updateAuthenticatedRecruiterProfile(params: {
  userId: string;
  displayName: string;
}) {
  const { auth, state } = await loadAuthState();
  const user = auth.users.find((item) => item.id === params.userId);

  if (!user) {
    throw new Error("User not found.");
  }

  const nextDisplayName = params.displayName.trim();

  if (!nextDisplayName) {
    throw new Error("Display name is required.");
  }

  if (user.displayName === nextDisplayName) {
    return user;
  }

  user.displayName = nextDisplayName;
  user.updatedAt = new Date().toISOString();
  await saveAuthState(state, auth);
  return user;
}

export async function updateCompanyProfile(params: {
  companyId: string;
  companyName: string;
}) {
  const { auth, state } = await loadAuthState();
  const company = auth.companies.find((item) => item.id === params.companyId);

  if (!company) {
    throw new Error("Company not found.");
  }

  const nextCompanyName = params.companyName.trim();

  if (!nextCompanyName) {
    throw new Error("Company name is required.");
  }

  if (company.name === nextCompanyName) {
    return company;
  }

  company.name = nextCompanyName;
  company.updatedAt = new Date().toISOString();
  await saveAuthState(state, auth);
  return company;
}

export async function createAuthUser(params: {
  companyName: string;
  companySlug?: string;
  displayName: string;
  email: string;
  password: string;
  role?: CompanyMembershipRole;
  workspaceKey?: string | null;
}) {
  const { auth, state } = await loadAuthState();
  const normalizedEmail = normalizeEmail(params.email);
  const now = new Date().toISOString();
  const companySlug =
    normalizeSlug(params.companySlug || params.companyName) ||
    `company-${randomUUID()}`;

  const existingUser = auth.users.find(
    (item) => item.normalizedEmail === normalizedEmail,
  );

  if (existingUser) {
    throw new Error(`A user already exists for ${params.email}.`);
  }

  let company =
    auth.companies.find((item) => item.slug === companySlug) ?? null;

  if (!company) {
    company = {
      id: `company_${randomUUID()}`,
      slug: companySlug,
      name: params.companyName,
      defaultWorkspaceKey: params.workspaceKey ?? null,
      createdAt: now,
      updatedAt: now,
    };
    auth.companies.push(company);
  }

  const user: AuthUserRecord = {
    id: `user_${randomUUID()}`,
    email: params.email,
    normalizedEmail,
    displayName: params.displayName,
    passwordHash: await hashPassword(params.password),
    authProvider: "password",
    createdAt: now,
    updatedAt: now,
  };
  auth.users.push(user);

  auth.memberships.push({
    id: `membership_${randomUUID()}`,
    companyId: company.id,
    userId: user.id,
    role: params.role ?? "owner",
    workspaceKey: params.workspaceKey ?? null,
    createdAt: now,
    updatedAt: now,
  });

  await saveAuthState(state, auth);

  return user;
}
