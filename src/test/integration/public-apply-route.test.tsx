import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import ApplyPage from "@/app/(public)/apply/[jobId]/page";

describe("public apply route", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders outside the recruiter shell", async () => {
    const page = await ApplyPage({
      params: Promise.resolve({
        jobId: "demo-warehouse-associate",
      }),
    });

    render(page);

    expect(
      screen.getByRole("heading", {
        name: /Apply to Warehouse Associate/i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("navigation", {
        name: /Recruiter primary navigation/i,
      }),
    ).not.toBeInTheDocument();
    expect(screen.getByText(/Night shift warehouse intake/i)).toBeInTheDocument();
  });

  it("renders a usable unavailable state for an invalid public job id", async () => {
    const page = await ApplyPage({
      params: Promise.resolve({
        jobId: "missing-job-link",
      }),
    });

    render(page);

    expect(
      screen.getByText(/This job link is no longer available/i),
    ).toBeInTheDocument();
  });

  it("blocks invalid submission and shows validation errors", async () => {
    const page = await ApplyPage({
      params: Promise.resolve({
        jobId: "demo-warehouse-associate",
      }),
    });

    render(page);

    fireEvent.click(
      screen.getByRole("button", { name: /Submit and receive call/i }),
    );

    expect(screen.getByText(/Full name is required/i)).toBeInTheDocument();
    expect(screen.getByText(/Phone is required/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Provide either a CV upload or a LinkedIn URL/i),
    ).toBeInTheDocument();
  });

  it("supports linkedin-only submission as a normalized profile source", async () => {
    const page = await ApplyPage({
      params: Promise.resolve({
        jobId: "demo-warehouse-associate",
      }),
    });

    render(page);

    fireEvent.change(screen.getByLabelText(/Full name/i), {
      target: { value: "Lucia Torres" },
    });
    fireEvent.change(screen.getByLabelText(/Phone/i), {
      target: { value: "+34 600 123 456" },
    });
    fireEvent.change(screen.getByLabelText(/LinkedIn URL/i), {
      target: { value: "http://linkedin.com/in/Lucia-Torres" },
    });

    fireEvent.click(
      screen.getByRole("button", { name: /Submit and receive call/i }),
    );

    expect(
      screen.getByText(/LinkedIn stored as https:\/\/linkedin\.com\/in\/lucia-torres/i),
    ).toBeInTheDocument();
  });

  it("surfaces a usable error for unsupported cv uploads", async () => {
    const page = await ApplyPage({
      params: Promise.resolve({
        jobId: "demo-warehouse-associate",
      }),
    });

    render(page);

    fireEvent.change(screen.getByLabelText(/Full name/i), {
      target: { value: "Lucia Torres" },
    });
    fireEvent.change(screen.getByLabelText(/Phone/i), {
      target: { value: "+34 600 123 456" },
    });
    fireEvent.change(screen.getByLabelText("CV upload"), {
      target: {
        files: [
          new File(["hello"], "profile.txt", {
            type: "text/plain",
          }),
        ],
      },
    });

    fireEvent.click(
      screen.getByRole("button", { name: /Submit and receive call/i }),
    );

    expect(
      screen.getByText(/CV upload failed. Use a PDF, DOC, or DOCX file/i),
    ).toBeInTheDocument();
  });
});
