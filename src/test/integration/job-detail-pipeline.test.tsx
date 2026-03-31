import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { JobDetailWorkspace } from "@/components/job-detail-workspace";

describe("job detail pipeline", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders structured candidate cards with triage information", () => {
    render(<JobDetailWorkspace jobId="warehouse-associate-madrid" />);

    expect(screen.getAllByText(/Lucia Torres/i).length).toBeGreaterThan(0);
    expect(
      screen.getAllByText(/Forklift-certified warehouse operator/i).length,
    ).toBeGreaterThan(0);
    expect(screen.getAllByText(/Great/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Applied · Today, 09:12/i).length).toBeGreaterThan(0);
  });

  it("updates the reserved detail surface with a candidate report", () => {
    render(<JobDetailWorkspace jobId="warehouse-associate-madrid" />);

    fireEvent.click(screen.getAllByRole("button", { name: /Open candidate Bea Soto/i })[0]!);

    expect(screen.getAllByText(/Selected candidate/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Bea Soto/i).length).toBeGreaterThan(1);
    expect(
      screen.getAllByText(/Consistent order-picking throughput/i).length,
    ).toBeGreaterThan(0);
    expect(screen.getByText(/Candidate report/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Recruiter-facing evaluation summary/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/Essential requirements/i)).toBeInTheDocument();
    expect(screen.getByText(/Technical skills/i)).toBeInTheDocument();
    expect(screen.getByText(/Interpersonal skills/i)).toBeInTheDocument();
    expect(screen.getByText(/Forklift certification/i)).toBeInTheDocument();
    expect(screen.getByText(/AI recommendation/i)).toBeInTheDocument();
    expect(screen.getByText(/84\.3 \/ 100/i)).toBeInTheDocument();
    expect(screen.getByText(/Audio review/i)).toBeInTheDocument();
  });

  it("shows lightweight operational badges only in Applicants", () => {
    render(<JobDetailWorkspace jobId="warehouse-associate-madrid" />);

    expect(screen.getAllByText(/Calling now/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Awaiting call/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Human requested/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Interview complete/i).length).toBeGreaterThan(0);
    expect(screen.queryByText(/human_requested/i)).not.toBeInTheDocument();
  });

  it("keeps rejected candidates in a separate tab with visible reasons", () => {
    render(<JobDetailWorkspace jobId="warehouse-associate-madrid" />);

    fireEvent.click(screen.getAllByRole("button", { name: /Rejected/i })[0]!);

    expect(screen.getByText(/Separate review context/i)).toBeInTheDocument();
    expect(screen.getByText(/Schedule mismatch/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Commute risk/i).length).toBeGreaterThan(0);
    expect(
      screen.queryByText(/Completed interview runs ready for recruiter triage/i),
    ).not.toBeInTheDocument();
  });

  it("supports explicit shortlist and reject actions", () => {
    render(<JobDetailWorkspace jobId="warehouse-associate-madrid" />);

    fireEvent.click(screen.getAllByRole("button", { name: /^Shortlist$/i })[0]!);

    expect(screen.getAllByRole("button", { name: /^Shortlist$/i })).toHaveLength(3);

    fireEvent.click(screen.getAllByRole("button", { name: /^Reject$/i })[0]!);

    expect(screen.getByText(/Separate review context/i)).toBeInTheDocument();
    expect(screen.getByText(/Rejected from applicants/i)).toBeInTheDocument();
  });

  it("supports hire and move-back actions for recruiter-controlled stages", () => {
    render(<JobDetailWorkspace jobId="warehouse-associate-madrid" />);

    fireEvent.click(screen.getAllByRole("button", { name: /^Hire$/i })[0]!);

    expect(screen.getAllByRole("button", { name: /^Hire$/i })).toHaveLength(1);
    expect(
      screen.getAllByRole("button", { name: /^Back to shortlisted$/i }),
    ).toHaveLength(1);

    fireEvent.click(
      screen.getAllByRole("button", { name: /^Back to shortlisted$/i })[0]!,
    );

    expect(screen.getAllByRole("button", { name: /^Hire$/i })).toHaveLength(2);
  });

  it("opens and closes candidate detail without losing pipeline context", () => {
    render(<JobDetailWorkspace jobId="warehouse-associate-madrid" />);

    fireEvent.click(screen.getAllByRole("button", { name: /Rejected/i })[0]!);
    fireEvent.click(
      screen.getByRole("button", { name: /Open candidate Marta Gil/i }),
    );

    expect(screen.getByText(/Candidate report/i)).toBeInTheDocument();
    expect(screen.getAllByText(/^Low$/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/47\.8 \/ 100/i)).toBeInTheDocument();
    expect(screen.getByText(/AI recommendation/i)).toBeInTheDocument();
    expect(screen.getByText(/Audio review/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Close panel/i }));

    expect(
      screen.getByText(/Select a candidate card to inspect detail/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/Separate review context/i)).toBeInTheDocument();
  });
});
