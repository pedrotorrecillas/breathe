import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  EmptyState,
  ErrorState,
  LoadingState,
} from "@/components/shared-states";

describe("shared states", () => {
  it("renders the loading state content", () => {
    render(
      <LoadingState
        title="Preparing the job draft"
        description="Breathe is extracting the initial configuration."
      />,
    );

    expect(screen.getByText(/Preparing the job draft/i)).toBeInTheDocument();
    expect(
      screen.getByText(/extracting the initial configuration/i),
    ).toBeInTheDocument();
  });

  it("renders the empty state content", () => {
    render(
      <EmptyState
        title="Nothing is here yet"
        description="Candidates will appear after the first submission."
      />,
    );

    expect(screen.getByText(/Nothing is here yet/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Candidates will appear after the first submission/i),
    ).toBeInTheDocument();
  });

  it("renders the error state content", () => {
    render(
      <ErrorState
        title="This route is unavailable"
        description="The job might be inactive or expired."
      />,
    );

    expect(screen.getByText(/This route is unavailable/i)).toBeInTheDocument();
    expect(
      screen.getByText(/The job might be inactive or expired/i),
    ).toBeInTheDocument();
  });
});
