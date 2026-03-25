"use client";

import { useState } from "react";

import { FormField } from "@/components/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { SupportedLanguage } from "@/domain/shared/types";
import {
  createLegalAcceptanceRecord,
  normalizeCandidateProfileSource,
  type NormalizedCandidateProfileSource,
  type PublicApplyLegalAcceptance,
  type PublicApplyFormInput,
  publicApplyTermsVersion,
  validatePublicApplyForm,
} from "@/lib/public-apply";

type PublicApplyFormProps = {
  interviewLanguage: SupportedLanguage;
};

const initialFields: PublicApplyFormInput = {
  fullName: "",
  phone: "",
  email: "",
  language: "en",
  linkedinUrl: "",
  cvFileName: null,
  acceptedTerms: false,
};

export function PublicApplyForm({
  interviewLanguage,
}: PublicApplyFormProps) {
  const [fields, setFields] = useState<PublicApplyFormInput>({
    ...initialFields,
    language: interviewLanguage,
  });
  const [errors, setErrors] = useState(() =>
    validatePublicApplyForm({
      ...initialFields,
      language: interviewLanguage,
    }),
  );
  const [submissionState, setSubmissionState] = useState<"idle" | "valid">(
    "idle",
  );
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [profileSourceError, setProfileSourceError] = useState<string | null>(
    null,
  );
  const [normalizedProfileSource, setNormalizedProfileSource] =
    useState<NormalizedCandidateProfileSource | null>(null);
  const [legalAcceptance, setLegalAcceptance] =
    useState<PublicApplyLegalAcceptance | null>(null);

  function updateField<K extends keyof PublicApplyFormInput>(
    key: K,
    value: PublicApplyFormInput[K],
  ) {
    const nextFields = {
      ...fields,
      [key]: value,
    };

    setFields(nextFields);
    setErrors(validatePublicApplyForm(nextFields));
  }

  function handleCvFileChange(file: File | null) {
    setCvFile(file);
    setProfileSourceError(null);
    setNormalizedProfileSource(null);
    updateField("cvFileName", file?.name ?? null);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors = validatePublicApplyForm(fields);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      setSubmissionState("idle");
      return;
    }

    const normalizedProfileResult = normalizeCandidateProfileSource({
      linkedinUrl: fields.linkedinUrl,
      cvFile,
    });

    if (!normalizedProfileResult.success) {
      setSubmissionState("idle");
      setProfileSourceError(normalizedProfileResult.error);
      return;
    }

    const legalAcceptanceResult = createLegalAcceptanceRecord({
      acceptedTerms: fields.acceptedTerms,
    });

    if (!legalAcceptanceResult.success) {
      setSubmissionState("idle");
      return;
    }

    setProfileSourceError(null);
    setNormalizedProfileSource(normalizedProfileResult.data);
    setLegalAcceptance(legalAcceptanceResult.data);
    setSubmissionState("valid");
  }

  return (
    <form className="grid gap-4" onSubmit={handleSubmit}>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Full name" required error={errors.fullName}>
          <Input
            aria-label="Full name"
            onChange={(event) => updateField("fullName", event.target.value)}
            value={fields.fullName}
          />
        </FormField>
        <FormField label="Phone" required error={errors.phone}>
          <Input
            aria-label="Phone"
            onChange={(event) => updateField("phone", event.target.value)}
            value={fields.phone}
          />
        </FormField>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          label="Email"
          hint="Optional for the first call, useful for follow-up."
          error={errors.email}
        >
          <Input
            aria-label="Email"
            onChange={(event) => updateField("email", event.target.value)}
            type="email"
            value={fields.email}
          />
        </FormField>
        <FormField label="Language preference" required>
          <Select
            aria-label="Language preference"
            onChange={(event) =>
              updateField("language", event.target.value as SupportedLanguage)
            }
            value={fields.language}
          >
            <option value="en">English</option>
            <option value="es">Spanish</option>
          </Select>
        </FormField>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          label="CV upload"
          hint="Upload a CV or provide LinkedIn below."
        >
          <Input
            aria-label="CV upload"
            onChange={(event) => handleCvFileChange(event.target.files?.[0] ?? null)}
            type="file"
          />
        </FormField>
        <FormField
          label="LinkedIn URL"
          hint="Use this when you prefer not to upload a CV."
          error={profileSourceError || errors.linkedinUrl || errors.profileSource}
        >
          <Input
            aria-label="LinkedIn URL"
            onChange={(event) =>
              updateField("linkedinUrl", event.target.value)
            }
            placeholder="https://linkedin.com/in/your-profile"
            value={fields.linkedinUrl}
          />
        </FormField>
      </div>

      <FormField
        label="Consent and AI disclosure"
        required
        error={errors.acceptedTerms}
        hint={`Terms version ${publicApplyTermsVersion}`}
      >
        <label className="flex items-start gap-3 rounded-[1rem] border border-slate-300/90 bg-white/92 px-4 py-3 text-sm leading-7 text-slate-700">
          <input
            aria-label="Accept terms and AI disclosure"
            checked={fields.acceptedTerms}
            className="mt-1 size-4 rounded border border-slate-400"
            onChange={(event) =>
              updateField("acceptedTerms", event.target.checked)
            }
            type="checkbox"
          />
          <span>
            I understand this interview uses AI to support human recruiters and
            I accept the candidate terms for this application.
          </span>
        </label>
      </FormField>

      {submissionState === "valid" ? (
        <div className="rounded-[1rem] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <p>Application details look valid and ready for submission.</p>
          <p className="mt-2">
            Profile source:{" "}
            {normalizedProfileSource?.cvAssetRef
              ? `CV stored as ${normalizedProfileSource.cvAssetRef}`
              : `LinkedIn stored as ${normalizedProfileSource?.linkedinUrl}`}
          </p>
          <p className="mt-2">
            Terms accepted: {legalAcceptance?.termsVersion} at{" "}
            {legalAcceptance?.acceptedAt}
          </p>
        </div>
      ) : null}

      <Button
        className="mt-2 rounded-full bg-slate-950 px-6 text-white hover:bg-slate-800"
        type="submit"
      >
        Submit and receive call
      </Button>
    </form>
  );
}
