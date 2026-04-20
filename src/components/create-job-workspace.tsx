"use client";

import { useState } from "react";
import Link from "next/link";

import { FormField } from "@/components/form-field";
import { PlaceholderState } from "@/components/placeholder-state";
import { DataPoint, DetailPanel, SectionCard } from "@/components/section-card";
import { LoadingState } from "@/components/shared-states";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type {
  JobConditionInput,
  JobExtractionDraft,
  JobRequirementInput,
  RequirementImportance,
} from "@/domain/jobs/configuration";
type DraftFields = {
  title: string;
  language: string;
  description: string;
};

type FieldErrors = {
  title?: string;
  language?: string;
  description?: string;
};

type InterviewLimitsState = {
  maxInterviews: string;
  outstandingCap: string;
  greatCap: string;
};

type PublishedJobState = {
  id: string;
  title: string;
  language: string;
  description: string;
  publicApplyPath: string;
  publicApplyUrl: string;
  draft: JobExtractionDraft;
  interviewLimits: {
    maxInterviews: number | null;
    outstandingCap: number | null;
    greatCap: number | null;
  };
};

function validateDraft(fields: DraftFields) {
  const errors: FieldErrors = {};

  if (!fields.title.trim()) {
    errors.title = "Job title is required.";
  }

  if (!fields.language.trim()) {
    errors.language = "Interview language is required.";
  }

  if (fields.description.trim().length < 40) {
    errors.description =
      "Job description must be detailed enough to support extraction.";
  }

  return errors;
}

export function CreateJobWorkspace() {
  const [fields, setFields] = useState<DraftFields>({
    title: "",
    language: "en",
    description: "",
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [draft, setDraft] = useState<JobExtractionDraft | null>(null);
  const [extractionWarnings, setExtractionWarnings] = useState<string[]>([]);
  const [extractionError, setExtractionError] = useState<string | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [newConditionLabel, setNewConditionLabel] = useState("");
  const [newConditionValue, setNewConditionValue] = useState("");
  const [newTechnicalSkill, setNewTechnicalSkill] = useState("");
  const [newInterpersonalSkill, setNewInterpersonalSkill] = useState("");
  const [interviewLimits, setInterviewLimits] = useState<InterviewLimitsState>({
    maxInterviews: "",
    outstandingCap: "",
    greatCap: "",
  });
  const [publishedJob, setPublishedJob] = useState<PublishedJobState | null>(
    null,
  );
  const [publishError, setPublishError] = useState<string | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);

  const canExtract =
    fields.title.trim().length > 0 && fields.description.trim().length >= 40;

  function updateField<K extends keyof DraftFields>(
    key: K,
    value: DraftFields[K],
  ) {
    const nextFields = { ...fields, [key]: value };
    setFields(nextFields);
    setErrors(validateDraft(nextFields));
  }

  async function handleGenerateDraft() {
    const nextErrors = validateDraft(fields);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setIsExtracting(true);
    setExtractionError(null);
    setExtractionWarnings([]);

    try {
      const response = await fetch("/api/recruiter/jobs/extract", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: fields.title,
          description: fields.description,
          language: fields.language,
        }),
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        setExtractionError(result.error ?? "Draft generation failed.");
        setDraft(null);
        return;
      }

      setDraft(result.data);
      setExtractionWarnings(result.warnings ?? []);
    } catch (error) {
      setExtractionError(
        error instanceof Error ? error.message : "Draft generation failed.",
      );
      setDraft(null);
    } finally {
      setIsExtracting(false);
    }
  }

  function updateCondition(
    conditionId: string,
    updates: Partial<JobConditionInput>,
  ) {
    setDraft((currentDraft) => {
      if (!currentDraft) {
        return currentDraft;
      }

      return {
        ...currentDraft,
        jobConditions: currentDraft.jobConditions.map((condition) =>
          condition.id === conditionId
            ? { ...condition, ...updates }
            : condition,
        ),
      };
    });
  }

  function removeCondition(conditionId: string) {
    setDraft((currentDraft) => {
      if (!currentDraft) {
        return currentDraft;
      }

      return {
        ...currentDraft,
        jobConditions: currentDraft.jobConditions.filter(
          (condition) => condition.id !== conditionId,
        ),
      };
    });
  }

  function addCondition() {
    if (!newConditionLabel.trim()) {
      return;
    }

    setDraft((currentDraft) => {
      if (!currentDraft) {
        return currentDraft;
      }

      return {
        ...currentDraft,
        jobConditions: [
          ...currentDraft.jobConditions,
          {
            id: `cond_custom_${currentDraft.jobConditions.length + 1}`,
            code: "other",
            label: newConditionLabel.trim(),
            value: newConditionValue.trim(),
            state: newConditionValue.trim() ? "complete" : "missing",
            details: "Manually added by recruiter.",
          },
        ],
      };
    });

    setNewConditionLabel("");
    setNewConditionValue("");
  }

  function updateRequirement(
    section:
      | "essentialRequirements"
      | "technicalSkills"
      | "interpersonalSkills",
    requirementId: string,
    updates: Partial<JobRequirementInput>,
  ) {
    setDraft((currentDraft) => {
      if (!currentDraft) {
        return currentDraft;
      }

      return {
        ...currentDraft,
        [section]: currentDraft[section].map((requirement) =>
          requirement.id === requirementId
            ? { ...requirement, ...updates }
            : requirement,
        ),
      };
    });
  }

  function removeRequirement(
    section:
      | "essentialRequirements"
      | "technicalSkills"
      | "interpersonalSkills",
    requirementId: string,
  ) {
    setDraft((currentDraft) => {
      if (!currentDraft) {
        return currentDraft;
      }

      return {
        ...currentDraft,
        [section]: currentDraft[section].filter(
          (requirement) => requirement.id !== requirementId,
        ),
      };
    });
  }

  function toggleRequirementImportance(
    section:
      | "essentialRequirements"
      | "technicalSkills"
      | "interpersonalSkills",
    requirementId: string,
    importance: RequirementImportance,
  ) {
    updateRequirement(section, requirementId, { importance });
  }

  function addRequirement(
    section: "technicalSkills" | "interpersonalSkills",
    label: string,
  ) {
    const normalizedLabel = label.trim();
    if (!normalizedLabel) {
      return;
    }

    setDraft((currentDraft) => {
      if (!currentDraft) {
        return currentDraft;
      }

      return {
        ...currentDraft,
        [section]: [
          ...currentDraft[section],
          {
            id: `${section}_${currentDraft[section].length + 1}`,
            label: normalizedLabel,
            importance: "OPTIONAL",
          },
        ],
      };
    });
  }

  const limitErrors = {
    maxInterviews:
      interviewLimits.maxInterviews &&
      Number.parseInt(interviewLimits.maxInterviews, 10) <= 0
        ? "Total interview limit must be greater than zero."
        : undefined,
    outstandingCap:
      interviewLimits.maxInterviews &&
      interviewLimits.outstandingCap &&
      Number.parseInt(interviewLimits.outstandingCap, 10) >
        Number.parseInt(interviewLimits.maxInterviews, 10)
        ? "Outstanding cap cannot exceed the total interview limit."
        : undefined,
    greatCap:
      interviewLimits.maxInterviews &&
      interviewLimits.greatCap &&
      Number.parseInt(interviewLimits.greatCap, 10) >
        Number.parseInt(interviewLimits.maxInterviews, 10)
        ? "Great cap cannot exceed the total interview limit."
        : undefined,
  };

  const canPublish =
    draft !== null &&
    !limitErrors.maxInterviews &&
    !limitErrors.outstandingCap &&
    !limitErrors.greatCap;

  async function publishJob() {
    if (!draft || !canPublish) {
      return;
    }

    setPublishError(null);
    setIsPublishing(true);

    const parsedLimits = {
      maxInterviews: interviewLimits.maxInterviews
        ? Number.parseInt(interviewLimits.maxInterviews, 10)
        : null,
      outstandingCap: interviewLimits.outstandingCap
        ? Number.parseInt(interviewLimits.outstandingCap, 10)
        : null,
      greatCap: interviewLimits.greatCap
        ? Number.parseInt(interviewLimits.greatCap, 10)
        : null,
    };

    try {
      const response = await fetch("/api/recruiter/jobs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: fields.title,
          language: fields.language,
          description: fields.description,
          draft,
          interviewLimits: parsedLimits,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        setPublishError(result.error ?? "Publishing failed.");
        return;
      }

      const publicApplyPath = result.data.publicApplyPath;
      const publicApplyUrl =
        typeof window === "undefined"
          ? publicApplyPath
          : new URL(publicApplyPath, window.location.origin).toString();

      setPublishedJob({
        id: result.data.id,
        title: fields.title,
        language: fields.language,
        description: fields.description,
        publicApplyPath,
        publicApplyUrl,
        draft,
        interviewLimits: parsedLimits,
      });
    } catch (error) {
      setPublishError(
        error instanceof Error ? error.message : "Publishing failed.",
      );
    } finally {
      setIsPublishing(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-6 px-6 py-6 md:px-8">
      <PlaceholderState
        eyebrow="New job"
        title="Draft and publish a role"
        description="Paste the real brief, tighten the extraction, and open the public apply link."
      >
        <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <SectionCard
            title="Role brief"
            kicker="Draft input"
            tone="strong"
            footer={
              <div className="flex flex-wrap gap-3">
                <Button
                  className="rounded-full px-6"
                  disabled={!canExtract || isExtracting}
                  onClick={handleGenerateDraft}
                  type="button"
                >
                  {isExtracting ? "Generating..." : "Generate draft"}
                </Button>
              </div>
            }
          >
            <form
              className="grid gap-4"
              onSubmit={(event) => event.preventDefault()}
            >
              <FormField
                label="Job title"
                required
                error={errors.title}
              >
                <Input
                  aria-label="Job title"
                  onChange={(event) => updateField("title", event.target.value)}
                  value={fields.title}
                />
              </FormField>

              <FormField
                label="Interview language"
                required
                error={errors.language}
              >
                <Select
                  aria-label="Interview language"
                  onChange={(event) =>
                    updateField("language", event.target.value)
                  }
                  value={fields.language}
                >
                  <option value="en">English</option>
                  <option value="es">Spanish</option>
                </Select>
              </FormField>

              <FormField
                label="Job description"
                required
                hint="Paste the real brief. Include location, pay, schedule, and requirements when known."
                error={errors.description}
              >
                <Textarea
                  aria-label="Job description"
                  onChange={(event) =>
                    updateField("description", event.target.value)
                  }
                  value={fields.description}
                />
              </FormField>
            </form>
          </SectionCard>

          <SectionCard
            title="Working draft"
            kicker="Status"
            description="The extraction becomes the editable role setup for interview conditions, scored requirements, and caps."
          >
            {draft ? (
              <div className="rounded-[1.4rem] border border-emerald-200/80 bg-emerald-50/70 px-4 py-4 text-sm leading-7 text-emerald-900">
                Draft ready for review.
              </div>
            ) : isExtracting ? (
              <LoadingState
                eyebrow="Generating draft"
                title="Generating draft"
                description="Extracting the key fields."
                rows={2}
              />
            ) : (
              <LoadingState
                eyebrow="No draft yet"
                title="Generate a draft to start."
                description="Conditions and requirements appear here."
                rows={2}
              />
            )}
            <div className="grid gap-3 sm:grid-cols-2">
              <DataPoint
                label="Conditions"
                value={draft ? draft.jobConditions.length : "--"}
                detail="Editable before publish"
              />
              <DataPoint
                label="Requirements"
                value={
                  draft
                    ? draft.essentialRequirements.length +
                      draft.technicalSkills.length +
                      draft.interpersonalSkills.length
                    : "--"
                }
                detail="Across essential, technical, and interpersonal"
              />
            </div>
            <div className="mt-5 rounded-[1.4rem] border border-dashed border-slate-300/90 bg-white/70 px-4 py-5 text-sm leading-7 text-slate-600">
              Generate a draft to start editing conditions and requirements.
            </div>
            {extractionError ? (
              <div className="mt-4 rounded-[1.2rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
                {extractionError}
              </div>
            ) : null}
            {extractionWarnings.length > 0 ? (
              <div className="mt-4 rounded-[1.2rem] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                {extractionWarnings.join(" ")}
              </div>
            ) : null}
          </SectionCard>
        </div>

        {draft ? (
          <SectionCard
            title="Conditions"
            kicker="Conditions"
            description="Confirm the hard role constraints before the interview goes live."
          >
            <div className="grid gap-3">
              {draft.jobConditions.map((condition) => (
                <article
                  key={condition.id}
                  className="rounded-[1.4rem] border border-slate-200/80 bg-white/82 p-4 shadow-[0_14px_32px_rgba(15,23,42,0.05)]"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Input
                          aria-label={`${condition.label} label`}
                          className="h-10 max-w-sm"
                          onChange={(event) =>
                            updateCondition(condition.id, {
                              label: event.target.value,
                            })
                          }
                          value={condition.label}
                        />
                        <StatusBadge
                          intent={
                            condition.state === "complete"
                              ? "success"
                              : condition.state === "incomplete"
                                ? "warning"
                                : "special"
                          }
                          density="compact"
                        >
                          {condition.state}
                        </StatusBadge>
                      </div>
                      <Textarea
                        aria-label={`${condition.label} value`}
                        className="mt-3 min-h-24"
                        onChange={(event) =>
                          updateCondition(condition.id, {
                            value: event.target.value,
                            state: event.target.value.trim()
                              ? "complete"
                              : "missing",
                          })
                        }
                        value={condition.value}
                      />
                      <p className="mt-2 text-xs text-slate-500">
                        {condition.details || "No extra recruiter note."}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      className="rounded-full"
                      onClick={() => removeCondition(condition.id)}
                    >
                      Remove
                    </Button>
                  </div>
                </article>
              ))}
            </div>

            <div className="mt-5 rounded-[1.4rem] border border-dashed border-slate-300/90 bg-slate-50/70 p-4">
              <p className="ops-kicker text-slate-500">Add missing condition</p>
              <div className="mt-3 grid gap-3 md:grid-cols-[0.9fr_1.1fr_auto]">
                <Input
                  aria-label="New condition label"
                  onChange={(event) => setNewConditionLabel(event.target.value)}
                  placeholder="Condition label"
                  value={newConditionLabel}
                />
                <Input
                  aria-label="New condition value"
                  onChange={(event) => setNewConditionValue(event.target.value)}
                  placeholder="Condition value"
                  value={newConditionValue}
                />
                <Button
                  type="button"
                  className="rounded-full"
                  onClick={addCondition}
                >
                  Add condition
                </Button>
              </div>
            </div>
          </SectionCard>
        ) : null}

        {draft ? (
          <SectionCard
            title="Essential requirements"
            kicker="Requirements"
            description="Keep only the non-negotiable requirements the interview should score against."
          >
            <div className="grid gap-3">
              {draft.essentialRequirements.map((requirement) => (
                <article
                  key={requirement.id}
                  className="rounded-[1.4rem] border border-slate-200/80 bg-white/82 p-4 shadow-[0_14px_32px_rgba(15,23,42,0.05)]"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="min-w-0 flex-1">
                      <Input
                        aria-label={`${requirement.label} essential requirement`}
                        onChange={(event) =>
                          updateRequirement(
                            "essentialRequirements",
                            requirement.id,
                            {
                              label: event.target.value,
                            },
                          )
                        }
                        value={requirement.label}
                      />
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        type="button"
                        variant={
                          requirement.importance === "MANDATORY"
                            ? "secondary"
                            : "outline"
                        }
                        className="rounded-full"
                        onClick={() =>
                          toggleRequirementImportance(
                            "essentialRequirements",
                            requirement.id,
                            "MANDATORY",
                          )
                        }
                      >
                        Mandatory
                      </Button>
                      <Button
                        type="button"
                        variant={
                          requirement.importance === "OPTIONAL"
                            ? "secondary"
                            : "outline"
                        }
                        className="rounded-full"
                        onClick={() =>
                          toggleRequirementImportance(
                            "essentialRequirements",
                            requirement.id,
                            "OPTIONAL",
                          )
                        }
                      >
                        Optional
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className="rounded-full"
                        onClick={() =>
                          removeRequirement(
                            "essentialRequirements",
                            requirement.id,
                          )
                        }
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </SectionCard>
        ) : null}

        {draft ? (
          <SectionCard
            title="Technical skills"
            kicker="Requirements"
            description="Refine the technical signals that should appear in the interview evaluation."
          >
            <div className="grid gap-3">
              {draft.technicalSkills.map((requirement) => (
                <article
                  key={requirement.id}
                  className="rounded-[1.4rem] border border-slate-200/80 bg-white/82 p-4 shadow-[0_14px_32px_rgba(15,23,42,0.05)]"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="min-w-0 flex-1">
                      <Input
                        aria-label={`${requirement.label} technical skill`}
                        onChange={(event) =>
                          updateRequirement("technicalSkills", requirement.id, {
                            label: event.target.value,
                          })
                        }
                        value={requirement.label}
                      />
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        type="button"
                        variant={
                          requirement.importance === "MANDATORY"
                            ? "secondary"
                            : "outline"
                        }
                        className="rounded-full"
                        onClick={() =>
                          toggleRequirementImportance(
                            "technicalSkills",
                            requirement.id,
                            "MANDATORY",
                          )
                        }
                      >
                        Mandatory
                      </Button>
                      <Button
                        type="button"
                        variant={
                          requirement.importance === "OPTIONAL"
                            ? "secondary"
                            : "outline"
                        }
                        className="rounded-full"
                        onClick={() =>
                          toggleRequirementImportance(
                            "technicalSkills",
                            requirement.id,
                            "OPTIONAL",
                          )
                        }
                      >
                        Optional
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className="rounded-full"
                        onClick={() =>
                          removeRequirement("technicalSkills", requirement.id)
                        }
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            <div className="mt-5 rounded-[1.4rem] border border-dashed border-slate-300/90 bg-slate-50/70 p-4">
              <p className="ops-kicker text-slate-500">Add technical skill</p>
              <div className="mt-3 grid gap-3 md:grid-cols-[1fr_auto]">
                <Input
                  aria-label="New technical skill"
                  onChange={(event) => setNewTechnicalSkill(event.target.value)}
                  placeholder="Forklift, scanner systems, inventory software..."
                  value={newTechnicalSkill}
                />
                <Button
                  type="button"
                  className="rounded-full"
                  onClick={() => {
                    addRequirement("technicalSkills", newTechnicalSkill);
                    setNewTechnicalSkill("");
                  }}
                >
                  Add skill
                </Button>
              </div>
            </div>
          </SectionCard>
        ) : null}

        {draft ? (
          <SectionCard
            title="Interpersonal skills"
            kicker="Requirements"
            description="Capture the collaboration and communication traits worth scoring."
          >
            <div className="grid gap-3">
              {draft.interpersonalSkills.map((requirement) => (
                <article
                  key={requirement.id}
                  className="rounded-[1.4rem] border border-slate-200/80 bg-white/82 p-4 shadow-[0_14px_32px_rgba(15,23,42,0.05)]"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="min-w-0 flex-1">
                      <Input
                        aria-label={`${requirement.label} interpersonal skill`}
                        onChange={(event) =>
                          updateRequirement(
                            "interpersonalSkills",
                            requirement.id,
                            {
                              label: event.target.value,
                            },
                          )
                        }
                        value={requirement.label}
                      />
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        type="button"
                        variant={
                          requirement.importance === "MANDATORY"
                            ? "secondary"
                            : "outline"
                        }
                        className="rounded-full"
                        onClick={() =>
                          toggleRequirementImportance(
                            "interpersonalSkills",
                            requirement.id,
                            "MANDATORY",
                          )
                        }
                      >
                        Mandatory
                      </Button>
                      <Button
                        type="button"
                        variant={
                          requirement.importance === "OPTIONAL"
                            ? "secondary"
                            : "outline"
                        }
                        className="rounded-full"
                        onClick={() =>
                          toggleRequirementImportance(
                            "interpersonalSkills",
                            requirement.id,
                            "OPTIONAL",
                          )
                        }
                      >
                        Optional
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className="rounded-full"
                        onClick={() =>
                          removeRequirement(
                            "interpersonalSkills",
                            requirement.id,
                          )
                        }
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            <div className="mt-5 rounded-[1.4rem] border border-dashed border-slate-300/90 bg-slate-50/70 p-4">
              <p className="ops-kicker text-slate-500">
                Add interpersonal skill
              </p>
              <div className="mt-3 grid gap-3 md:grid-cols-[1fr_auto]">
                <Input
                  aria-label="New interpersonal skill"
                  onChange={(event) =>
                    setNewInterpersonalSkill(event.target.value)
                  }
                  placeholder="Communication, teamwork, reliability..."
                  value={newInterpersonalSkill}
                />
                <Button
                  type="button"
                  className="rounded-full"
                  onClick={() => {
                    addRequirement(
                      "interpersonalSkills",
                      newInterpersonalSkill,
                    );
                    setNewInterpersonalSkill("");
                  }}
                >
                  Add skill
                </Button>
              </div>
            </div>
          </SectionCard>
        ) : null}

        {draft ? (
          <SectionCard
            title="Interview limits"
            kicker="Capacity"
            description="Set caps only when the role needs controlled throughput."
          >
            <div className="grid gap-4 lg:grid-cols-3">
              <FormField
                label="Total interview limit"
                hint="Leave empty to keep the job open-ended."
                error={limitErrors.maxInterviews}
              >
                <Input
                  aria-label="Total interview limit"
                  inputMode="numeric"
                  onChange={(event) =>
                    setInterviewLimits((current) => ({
                      ...current,
                      maxInterviews: event.target.value,
                    }))
                  }
                  value={interviewLimits.maxInterviews}
                />
              </FormField>

              <FormField
                label="Outstanding cap"
                hint="Optional."
                error={limitErrors.outstandingCap}
              >
                <Input
                  aria-label="Outstanding cap"
                  inputMode="numeric"
                  onChange={(event) =>
                    setInterviewLimits((current) => ({
                      ...current,
                      outstandingCap: event.target.value,
                    }))
                  }
                  value={interviewLimits.outstandingCap}
                />
              </FormField>

              <FormField
                label="Great cap"
                hint="Optional."
                error={limitErrors.greatCap}
              >
                <Input
                  aria-label="Great cap"
                  inputMode="numeric"
                  onChange={(event) =>
                    setInterviewLimits((current) => ({
                      ...current,
                      greatCap: event.target.value,
                    }))
                  }
                  value={interviewLimits.greatCap}
                />
              </FormField>
            </div>
          </SectionCard>
        ) : null}

        {draft ? (
          <SectionCard
            title="Go live"
            kicker="Publish"
            description="Publish only when the role brief and scoring setup are ready for candidates."
            tone="strong"
            footer={
              <div className="flex flex-wrap gap-3">
                <Button
                  aria-label="Publish job action"
                  type="button"
                  className="rounded-full px-6"
                  disabled={!canPublish || isPublishing}
                  onClick={publishJob}
                >
                  {isPublishing ? "Publishing..." : "Publish job"}
                </Button>
                <Link
                  href="/jobs"
                  className="inline-flex items-center justify-center rounded-full border border-slate-300/90 bg-white/92 px-6 text-sm font-medium text-slate-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.86)] transition-all hover:border-slate-400 hover:bg-white"
                >
                  Back to jobs
                </Link>
              </div>
            }
          >
            <div className="grid gap-3 sm:grid-cols-3">
              <DataPoint
                label="Conditions"
                value={draft.jobConditions.length}
                detail="Ready for runtime"
              />
              <DataPoint
                label="Scored items"
                value={
                  draft.essentialRequirements.length +
                  draft.technicalSkills.length +
                  draft.interpersonalSkills.length
                }
                detail="Across all requirement groups"
              />
              <DataPoint
                label="Apply link"
                value={publishedJob ? "Generated" : "Pending"}
                detail="Created on publish"
              />
            </div>
          </SectionCard>
        ) : null}

        {publishedJob ? (
          <SectionCard
            title="Live role"
            kicker="Published"
            description="The role is active and the public apply link is ready to share."
            tone="strong"
            actions={<StatusBadge intent="success">Active</StatusBadge>}
          >
            <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="rounded-[1.4rem] border border-emerald-200/80 bg-emerald-50/70 p-4">
                <p className="ops-kicker text-emerald-800">Public apply link</p>
                <a
                  className="mt-2 block text-sm font-medium text-emerald-950 underline underline-offset-4"
                  href={publishedJob.publicApplyUrl}
                >
                  {publishedJob.publicApplyUrl}
                </a>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <DataPoint
                  label="Language"
                  value={publishedJob.language.toUpperCase()}
                  detail="Configured interview locale"
                />
                <DataPoint
                  label="Interview limit"
                  value={publishedJob.interviewLimits.maxInterviews ?? "None"}
                  detail="Total cap"
                />
              </div>
            </div>
          </SectionCard>
        ) : null}

        {publishError ? (
          <SectionCard
            title="Publish error"
            kicker="Persistence"
            description={publishError}
          >
            <p className="text-sm leading-6 text-slate-600">
              Review the recruiter brief inputs and try publishing again.
            </p>
          </SectionCard>
        ) : null}

      </PlaceholderState>
    </div>
  );
}
