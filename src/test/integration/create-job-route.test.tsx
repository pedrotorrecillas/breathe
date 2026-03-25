import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import NewJobPage from "@/app/(recruiter)/jobs/new/page";

describe("create-job route", () => {
  afterEach(() => {
    cleanup();
  });

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

  it("renders editable essential requirements after extraction", () => {
    render(<NewJobPage />);

    fireEvent.change(screen.getAllByLabelText(/Job title/i)[0], {
      target: { value: "Warehouse Associate" },
    });
    fireEvent.change(screen.getAllByLabelText(/Job description/i)[0], {
      target: {
        value:
          "Warehouse Associate role based in Madrid for a night shift operation. Candidates must have previous warehouse experience and be able to lift up to 20kg.",
      },
    });
    fireEvent.click(
      screen.getAllByRole("button", { name: /Generate draft/i })[0]!,
    );

    expect(
      screen.getAllByRole("heading", { name: /Essential requirements/i })[0],
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole("button", { name: /Mandatory/i })[0],
    ).toBeInTheDocument();
  });

  it("allows recruiters to add technical skills after extraction", () => {
    render(<NewJobPage />);

    fireEvent.change(screen.getAllByLabelText(/Job title/i)[0], {
      target: { value: "Warehouse Associate" },
    });
    fireEvent.change(screen.getAllByLabelText(/Job description/i)[0], {
      target: {
        value:
          "Warehouse Associate role based in Madrid. Candidates must have previous warehouse experience and barcode scanner knowledge. Forklift experience is valuable.",
      },
    });
    fireEvent.click(
      screen.getAllByRole("button", { name: /Generate draft/i })[0]!,
    );

    fireEvent.change(screen.getAllByLabelText(/New technical skill/i)[0], {
      target: { value: "Pallet wrapping machines" },
    });
    fireEvent.click(screen.getAllByRole("button", { name: /Add skill/i })[0]!);

    expect(
      screen.getAllByRole("heading", { name: /Technical skills/i })[0],
    ).toBeInTheDocument();
    expect(
      screen.getByDisplayValue(/Pallet wrapping machines/i),
    ).toBeInTheDocument();
  });

  it("allows recruiters to add interpersonal skills after extraction", () => {
    render(<NewJobPage />);

    fireEvent.change(screen.getAllByLabelText(/Job title/i)[0], {
      target: { value: "Warehouse Associate" },
    });
    fireEvent.change(screen.getAllByLabelText(/Job description/i)[0], {
      target: {
        value:
          "Warehouse Associate role based in Madrid. Candidates must have previous warehouse experience. Strong communication and teamwork are important in the loading dock.",
      },
    });
    fireEvent.click(
      screen.getAllByRole("button", { name: /Generate draft/i })[0]!,
    );

    fireEvent.change(screen.getAllByLabelText(/New interpersonal skill/i)[0], {
      target: { value: "Reliability under pressure" },
    });
    fireEvent.click(screen.getAllByRole("button", { name: /Add skill/i })[1]!);

    expect(
      screen.getAllByRole("heading", { name: /Interpersonal skills/i })[0],
    ).toBeInTheDocument();
    expect(
      screen.getByDisplayValue(/Reliability under pressure/i),
    ).toBeInTheDocument();
  });

  it("validates contradictory interview limits", () => {
    render(<NewJobPage />);

    fireEvent.change(screen.getAllByLabelText(/Job title/i)[0], {
      target: { value: "Warehouse Associate" },
    });
    fireEvent.change(screen.getAllByLabelText(/Job description/i)[0], {
      target: {
        value:
          "Warehouse Associate role based in Madrid. Candidates must have previous warehouse experience. Strong communication and teamwork are important in the loading dock.",
      },
    });
    fireEvent.click(
      screen.getAllByRole("button", { name: /Generate draft/i })[0]!,
    );

    fireEvent.change(screen.getAllByLabelText(/Total interview limit/i)[0], {
      target: { value: "5" },
    });
    fireEvent.change(screen.getAllByLabelText(/Outstanding cap/i)[0], {
      target: { value: "8" },
    });

    expect(
      screen.getByText(
        /Outstanding cap cannot exceed the total interview limit/i,
      ),
    ).toBeInTheDocument();
  });

  it("publishes a job and shows the generated public apply link", async () => {
    render(<NewJobPage />);

    fireEvent.change(screen.getAllByLabelText(/Job title/i)[0], {
      target: { value: "Warehouse Associate Madrid" },
    });
    fireEvent.change(screen.getAllByLabelText(/Job description/i)[0], {
      target: {
        value:
          "Warehouse Associate role based in Madrid. Candidates must have previous warehouse experience. Strong communication and teamwork are important in the loading dock. Salary starts at EUR 22,000 gross yearly.",
      },
    });
    fireEvent.click(
      screen.getAllByRole("button", { name: /Generate draft/i })[0]!,
    );
    fireEvent.click(screen.getAllByLabelText(/Publish job action/i)[0]!);

    await waitFor(() => {
      expect(
        screen.getByText(/\/apply\/warehouse-associate-madrid/i),
      ).toBeInTheDocument();
    });
  });
});
