import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import NewJobPage from "@/app/(recruiter)/jobs/new/page";

describe("create-job route", () => {
  it("renders the core recruiter inputs", () => {
    render(<NewJobPage />);

    expect(screen.getByLabelText(/Job title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Interview language/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Job description/i)).toBeInTheDocument();
  });

  it("keeps draft generation disabled until required inputs are valid", () => {
    render(<NewJobPage />);

    const generateButton = screen.getAllByRole("button", {
      name: /Generate draft/i,
    })[0];

    expect(generateButton).toBeDisabled();

    fireEvent.change(screen.getAllByLabelText(/Job title/i)[0], {
      target: { value: "Warehouse Associate" },
    });
    fireEvent.change(screen.getAllByLabelText(/Job description/i)[0], {
      target: {
        value:
          "Warehouse Associate role based in Madrid for a night shift operation with weekend availability and loading tasks.",
      },
    });

    expect(generateButton).not.toBeDisabled();
  });

  it("renders editable job conditions after extraction", () => {
    render(<NewJobPage />);

    fireEvent.change(screen.getAllByLabelText(/Job title/i)[0], {
      target: { value: "Warehouse Associate" },
    });
    fireEvent.change(screen.getAllByLabelText(/Job description/i)[0], {
      target: {
        value:
          "Warehouse Associate role based in Madrid for a night shift operation. Salary starts at EUR 22,000 gross yearly and weekend availability is required.",
      },
    });

    fireEvent.click(
      screen.getAllByRole("button", { name: /Generate draft/i })[0]!,
    );

    expect(
      screen.getAllByRole("heading", { name: /Job conditions/i })[0],
    ).toBeInTheDocument();
    expect(screen.getAllByLabelText(/Salary label/i)[0]).toBeInTheDocument();
  });
});
