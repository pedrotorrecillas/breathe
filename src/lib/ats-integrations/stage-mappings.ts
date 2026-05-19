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

export function internalStageForExternalStage(input: {
  connection: ATSConnection | null | undefined;
  externalStageId: string | null;
}): CandidatePipelineStage | null {
  if (!input.connection || !input.externalStageId) {
    return null;
  }

  const mappings = input.connection.writebackPolicy?.stageMoveMappings ?? {};
  const matchingStage = internalStageMappingOrder.find(
    (stage) => mappings[stage] === input.externalStageId,
  );

  return matchingStage ?? null;
}
