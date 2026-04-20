export type CompanyRecord = {
  id: string;
  slug: string;
  name: string;
  defaultWorkspaceKey: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CompanyMembershipRole = "owner" | "admin" | "recruiter";

export type CompanyMembershipRecord = {
  id: string;
  companyId: string;
  userId: string;
  role: CompanyMembershipRole;
  workspaceKey: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AuthProvider = "password" | "google";

export type AuthUserRecord = {
  id: string;
  email: string;
  normalizedEmail: string;
  displayName: string;
  passwordHash: string;
  authProvider: AuthProvider;
  createdAt: string;
  updatedAt: string;
};

export type AuthSessionRecord = {
  id: string;
  userId: string;
  companyId: string;
  membershipId: string;
  tokenHash: string;
  activeWorkspaceKey: string | null;
  expiresAt: string;
  createdAt: string;
  lastSeenAt: string;
};

export type AuthState = {
  companies: CompanyRecord[];
  memberships: CompanyMembershipRecord[];
  sessions: AuthSessionRecord[];
  users: AuthUserRecord[];
};

export type TeamRecord = {
  id: string;
  companyId: string;
  slug: string;
  name: string;
  description: string | null;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
};

export type TeamMembershipRecord = {
  id: string;
  companyId: string;
  teamId: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
};

export type JobAccessGrantRecord = {
  id: string;
  companyId: string;
  teamId: string;
  jobId: string;
  createdAt: string;
  updatedAt: string;
};

export type AuthenticatedRecruiter = {
  company: CompanyRecord;
  membership: CompanyMembershipRecord;
  session: AuthSessionRecord;
  user: AuthUserRecord;
};
