import { render, screen } from "@testing-library/react";
import type { AnchorHTMLAttributes, ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockUsePathname = vi.fn();

vi.mock("next/navigation", () => ({
  usePathname: () => mockUsePathname(),
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: AnchorHTMLAttributes<HTMLAnchorElement> & {
    href: string;
    children: ReactNode;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

import { AppShell } from "@/components/app-shell";

describe("recruiter shell", () => {
  beforeEach(() => {
    mockUsePathname.mockReturnValue("/jobs");
  });

  it("renders the primary navigation and highlights Jobs by default", () => {
    render(
      <AppShell
        viewer={{
          companyName: "Breathe Recruiting",
          email: "recruiter@breathe.test",
          name: "Recruiter Admin",
        }}
      >
        <div>Recruiter content</div>
      </AppShell>,
    );

    expect(
      screen.getByRole("navigation", { name: /Recruiter primary navigation/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /^Jobs$/i })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.queryByText(/Hiring in one place/i)).not.toBeInTheDocument();
    expect(screen.getByText(/Recruiter content/i)).toBeInTheDocument();
    expect(screen.getByText(/Breathe Recruiting/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Log out/i })).toBeInTheDocument();
  });

  it("keeps future sections visible but disabled", () => {
    render(
      <AppShell
        viewer={{
          companyName: "Breathe Recruiting",
          email: "recruiter@breathe.test",
          name: "Recruiter Admin",
        }}
      >
        <div>Recruiter content</div>
      </AppShell>,
    );

    expect(
      screen
        .getAllByText(/^Performance$/i)[0]
        ?.closest("[aria-disabled='true']"),
    ).toHaveAttribute("aria-disabled", "true");
    expect(
      screen
        .getAllByText(/^Teams$/i)[0]
        ?.closest("[aria-disabled='true']"),
    ).toHaveAttribute("aria-disabled", "true");
    expect(screen.getAllByRole("link", { name: /^Settings$/i })[0]).toHaveAttribute(
      "href",
      "/settings",
    );
    expect(screen.getAllByText(/Coming soon/i).length).toBeGreaterThan(0);
  });
});
