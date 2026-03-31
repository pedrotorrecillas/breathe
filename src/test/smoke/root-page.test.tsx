import { render, screen } from "@testing-library/react";
import type { AnchorHTMLAttributes, ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

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

import Home from "@/app/page";

describe("root smoke", () => {
  it("renders the Clara landing shell", () => {
    render(<Home />);

    expect(
      screen.getByRole("heading", {
        name: /Clara helps recruiters publish jobs, run interviews/i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Open recruiter workspace/i }),
    ).toHaveAttribute("href", "/jobs");
    expect(screen.getByText(/Available areas/i)).toBeInTheDocument();
  });
});
