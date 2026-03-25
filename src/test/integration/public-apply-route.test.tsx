import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import ApplyPage from "@/app/(public)/apply/[jobId]/page";

describe("public apply route", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders outside the recruiter shell", async () => {
    const page = await ApplyPage({
      params: Promise.resolve({
        jobId: "demo-warehouse-associate",
      }),
    });

    render(page);

    expect(
      screen.getByRole("heading", {
        name: /Apply to Warehouse Associate/i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("navigation", {
        name: /Recruiter primary navigation/i,
      }),
    ).not.toBeInTheDocument();
    expect(screen.getByText(/Night shift warehouse intake/i)).toBeInTheDocument();
  });

  it("renders a usable unavailable state for an invalid public job id", async () => {
    const page = await ApplyPage({
      params: Promise.resolve({
        jobId: "missing-job-link",
      }),
    });

    render(page);

    expect(
      screen.getByText(/This job link is no longer available/i),
    ).toBeInTheDocument();
  });

  it("blocks invalid submission and shows validation errors", async () => {
    const page = await ApplyPage({
      params: Promise.resolve({
        jobId: "demo-warehouse-associate",
      }),
    });

    render(page);

    fireEvent.click(
      screen.getByRole("button", { name: /Submit and receive call/i }),
    );

    expect(screen.getByText(/Full name is required/i)).toBeInTheDocument();
    expect(screen.getByText(/Phone is required/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Provide either a CV upload or a LinkedIn URL/i),
    ).toBeInTheDocument();
  });
});
