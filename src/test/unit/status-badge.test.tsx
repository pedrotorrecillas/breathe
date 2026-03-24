import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { scoreBadgeIntent, StatusBadge } from "@/components/status-badge";

describe("status badge", () => {
  it("renders the six recruiter-facing score states", () => {
    const scores = [
      "Outstanding",
      "Great",
      "Good",
      "Average",
      "Low",
      "Poor",
    ] as const;

    render(
      <div>
        {scores.map((score) => (
          <StatusBadge key={score} intent={scoreBadgeIntent[score]}>
            {score}
          </StatusBadge>
        ))}
      </div>,
    );

    for (const score of scores) {
      expect(screen.getByText(score)).toBeInTheDocument();
    }
  });

  it("renders a special human-requested badge", () => {
    render(<StatusBadge intent="special">Human requested</StatusBadge>);

    expect(screen.getByText(/Human requested/i)).toBeInTheDocument();
  });
});
