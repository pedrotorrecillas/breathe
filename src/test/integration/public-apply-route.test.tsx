import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import ApplyPage from "@/app/(public)/apply/[jobId]/page";
import {
  getPublicApplySubmissionSnapshot,
  resetPublicApplySubmissionStore,
  submitPublicApplication,
} from "@/lib/public-apply-submissions";

describe("public apply route", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (_input, init) => {
        const body = JSON.parse(String(init?.body ?? "{}"));
        const result = await submitPublicApplication(body);

        return {
          async json() {
            return result;
          },
        } as Response;
      }),
    );
  });

  afterEach(async () => {
    cleanup();
    vi.unstubAllGlobals();
    await resetPublicApplySubmissionStore();
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
        name: /Apply for Warehouse Associate/i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("navigation", {
        name: /Recruiter primary navigation/i,
      }),
    ).not.toBeInTheDocument();
    expect(screen.getByText(/^Apply$/i)).toBeInTheDocument();
  });

  it("renders a usable unavailable state for an invalid public job id", async () => {
    const page = await ApplyPage({
      params: Promise.resolve({
        jobId: "missing-job-link",
      }),
    });

    render(page);

    expect(
      screen.getByText(/This role link is no longer available/i),
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
      screen.queryByRole("button", { name: /Apply now/i }),
    ).not.toBeInTheDocument();
    expect(await getPublicApplySubmissionSnapshot()).toEqual({
      candidates: [],
      applications: [],
      interviewRuns: [],
      interviewPreparationPackages: [],
      dispatchRequests: [],
      dispatchPayloads: [],
      dispatchResponses: [],
      webhookRecords: [],
      runtimeTraceEvents: [],
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
      screen.queryByRole("button", { name: /Apply now/i }),
    ).not.toBeInTheDocument();
    expect(await getPublicApplySubmissionSnapshot()).toEqual({
      candidates: [],
      applications: [],
      interviewRuns: [],
      interviewPreparationPackages: [],
      dispatchRequests: [],
      dispatchPayloads: [],
      dispatchResponses: [],
      webhookRecords: [],
      runtimeTraceEvents: [],
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
      screen.getByRole("button", { name: /Apply now/i }),
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
    fireEvent.click(screen.getByLabelText(/Accept terms/i));

    fireEvent.click(
      screen.getByRole("button", { name: /Apply now/i }),
    );

    await waitFor(async () => {
      expect(
        screen.getAllByText(/Application received/i).length,
      ).toBeGreaterThan(0);
      expect(
        (await getPublicApplySubmissionSnapshot()).candidates[0]?.linkedinUrl,
      ).toBe("https://linkedin.com/in/lucia-torres");
    });
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
    fireEvent.click(screen.getByLabelText(/Accept terms/i));

    fireEvent.click(
      screen.getByRole("button", { name: /Apply now/i }),
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
    fireEvent.click(screen.getByLabelText(/Accept terms/i));
    fireEvent.click(
      screen.getByRole("button", { name: /Apply now/i }),
    );

    await waitFor(async () => {
      expect(
        screen.getByText(/We will contact you at \+34 600 123 456/i),
      ).toBeInTheDocument();

      const snapshot = await getPublicApplySubmissionSnapshot();

      expect(snapshot.candidates).toHaveLength(1);
      expect(snapshot.applications).toHaveLength(1);
      expect(snapshot.interviewRuns).toHaveLength(1);
      expect(snapshot.interviewPreparationPackages).toHaveLength(1);
      expect(snapshot.dispatchRequests).toHaveLength(1);
      expect(snapshot.dispatchPayloads).toHaveLength(1);
      expect(snapshot.dispatchResponses).toHaveLength(1);
      expect(snapshot.applications[0]?.candidateId).toBe(snapshot.candidates[0]?.id);
      expect(snapshot.interviewRuns[0]?.applicationId).toBe(
        snapshot.applications[0]?.id,
      );
      expect(snapshot.interviewRuns[0]?.status).toBe("queued");
      expect(snapshot.interviewRuns[0]?.interviewPreparationId).toBe(
        snapshot.interviewPreparationPackages[0]?.id,
      );
      expect(snapshot.interviewRuns[0]?.dispatch.providerCallId).toBe(
        "hr_call_run_1",
      );
    });
  });
});
