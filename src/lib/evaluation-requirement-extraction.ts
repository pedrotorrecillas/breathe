import type {
  EvaluationRequirementEvidence,
  EvaluationRequirementEvidenceSet,
} from "@/domain/evaluations/types";
import type { JobRequirement } from "@/domain/jobs/types";
import type { EntityId } from "@/domain/shared/types";

type TranscriptSegment = {
  text: string;
  startMs?: number | null;
  endMs?: number | null;
};

export type RequirementEvidenceExtractionInput = {
  interviewRunId: EntityId;
  jobId: EntityId;
  requirements: JobRequirement[];
  transcript: string | TranscriptSegment[];
  generatedAt?: Date;
};

const positiveCues = [
  "experience",
  "worked",
  "managed",
  "handled",
  "familiar",
  "confident",
  "led",
  "coordinated",
  "supported",
  "successfully",
  "regularly",
  "clearly",
  "team",
  "detail",
  "fast",
  "reliable",
];

const negativeCues = [
  "no experience",
  "never worked",
  "not sure",
  "can't",
  "cannot",
  "unable",
  "didn't",
  "did not",
  "lack",
  "limited experience",
];

function normalizeText(value: string) {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function tokenize(value: string) {
  return Array.from(
    new Set(
      normalizeText(value)
        .split(/[^a-z0-9]+/)
        .map((part) => part.trim())
        .filter((part) => part.length > 2),
    ),
  );
}

function clampScore(score: number) {
  return Math.max(0, Math.min(100, Math.round(score)));
}

function flattenTranscript(transcript: string | TranscriptSegment[]) {
  if (typeof transcript !== "string") {
    return transcript.map((segment) => ({
      text: segment.text,
      startMs: segment.startMs ?? null,
      endMs: segment.endMs ?? null,
    }));
  }

  return transcript
    .split(/\n|[.!?]/)
    .map((part) => part.trim())
    .filter((part) => part.length > 0)
    .map((part) => ({
      text: part,
      startMs: null,
      endMs: null,
    }));
}

function summarizeRequirementAnswer(
  transcriptSegments: ReturnType<typeof flattenTranscript>,
  requirement: JobRequirement,
): EvaluationRequirementEvidence {
  const keywords = tokenize(`${requirement.label} ${requirement.description}`);
  const scoredSegments = transcriptSegments
    .map((segment) => {
      const segmentText = normalizeText(segment.text);
      const keywordHits = keywords.filter((keyword) =>
        segmentText.includes(keyword),
      ).length;
      const positiveHits = positiveCues.filter((cue) =>
        segmentText.includes(cue),
      ).length;
      const negativeHits = negativeCues.filter((cue) =>
        segmentText.includes(cue),
      ).length;

      return {
        segment,
        score: keywordHits * 3 + positiveHits * 2 - negativeHits * 4,
        keywordHits,
        positiveHits,
        negativeHits,
      };
    })
    .filter((candidate) => candidate.score > 0)
    .sort((left, right) => right.score - left.score);

  const bestSegment = scoredSegments[0] ?? null;

  if (!bestSegment) {
    return {
      requirementId: requirement.id,
      requirementLabel: requirement.label,
      requirementCategory: requirement.category,
      answerText: null,
      highlightedQuote: null,
      transcriptStartMs: null,
      transcriptEndMs: null,
      extractionConfidence: 0,
      extractionExplanation: `No clear answer was found for ${requirement.label.toLowerCase()}.`,
    };
  }

  const answerText = bestSegment.segment.text.trim();

  return {
    requirementId: requirement.id,
    requirementLabel: requirement.label,
    requirementCategory: requirement.category,
    answerText,
    highlightedQuote: answerText,
    transcriptStartMs: bestSegment.segment.startMs ?? null,
    transcriptEndMs: bestSegment.segment.endMs ?? null,
    extractionConfidence: clampScore(45 + bestSegment.score * 5),
    extractionExplanation: `Matched ${bestSegment.keywordHits} requirement keywords and ${bestSegment.positiveHits} positive cues in the transcript.`,
  };
}

export function extractRequirementEvidenceFromTranscript(
  input: RequirementEvidenceExtractionInput,
): EvaluationRequirementEvidenceSet {
  const generatedAt = (input.generatedAt ?? new Date()).toISOString();
  const transcriptSegments = flattenTranscript(input.transcript);

  return {
    interviewRunId: input.interviewRunId,
    jobId: input.jobId,
    generatedAt,
    requirementEvidence: input.requirements.map((requirement) =>
      summarizeRequirementAnswer(transcriptSegments, requirement),
    ),
  };
}
