import type { SupportedLanguage } from "@/domain/shared/types";

export type PublicApplyFormInput = {
  fullName: string;
  phone: string;
  email: string;
  language: SupportedLanguage;
  linkedinUrl: string;
  cvFileName: string | null;
  acceptedTerms: boolean;
};

export type NormalizedCandidateProfileSource = {
  linkedinUrl: string | null;
  cvAssetRef: string | null;
  cvFileName: string | null;
};

export type PublicApplyLegalAcceptance = {
  acceptedAt: string;
  termsVersion: string;
};

export type PublicApplyFormErrors = Partial<
  Record<keyof PublicApplyFormInput, string>
> & {
  profileSource?: string;
};

export const publicApplyTermsVersion = "2026-03-mvp";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const linkedinPattern =
  /^https?:\/\/([a-z]{2,3}\.)?linkedin\.com\/.+/i;
const phonePattern = /^\+?[0-9()\-.\s]{7,}$/;
const supportedCvTypes = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

export function validatePublicApplyForm(
  input: PublicApplyFormInput,
): PublicApplyFormErrors {
  const errors: PublicApplyFormErrors = {};

  if (!input.fullName.trim()) {
    errors.fullName = "Full name is required.";
  }

  if (!input.phone.trim()) {
    errors.phone = "Phone is required.";
  } else if (!phonePattern.test(input.phone.trim())) {
    errors.phone = "Phone format looks invalid.";
  }

  if (input.email.trim() && !emailPattern.test(input.email.trim())) {
    errors.email = "Email format looks invalid.";
  }

  if (
    input.linkedinUrl.trim() &&
    !linkedinPattern.test(input.linkedinUrl.trim())
  ) {
    errors.linkedinUrl = "LinkedIn URL must be a valid linkedin.com profile.";
  }

  if (!input.cvFileName && !input.linkedinUrl.trim()) {
    errors.profileSource = "Provide either a CV upload or a LinkedIn URL.";
  }

  if (!input.acceptedTerms) {
    errors.acceptedTerms = "Candidates must accept the terms before submission.";
  }

  return errors;
}

function slugifyFileName(fileName: string) {
  return fileName
    .toLowerCase()
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

export function normalizeLinkedinUrl(value: string) {
  return value.trim().replace(/^http:\/\//i, "https://").toLowerCase();
}

export function normalizeCandidateProfileSource(input: {
  linkedinUrl: string;
  cvFile: File | null;
}):
  | { success: true; data: NormalizedCandidateProfileSource }
  | { success: false; error: string } {
  const normalizedLinkedin = input.linkedinUrl.trim()
    ? normalizeLinkedinUrl(input.linkedinUrl)
    : null;

  if (input.cvFile) {
    if (!supportedCvTypes.has(input.cvFile.type)) {
      return {
        success: false,
        error: "CV upload failed. Use a PDF, DOC, or DOCX file.",
      };
    }

    const fileStem = slugifyFileName(input.cvFile.name) || "candidate-cv";

    return {
      success: true,
      data: {
        linkedinUrl: normalizedLinkedin,
        cvAssetRef: `cv_upload/${fileStem}-${input.cvFile.size}`,
        cvFileName: input.cvFile.name,
      },
    };
  }

  return {
    success: true,
    data: {
      linkedinUrl: normalizedLinkedin,
      cvAssetRef: null,
      cvFileName: null,
    },
  };
}

export function createLegalAcceptanceRecord(input: {
  acceptedTerms: boolean;
  now?: string;
}):
  | { success: true; data: PublicApplyLegalAcceptance }
  | { success: false; error: string } {
  if (!input.acceptedTerms) {
    return {
      success: false,
      error: "Candidates must accept the terms before submission.",
    };
  }

  return {
    success: true,
    data: {
      acceptedAt: input.now ?? new Date().toISOString(),
      termsVersion: publicApplyTermsVersion,
    },
  };
}
