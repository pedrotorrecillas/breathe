import type {
  JobConditionInput,
  JobExtractionDraft,
  JobRequirementInput,
} from "@/domain/jobs/configuration";
import type { JobRequirement } from "@/domain/jobs/types";
import type { SupportedLanguage } from "@/domain/shared/types";
import { saveStoredJob } from "@/lib/db/runtime-store";
import type { PublicJobRecord } from "@/lib/public-jobs";

type PublishRecruiterJobInput = {
  title: string;
  language: SupportedLanguage;
  description: string;
  draft: JobExtractionDraft;
  interviewLimits: {
    maxInterviews: number | null;
    outstandingCap: number | null;
    greatCap: number | null;
  };
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

function toConditionRequirement(condition: JobConditionInput): JobRequirement {
  return {
    id: condition.id,
    code: condition.code,
    label: condition.label,
    description: condition.value || condition.details || condition.label,
    category: "condition",
    weight: 1,
    isKnockout: true,
  };
}

function toScoredRequirement(
  requirement: JobRequirementInput,
  category: "essential" | "technical" | "interpersonal",
): JobRequirement {
  return {
    id: requirement.id,
    code: null,
    label: requirement.label,
    description: requirement.label,
    category,
    weight: requirement.importance === "MANDATORY" ? 3 : 2,
    isKnockout: false,
  };
}

function inferLocation(description: string) {
  const text = description.toLowerCase();
  if (text.includes("madrid")) return "Madrid";
  if (text.includes("barcelona")) return "Barcelona";
  if (text.includes("valencia")) return "Valencia";
  return null;
}

function findConditionValue(
  conditions: JobConditionInput[],
  code: JobConditionInput["code"],
) {
  return conditions.find((condition) => condition.code === code)?.value || null;
}

export async function publishRecruiterJob(input: PublishRecruiterJobInput) {
  const slug = slugify(input.title) || "job-draft";
  const createdAt = new Date().toISOString();

  const job: PublicJobRecord = {
    id: `job_${slug}`,
    recruiterSlug: slug,
    title: input.title.trim(),
    summary: input.description.trim().slice(0, 140),
    description: input.description.trim(),
    location: inferLocation(input.description),
    salary: findConditionValue(input.draft.jobConditions, "salary"),
    schedule: findConditionValue(input.draft.jobConditions, "schedule"),
    status: "active",
    interviewLanguage: input.language,
    createdAt,
    publishedAt: createdAt,
    expiresAt: null,
    publicApplyPath: `/apply/${slug}`,
    pipeline: {
      applicants: 0,
      interviewed: 0,
      shortlisted: 0,
      hired: 0,
      rejected: 0,
    },
    requirements: [
      ...input.draft.jobConditions.map(toConditionRequirement),
      ...input.draft.essentialRequirements.map((item) =>
        toScoredRequirement(item, "essential"),
      ),
      ...input.draft.technicalSkills.map((item) =>
        toScoredRequirement(item, "technical"),
      ),
      ...input.draft.interpersonalSkills.map((item) =>
        toScoredRequirement(item, "interpersonal"),
      ),
    ],
    interviewLimits: input.interviewLimits,
  };

  return saveStoredJob(job);
}
