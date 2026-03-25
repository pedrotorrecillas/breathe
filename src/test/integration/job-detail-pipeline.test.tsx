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

  it("updates the reserved detail surface when a card is selected", () => {
    render(<JobDetailWorkspace jobId="warehouse-associate-madrid" />);

    fireEvent.click(screen.getAllByRole("button", { name: /Open candidate Bea Soto/i })[0]!);

    expect(screen.getAllByText(/Selected candidate/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Bea Soto/i).length).toBeGreaterThan(1);
    expect(
      screen.getAllByText(/Consistent order-picking throughput/i).length,
    ).toBeGreaterThan(0);
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
});
