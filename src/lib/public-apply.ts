import type { SupportedLanguage } from "@/domain/shared/types";

export type PublicApplyFormInput = {
  fullName: string;
  phone: string;
  email: string;
  language: SupportedLanguage;
  linkedinUrl: string;
  cvFileName: string | null;
};

export type PublicApplyFormErrors = Partial<
  Record<keyof PublicApplyFormInput, string>
> & {
  profileSource?: string;
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const linkedinPattern =
  /^https?:\/\/([a-z]{2,3}\.)?linkedin\.com\/.+/i;
const phonePattern = /^\+?[0-9()\-.\s]{7,}$/;

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

  return errors;
}
