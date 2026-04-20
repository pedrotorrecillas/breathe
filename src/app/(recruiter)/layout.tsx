import type { ReactNode } from "react";

import { AppShell } from "@/components/app-shell";
import { requireAuthenticatedRecruiter } from "@/lib/auth/server";

type RecruiterLayoutProps = {
  children: ReactNode;
};

export default async function RecruiterLayout({
  children,
}: RecruiterLayoutProps) {
  const recruiter = await requireAuthenticatedRecruiter();

  return (
    <AppShell
      viewer={{
        companyName: recruiter.company.name,
        email: recruiter.user.email,
        name: recruiter.user.displayName,
      }}
    >
      {children}
    </AppShell>
  );
}
