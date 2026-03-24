import type { ReactNode } from "react";

import { AppShell } from "@/components/app-shell";

type RecruiterLayoutProps = {
  children: ReactNode;
};

export default function RecruiterLayout({ children }: RecruiterLayoutProps) {
  return <AppShell>{children}</AppShell>;
}
