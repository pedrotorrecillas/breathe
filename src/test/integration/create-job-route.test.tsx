import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import NewJobPage from "@/app/(recruiter)/jobs/new/page";

const extractionDraft = {
  jobConditions: [
    {
      id: "cond_salary",
      code: "salary",
      label: "Salary",
      value: "EUR 22,000 gross yearly",
      state: "complete",
      details: "",
    },
    {
      id: "cond_location",
      code: "location",
      label: "Location",
      value: "Madrid",
      state: "complete",
      details: "",
    },
  ],
  essentialRequirements: [
    {
      id: "essential_warehouse_experience",
      label: "Have previous warehouse experience in outbound operations.",
      importance: "MANDATORY",
    },
  ],
  technicalSkills: [
    {
      id: "technical_scanner_use",
      label: "Use barcode scanners and inventory systems accurately during each shift.",
      importance: "MANDATORY",
    },
  ],
  interpersonalSkills: [
    {
      id: "interpersonal_teamwork",
      label:
        "Coordinate clearly with teammates during loading peaks and shift handovers.",
      importance: "MANDATORY",
    },
  ],
};

describe("create-job route", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input) => {
        const url = typeof input === "string" ? input : input.url;

        if (url.includes("/api/recruiter/jobs/extract")) {
          return {
            ok: true,
            json: async () => ({
              success: true,
              data: extractionDraft,
              warnings: [],
            }),
          };
        }

        return {
          ok: true,
          json: async () => ({
            success: true,
            data: {
              id: "job_warehouse-associate-madrid",
              publicApplyPath: "/apply/warehouse-associate-madrid",
            },
          }),
        };
      }),
    );
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
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

  it("renders editable job conditions after extraction", async () => {
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

    await waitFor(() => {
      expect(
        screen.getAllByRole("heading", { name: /Job conditions/i })[0],
      ).toBeInTheDocument();
    });
    expect(screen.getAllByLabelText(/Salary label/i)[0]).toBeInTheDocument();
  });

  it("renders editable essential requirements after extraction", async () => {
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

    await waitFor(() => {
      expect(
        screen.getAllByRole("heading", { name: /Essential requirements/i })[0],
      ).toBeInTheDocument();
    });
    expect(
      screen.getAllByRole("button", { name: /Mandatory/i })[0],
    ).toBeInTheDocument();
  });

  it("allows recruiters to add technical skills after extraction", async () => {
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

    await waitFor(() => {
      expect(
        screen.getAllByRole("heading", { name: /Technical skills/i })[0],
      ).toBeInTheDocument();
    });

    fireEvent.change(screen.getAllByLabelText(/New technical skill/i)[0], {
      target: { value: "Pallet wrapping machines" },
    });
    fireEvent.click(screen.getAllByRole("button", { name: /Add skill/i })[0]!);

    expect(
      screen.getByDisplayValue(/Pallet wrapping machines/i),
    ).toBeInTheDocument();
  });

  it("allows recruiters to add interpersonal skills after extraction", async () => {
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

    await waitFor(() => {
      expect(
        screen.getAllByRole("heading", { name: /Interpersonal skills/i })[0],
      ).toBeInTheDocument();
    });

    fireEvent.change(screen.getAllByLabelText(/New interpersonal skill/i)[0], {
      target: { value: "Reliability under pressure" },
    });
    fireEvent.click(screen.getAllByRole("button", { name: /Add skill/i })[1]!);

    expect(
      screen.getByDisplayValue(/Reliability under pressure/i),
    ).toBeInTheDocument();
  });

  it("validates contradictory interview limits", async () => {
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

    await waitFor(() => {
      expect(screen.getAllByLabelText(/Total interview limit/i)[0]).toBeInTheDocument();
    });

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

    await waitFor(() => {
      expect(screen.getAllByLabelText(/Publish job action/i)[0]).toBeInTheDocument();
    });
    fireEvent.click(screen.getAllByLabelText(/Publish job action/i)[0]!);

    await waitFor(() => {
      expect(
        screen.getByText(/warehouse-associate-madrid/i),
      ).toBeInTheDocument();
    });
  });
});
