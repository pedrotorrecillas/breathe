import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import ApplyPage from "@/app/(public)/apply/[jobId]/page";

describe("public apply route", () => {
  it("renders outside the recruiter shell", async () => {
    const page = await ApplyPage({
      params: Promise.resolve({
        jobId: "demo-warehouse-associate",
      }),
    });

    render(page);

    expect(
      screen.getByRole("heading", {
        name: /The candidate apply flow is public/i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("navigation", {
        name: /Recruiter primary navigation/i,
      }),
    ).not.toBeInTheDocument();
  });
});
