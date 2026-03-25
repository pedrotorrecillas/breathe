import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import ApplyPage from "@/app/(public)/apply/[jobId]/page";
import {
  getPublicApplySubmissionSnapshot,
  resetPublicApplySubmissionStore,
} from "@/lib/public-apply-submissions";

describe("public apply route", () => {
  afterEach(() => {
    cleanup();
    resetPublicApplySubmissionStore();
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

  it("blocks entry for inactive jobs", async () => {
    const page = await ApplyPage({
      params: Promise.resolve({
        jobId: "demo-retail-shift-lead",
      }),
    });

    render(page);

    expect(
      screen.getByText(/This job is no longer accepting applications/i),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Submit and receive call/i }),
    ).not.toBeInTheDocument();
    expect(getPublicApplySubmissionSnapshot()).toEqual({
      candidates: [],
      applications: [],
      interviewRuns: [],
    });
  });

  it("blocks entry when the interview limit has already been reached", async () => {
    const page = await ApplyPage({
      params: Promise.resolve({
        jobId: "demo-operations-coordinator",
      }),
    });

    render(page);

    expect(
      screen.getByText(/This job has reached its interview limit/i),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Submit and receive call/i }),
    ).not.toBeInTheDocument();
    expect(getPublicApplySubmissionSnapshot()).toEqual({
      candidates: [],
      applications: [],
      interviewRuns: [],
    });
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
    expect(
      screen.getByText(/Candidates must accept the terms before submission/i),
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
    fireEvent.click(screen.getByLabelText(/Accept terms and AI disclosure/i));

    fireEvent.click(
      screen.getByRole("button", { name: /Submit and receive call/i }),
    );

    expect(
      screen.getByText(/Clara will call you shortly/i),
    ).toBeInTheDocument();
    expect(
      getPublicApplySubmissionSnapshot().candidates[0]?.linkedinUrl,
    ).toBe("https://linkedin.com/in/lucia-torres");
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
    fireEvent.click(screen.getByLabelText(/Accept terms and AI disclosure/i));

    fireEvent.click(
      screen.getByRole("button", { name: /Submit and receive call/i }),
    );

    expect(
      screen.getByText(/CV upload failed. Use a PDF, DOC, or DOCX file/i),
    ).toBeInTheDocument();
  });

  it("creates candidate, application, and interview run records on valid submit", async () => {
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
    fireEvent.change(screen.getByLabelText(/Email/i), {
      target: { value: "lucia@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/LinkedIn URL/i), {
      target: { value: "https://linkedin.com/in/lucia-torres" },
    });
    fireEvent.click(screen.getByLabelText(/Accept terms and AI disclosure/i));
    fireEvent.click(
      screen.getByRole("button", { name: /Submit and receive call/i }),
    );

    const snapshot = getPublicApplySubmissionSnapshot();

    expect(
      screen.getByText(/The first interview call will use \+34 600 123 456/i),
    ).toBeInTheDocument();
    expect(snapshot.candidates).toHaveLength(1);
    expect(snapshot.applications).toHaveLength(1);
    expect(snapshot.interviewRuns).toHaveLength(1);
    expect(snapshot.applications[0]?.candidateId).toBe(snapshot.candidates[0]?.id);
    expect(snapshot.interviewRuns[0]?.applicationId).toBe(
      snapshot.applications[0]?.id,
    );
  });
});
