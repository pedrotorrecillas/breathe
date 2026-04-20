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
  it("renders the Breathe landing shell", () => {
    render(<Home />);

    expect(
      screen.getByRole("heading", {
        name: /From application to ready-to-start\./i,
        level: 1,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole("link", { name: /Book a demo/i })[0],
    ).toHaveAttribute("href", "#final-cta");
    expect(screen.getByText(/Automation on top of your ATS, not around it\./i)).toBeInTheDocument();
  });
});
