"use client";

import { useState } from "react";

import { FormField } from "@/components/form-field";
import { PlaceholderState } from "@/components/placeholder-state";
import { DataPoint, DetailPanel, SectionCard } from "@/components/section-card";
import { LoadingState } from "@/components/shared-states";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

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
  }

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
            <LoadingState
              eyebrow="Shared loading"
              title="Extraction is preparing the first configuration draft."
              description="Use this while job conditions, requirements, and limits are still being assembled from the recruiter input."
              rows={2}
            />
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
          </SectionCard>
        </div>

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
