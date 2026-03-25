import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { JobDetailWorkspace } from "@/components/job-detail-workspace";

describe("job detail pipeline", () => {
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
});
