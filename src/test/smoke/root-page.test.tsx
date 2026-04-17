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
        name: /Infrastructure for hiring at scale/i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole("link", { name: /Book a demo/i })[0],
    ).toHaveAttribute("href", "/jobs");
    expect(screen.getByText(/How Breathe works/i)).toBeInTheDocument();
  });
});
