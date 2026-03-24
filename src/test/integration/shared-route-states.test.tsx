import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import JobDetailPage from "@/app/(recruiter)/jobs/[jobId]/page";
import NewJobPage from "@/app/(recruiter)/jobs/new/page";
import ApplyPage from "@/app/(public)/apply/[jobId]/page";

describe("shared route states", () => {
  it("renders the loading state in the new-job placeholder", () => {
    render(<NewJobPage />);

    expect(
      screen.getByText(
        /Extraction is preparing the first configuration draft/i,
      ),
    ).toBeInTheDocument();
  });

  it("renders the empty state in the recruiter job detail placeholder", async () => {
    const page = await JobDetailPage({
      params: Promise.resolve({
        jobId: "warehouse-associate-madrid",
      }),
    });

    render(page);

    expect(
      screen.getByText(/No candidates have reached this pipeline view yet/i),
    ).toBeInTheDocument();
  });

  it("renders the error state in the public apply placeholder", async () => {
    const page = await ApplyPage({
      params: Promise.resolve({
        jobId: "demo-warehouse-associate",
      }),
    });

    render(page);

    expect(
      screen.getByText(/This job is not currently accepting applications/i),
    ).toBeInTheDocument();
  });
});
