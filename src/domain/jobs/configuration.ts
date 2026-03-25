import type { EntityId } from "@/domain/shared/types";

import type { JobConditionCode } from "@/domain/jobs/types";

export type RequirementImportance = "MANDATORY" | "OPTIONAL";

export type JobConditionState = "complete" | "incomplete" | "missing";

export type JobConditionInput = {
  id: EntityId;
  code: JobConditionCode;
  label: string;
  value: string;
  state: JobConditionState;
  details: string;
};

export type JobRequirementInput = {
  id: EntityId;
  label: string;
  importance: RequirementImportance;
};

export type JobExtractionDraft = {
  jobConditions: JobConditionInput[];
  essentialRequirements: JobRequirementInput[];
  technicalSkills: JobRequirementInput[];
  interpersonalSkills: JobRequirementInput[];
};

type ParseResult<T> =
  | { success: true; data: T }
  | { success: false; errors: string[] };

const requirementImportance = new Set<RequirementImportance>([
  "MANDATORY",
  "OPTIONAL",
]);

const conditionStates = new Set<JobConditionState>([
  "complete",
  "incomplete",
  "missing",
]);

const conditionCodes = new Set<JobConditionCode>([
  "salary",
  "location",
  "schedule",
  "right_to_work",
  "driving_license",
  "remote_policy",
  "contract_type",
  "visa_status",
  "other",
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asTrimmedString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function parseRequirementArray(
  value: unknown,
  path: string,
  errors: string[],
): JobRequirementInput[] {
  if (!Array.isArray(value)) {
    errors.push(`${path} must be an array`);
    return [];
  }

  return value.flatMap((item, index) => {
    if (!isRecord(item)) {
      errors.push(`${path}[${index}] must be an object`);
      return [];
    }

    const id = asTrimmedString(item.id);
    const label = asTrimmedString(item.label);
    const importance = item.importance;

    if (!id) {
      errors.push(`${path}[${index}].id is required`);
    }
    if (!label) {
      errors.push(`${path}[${index}].label is required`);
    }
    if (!requirementImportance.has(importance as RequirementImportance)) {
      errors.push(`${path}[${index}].importance must be MANDATORY or OPTIONAL`);
    }

    if (
      !id ||
      !label ||
      !requirementImportance.has(importance as RequirementImportance)
    ) {
      return [];
    }

    return [
      {
        id,
        label,
        importance: importance as RequirementImportance,
      },
    ];
  });
}

function parseConditionArray(
  value: unknown,
  path: string,
  errors: string[],
): JobConditionInput[] {
  if (!Array.isArray(value)) {
    errors.push(`${path} must be an array`);
    return [];
  }

  return value.flatMap((item, index) => {
    if (!isRecord(item)) {
      errors.push(`${path}[${index}] must be an object`);
      return [];
    }

    const id = asTrimmedString(item.id);
    const code = item.code;
    const label = asTrimmedString(item.label);
    const valueText = asTrimmedString(item.value);
    const state = item.state;
    const details = asTrimmedString(item.details);

    if (!id) {
      errors.push(`${path}[${index}].id is required`);
    }
    if (!conditionCodes.has(code as JobConditionCode)) {
      errors.push(`${path}[${index}].code is invalid`);
    }
    if (!label) {
      errors.push(`${path}[${index}].label is required`);
    }
    if (!conditionStates.has(state as JobConditionState)) {
      errors.push(
        `${path}[${index}].state must be complete, incomplete, or missing`,
      );
    }
    if ((state === "complete" || state === "incomplete") && !valueText) {
      errors.push(
        `${path}[${index}].value is required when the condition is not missing`,
      );
    }

    if (
      !id ||
      !conditionCodes.has(code as JobConditionCode) ||
      !label ||
      !conditionStates.has(state as JobConditionState)
    ) {
      return [];
    }

    return [
      {
        id,
        code: code as JobConditionCode,
        label,
        value: valueText,
        state: state as JobConditionState,
        details,
      },
    ];
  });
}

export function parseJobExtractionDraft(
  value: unknown,
): ParseResult<JobExtractionDraft> {
  if (!isRecord(value)) {
    return {
      success: false,
      errors: ["job extraction draft must be an object"],
    };
  }

  const errors: string[] = [];

  const draft: JobExtractionDraft = {
    jobConditions: parseConditionArray(
      value.jobConditions,
      "jobConditions",
      errors,
    ),
    essentialRequirements: parseRequirementArray(
      value.essentialRequirements,
      "essentialRequirements",
      errors,
    ),
    technicalSkills: parseRequirementArray(
      value.technicalSkills,
      "technicalSkills",
      errors,
    ),
    interpersonalSkills: parseRequirementArray(
      value.interpersonalSkills,
      "interpersonalSkills",
      errors,
    ),
  };

  if (errors.length > 0) {
    return { success: false, errors };
  }

  return { success: true, data: draft };
}
