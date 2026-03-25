import { describe, expect, it } from "vitest";

import {
  normalizeCandidateProfileSource,
  validatePublicApplyForm,
} from "@/lib/public-apply";

describe("public apply validation", () => {
  it("accepts a valid payload with linkedin as the profile source", () => {
    expect(
      validatePublicApplyForm({
        fullName: "Lucia Torres",
        phone: "+34 600 123 456",
        email: "lucia@example.com",
        language: "en",
        linkedinUrl: "https://linkedin.com/in/lucia-torres",
        cvFileName: null,
      }),
    ).toEqual({});
  });

  it("rejects missing required fields and missing profile source", () => {
    expect(
      validatePublicApplyForm({
        fullName: "",
        phone: "",
        email: "",
        language: "en",
        linkedinUrl: "",
        cvFileName: null,
      }),
    ).toMatchObject({
      fullName: "Full name is required.",
      phone: "Phone is required.",
      profileSource: "Provide either a CV upload or a LinkedIn URL.",
    });
  });

  it("rejects invalid optional email and malformed linkedin urls", () => {
    expect(
      validatePublicApplyForm({
        fullName: "Lucia Torres",
        phone: "+34 600 123 456",
        email: "lucia-at-example.com",
        language: "en",
        linkedinUrl: "https://example.com/profile",
        cvFileName: null,
      }),
    ).toMatchObject({
      email: "Email format looks invalid.",
      linkedinUrl: "LinkedIn URL must be a valid linkedin.com profile.",
    });
  });

  it("normalizes linkedin-only profile source data", () => {
    expect(
      normalizeCandidateProfileSource({
        linkedinUrl: "http://linkedin.com/in/Lucia-Torres",
        cvFile: null,
      }),
    ).toEqual({
      success: true,
      data: {
        linkedinUrl: "https://linkedin.com/in/lucia-torres",
        cvAssetRef: null,
        cvFileName: null,
      },
    });
  });

  it("rejects unsupported cv file types", () => {
    expect(
      normalizeCandidateProfileSource({
        linkedinUrl: "",
        cvFile: new File(["hello"], "profile.txt", {
          type: "text/plain",
        }),
      }),
    ).toEqual({
      success: false,
      error: "CV upload failed. Use a PDF, DOC, or DOCX file.",
    });
  });
});
