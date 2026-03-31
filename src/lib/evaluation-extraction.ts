import type { CandidateEvaluation, EvaluationWeightConfig } from "@/domain/evaluations/types";
import type { InterviewRun } from "@/domain/interviews/types";
import type { Job } from "@/domain/jobs/types";
import {
  extractRequirementEvidenceFromTranscript,
} from "@/lib/evaluation-requirement-extraction";
import { scoreEvaluationFromRequirementEvidence } from "@/lib/evaluation-scoring";

type TranscriptSegment = {
  text: string;
  startMs?: number | null;
  endMs?: number | null;
};

export type EvaluationExtractionInput = {
  interviewRun: InterviewRun;
  job: Job;
  transcript: string | TranscriptSegment[];
  classification?: "success" | "failure";
  generateOutput?: boolean;
  eligible?: boolean;
  generatedAt?: Date;
  weightConfig?: Partial<EvaluationWeightConfig>;
};

export function extractEvaluationFromInterview(
  input: EvaluationExtractionInput,
): CandidateEvaluation {
  const requirementEvidence = extractRequirementEvidenceFromTranscript({
    interviewRunId: input.interviewRun.id,
    jobId: input.job.id,
    requirements: input.job.requirements,
    transcript: input.transcript,
    generatedAt: input.generatedAt,
  });

  return scoreEvaluationFromRequirementEvidence({
    interviewRun: input.interviewRun,
    requirements: input.job.requirements,
    requirementEvidence,
    classification: input.classification,
    generateOutput: input.generateOutput,
    eligible: input.eligible,
    generatedAt: input.generatedAt,
    weightConfig: input.weightConfig,
  });
}
