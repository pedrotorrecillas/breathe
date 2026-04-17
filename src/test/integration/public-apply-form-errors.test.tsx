import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { PublicApplyForm } from "@/components/public-apply-form";

describe("public apply form errors", () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("shows a stable error when the server response body is not valid json", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        json: async () => {
          throw new SyntaxError("Unexpected end of JSON input");
        },
      })),
    );

    render(
      <PublicApplyForm
        jobId="job_product-manager"
        interviewLanguage="en"
      />,
    );

    fireEvent.change(screen.getByLabelText(/Full name/i), {
      target: { value: "Pablo Antonio" },
    });
    fireEvent.change(screen.getByLabelText(/Phone/i), {
      target: { value: "+34 600 123 456" },
    });
    fireEvent.change(screen.getByLabelText(/LinkedIn URL/i), {
      target: { value: "https://linkedin.com/in/pablo-antonio" },
    });
    fireEvent.click(screen.getByLabelText(/Accept terms/i));
    fireEvent.click(
      screen.getByRole("button", { name: /Apply now/i }),
    );

    await waitFor(() => {
      expect(
        screen.getByText(
          /Application submission failed\. Please try again in a moment\./i,
        ),
      ).toBeInTheDocument();
    });
  });
});
