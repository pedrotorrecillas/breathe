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
      <AppShell>
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
    expect(
      screen.getByText(/Jobs, candidate review, and interview runtime/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/Recruiter content/i)).toBeInTheDocument();
  });

  it("keeps future sections visible but disabled", () => {
    render(
      <AppShell>
        <div>Recruiter content</div>
      </AppShell>,
    );

    expect(
      screen
        .getAllByText(/^Performance$/i)[0]
        ?.closest("[aria-disabled='true']"),
    ).toHaveAttribute("aria-disabled", "true");
  });
});
