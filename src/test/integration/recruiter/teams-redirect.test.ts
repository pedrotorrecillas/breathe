import { describe, expect, it, vi } from "vitest";

const mockRedirect = vi.fn();

vi.mock("next/navigation", () => ({
  redirect: (...args: unknown[]) => mockRedirect(...args),
}));

describe("teams page", () => {
  it("redirects legacy team routes into settings", async () => {
    const { default: TeamsPage } = await import("@/app/(recruiter)/teams/page");

    await TeamsPage();

    expect(mockRedirect).toHaveBeenCalledWith("/settings");
  });
});
