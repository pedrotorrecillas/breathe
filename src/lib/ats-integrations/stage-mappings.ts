import type {
  ATSConnection,
  ATSInternalStageKey,
} from "@/domain/ats-integrations/types";
import type { CandidatePipelineStage } from "@/domain/candidates/types";

const internalStageMappingOrder: ATSInternalStageKey[] = [
  "applicant",
  "interviewed",
  "shortlisted",
  "hired",
  "rejected",
  "needs_human",
];

const scopedStageSeparator = "|stage:";
const scopedJobPrefix = "job:";

function decodeStageMappingPart(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export function stageMappingValueForExternalStage(input: {
  externalJobId: string | null;
  externalStageId: string;
}) {
  if (!input.externalJobId) {
    return input.externalStageId;
  }

  return `${scopedJobPrefix}${encodeURIComponent(
    input.externalJobId,
  )}${scopedStageSeparator}${encodeURIComponent(input.externalStageId)}`;
}

function parseScopedStageMappingValue(value: string) {
  if (!value.startsWith(scopedJobPrefix)) {
    return null;
  }

  const separatorIndex = value.indexOf(scopedStageSeparator);

  if (separatorIndex < 0) {
    return null;
  }

  return {
    externalJobId: decodeStageMappingPart(
      value.slice(scopedJobPrefix.length, separatorIndex),
    ),
    externalStageId: decodeStageMappingPart(
      value.slice(separatorIndex + scopedStageSeparator.length),
    ),
  };
}

export function externalStageIdForStageMappingValue(value: string) {
  return parseScopedStageMappingValue(value)?.externalStageId ?? value;
}

export function stageMappingValueMatchesExternalStage(input: {
  mappingValue: string;
  externalJobId: string | null;
  externalStageId: string | null;
}) {
  if (!input.externalStageId) {
    return false;
  }

  const scoped = parseScopedStageMappingValue(input.mappingValue);

  if (!scoped) {
    return input.mappingValue === input.externalStageId;
  }

  return (
    scoped.externalJobId === input.externalJobId &&
    scoped.externalStageId === input.externalStageId
  );
}

export function writebackStageIdForMappingValue(input: {
  mappingValue: string;
  externalJobId: string | null;
}) {
  const scoped = parseScopedStageMappingValue(input.mappingValue);

  if (!scoped) {
    return input.mappingValue;
  }

  if (scoped.externalJobId !== input.externalJobId) {
    return null;
  }

  return scoped.externalStageId;
}

export function internalStageForExternalStage(input: {
  connection: ATSConnection | null | undefined;
  externalJobId?: string | null;
  externalStageId: string | null;
}): CandidatePipelineStage | null {
  if (!input.connection || !input.externalStageId) {
    return null;
  }

  const mappings = input.connection.writebackPolicy?.stageMoveMappings ?? {};
  const matchingStage = internalStageMappingOrder.find(
    (stage) =>
      mappings[stage] &&
      stageMappingValueMatchesExternalStage({
        mappingValue: mappings[stage],
        externalJobId: input.externalJobId ?? null,
        externalStageId: input.externalStageId,
      }),
  );

  return matchingStage ?? null;
}
