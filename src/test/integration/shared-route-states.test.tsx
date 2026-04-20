import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import JobDetailPage from "@/app/(recruiter)/jobs/[jobId]/page";
import NewJobPage from "@/app/(recruiter)/jobs/new/page";
import ApplyPage from "@/app/(public)/apply/[jobId]/page";

describe("shared route states", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders the loading state in the new-job placeholder", () => {
    render(<NewJobPage />);

    expect(
      screen.getByText(/Generate a draft to start editing/i),
    ).toBeInTheDocument();
  });

  it("renders the pipeline workspace in recruiter job detail", async () => {
    const page = await JobDetailPage({
      params: Promise.resolve({
        jobId: "warehouse-associate-madrid",
      }),
    });

    render(page);

    expect(
      screen.queryByText(
        /Review applicants, interview outcomes, and hiring decisions/i,
      ),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/Pipeline workspace/i)).not.toBeInTheDocument();
    expect(screen.getAllByText(/Active/i).length).toBeGreaterThan(0);
    expect(
      screen.getByRole("button", { name: /Rejected/i }),
    ).toBeInTheDocument();
  });

  it("renders the error state in the public apply placeholder", async () => {
    const page = await ApplyPage({
      params: Promise.resolve({
        jobId: "missing-job-link",
      }),
    });

    render(page);

    expect(
      screen.getByText(/This role link is no longer available/i),
    ).toBeInTheDocument();
  });
});
