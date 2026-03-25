"use client";

import { useState } from "react";

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
import { extractJobConfiguration } from "@/lib/job-extraction";

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
  const [extractionError, setExtractionError] = useState<string | null>(null);
  const [newConditionLabel, setNewConditionLabel] = useState("");
  const [newConditionValue, setNewConditionValue] = useState("");
  const [newTechnicalSkill, setNewTechnicalSkill] = useState("");
  const [newInterpersonalSkill, setNewInterpersonalSkill] = useState("");
  const [interviewLimits, setInterviewLimits] = useState<InterviewLimitsState>({
    maxInterviews: "",
    outstandingCap: "",
    greatCap: "",
  });

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

  function handleGenerateDraft() {
    const nextErrors = validateDraft(fields);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    const result = extractJobConfiguration({
      title: fields.title,
      description: fields.description,
    });

    if (!result.success) {
      setExtractionError(result.error);
      setDraft(null);
      return;
    }

    setExtractionError(null);
    setDraft(result.data);
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

  return (
    <div className="flex flex-1 flex-col gap-6 px-6 py-6 md:px-8">
      <PlaceholderState
        eyebrow="Create job"
        title="New job configuration starts from recruiter inputs, not manual script authoring."
        description="The create-job route is a long-form workflow: define the role, trigger extraction, then review editable sections below without leaving the page."
      >
        <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <SectionCard
            title="Recruiter inputs"
            kicker="Manual entry"
            description="The first block captures the minimum role context required to extract a usable job configuration draft."
            tone="strong"
            footer={
              <div className="flex flex-wrap gap-3">
                <Button
                  className="rounded-full px-6"
                  disabled={!canExtract}
                  onClick={handleGenerateDraft}
                  type="button"
                >
                  Generate draft
                </Button>
                <Button
                  variant="outline"
                  className="rounded-full px-6"
                  type="button"
                >
                  Save as draft
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
                hint="Use the recruiter-facing title candidates will recognize."
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
                hint="The MVP supports one configured interview language per job."
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
                hint="Include operating context, requirements, location, schedule, and pay when known."
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
            title="Extraction host area"
            kicker="Long-form workflow"
            description="This panel reserves the page structure that will hold extracted conditions, scored sections, limits, and publish state below the initial form."
          >
            {draft ? (
              <div className="rounded-[1.4rem] border border-emerald-200/80 bg-emerald-50/70 px-4 py-4 text-sm leading-7 text-emerald-900">
                Draft ready. Extracted conditions can now be reviewed and edited
                below.
              </div>
            ) : (
              <LoadingState
                eyebrow="Shared loading"
                title="Extraction is preparing the first configuration draft."
                description="Use this while job conditions, requirements, and limits are still being assembled from the recruiter input."
                rows={2}
              />
            )}
            <div className="grid gap-3 sm:grid-cols-2">
              <DataPoint
                label="Required fields"
                value="3"
                detail="Title, language, description"
              />
              <DataPoint
                label="Desktop flow"
                value="Long form"
                detail="Not a step-by-step wizard"
              />
            </div>
            <div className="mt-5 rounded-[1.4rem] border border-dashed border-slate-300/90 bg-white/70 px-4 py-5 text-sm leading-7 text-slate-600">
              Extracted sections will render here after the recruiter submits a
              valid role brief.
            </div>
            {extractionError ? (
              <div className="mt-4 rounded-[1.2rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
                {extractionError}
              </div>
            ) : null}
          </SectionCard>
        </div>

        {draft ? (
          <SectionCard
            title="Job conditions"
            kicker="BRE-24"
            description="Operational conditions are separate from scored requirements and can remain missing or incomplete until the recruiter resolves them."
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
            kicker="BRE-25"
            description="Essential requirements are editable scored items and remain clearly separated from operational job conditions."
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
            kicker="BRE-26"
            description="Technical skills keep task-specific or hard-skill requirements separate from general essentials and soft-skill criteria."
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
            kicker="BRE-27"
            description="Interpersonal skills are edited independently from technical capabilities so the behavioral block stays distinct."
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
            kicker="BRE-28"
            description="Operational limits let recruiters cap total interview volume and optionally stop after enough top-scoring candidates are collected."
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
                hint="Optional. Pause once enough top-tier candidates are found."
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
                hint="Optional. Useful when the recruiter wants enough strong backups."
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

        <div className="grid gap-4 lg:grid-cols-[1fr_0.8fr]">
          <SectionCard
            title="Create-job workflow"
            kicker="Page structure"
            description="The route is organized for one long desktop review surface so recruiters can move from input to publish in a single scroll."
          >
            <div className="grid gap-3 sm:grid-cols-3">
              <DataPoint
                label="Inputs"
                value="Ready"
                detail="Validated before extraction"
              />
              <DataPoint
                label="Sections"
                value="Queued"
                detail="Render below the base form"
              />
              <DataPoint
                label="Publish"
                value="Later"
                detail="Final state at the bottom"
              />
            </div>
          </SectionCard>

          <DetailPanel
            title="Operator notes"
            kicker="Desktop-first"
            description="The page is intentionally wide and scrollable so extracted data can accumulate below the initial form without becoming a wizard."
          >
            <div className="space-y-3 text-sm leading-7 text-slate-600">
              <p>Recruiter inputs stay fixed at the top of the workflow.</p>
              <p>Validation happens before extraction is allowed.</p>
              <p>
                Extracted sections will stack underneath this opening block.
              </p>
            </div>
          </DetailPanel>
        </div>
      </PlaceholderState>
    </div>
  );
}
