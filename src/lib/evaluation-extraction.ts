import type { CandidateEvaluation, EvaluationBlockCategory, EvaluationBlockResult, EvaluationEvidence, EvaluationRequirementResult, EvaluationScoreState, EvaluationWeightConfig } from "@/domain/evaluations/types";
import type { InterviewRun } from "@/domain/interviews/types";
import type { Job, JobRequirement, JobRequirementCategory } from "@/domain/jobs/types";

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

const defaultWeightConfig: EvaluationWeightConfig = {
  mandatoryRequirementWeight: 0.8,
  optionalRequirementWeight: 0.2,
  essentialBlockWeight: 0.45,
  technicalBlockWeight: 0.45,
  interpersonalBlockWeight: 0.1,
};

const blockedCategories: JobRequirementCategory[] = ["condition"];

const blockLabels: Record<Exclude<EvaluationBlockCategory, never>, string> = {
  essential: "Essential requirements",
  technical: "Technical skills",
  interpersonal: "Interpersonal skills",
};

const categoryOrder: EvaluationBlockCategory[] = [
  "essential",
  "technical",
  "interpersonal",
];

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
  return unique(
    normalizeText(value)
      .split(/[^a-z0-9]+/)
      .map((part) => part.trim())
      .filter((part) => part.length > 2),
  );
}

function unique<T>(items: T[]) {
  return Array.from(new Set(items));
}

function clampScore(score: number) {
  return Math.max(0, Math.min(100, Math.round(score)));
}

function toScoreState(score: number | null): EvaluationScoreState {
  if (score === null) {
    return "Pending";
  }

  if (score >= 90) {
    return "Outstanding";
  }
  if (score >= 75) {
    return "Great";
  }
  if (score >= 60) {
    return "Good";
  }
  if (score >= 50) {
    return "Average";
  }
  if (score >= 30) {
    return "Low";
  }

  return "Poor";
}

function normalizeWeightConfig(
  overrides?: Partial<EvaluationWeightConfig>,
): EvaluationWeightConfig {
  return {
    ...defaultWeightConfig,
    ...overrides,
  };
}

function deriveRequirementImportance(
  requirement: JobRequirement,
): EvaluationRequirementImportance {
  return requirement.isKnockout || requirement.weight >= 3
    ? "MANDATORY"
    : "OPTIONAL";
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

function buildBlankBlocks(): EvaluationBlockResult[] {
  return categoryOrder.map((category) => ({
    category,
    label: blockLabels[category],
    numericScore: null,
    scoreState: "Pending",
    requirements: [],
  }));
}

function hasRichOutputGate(input: EvaluationExtractionInput) {
  return (
    (input.classification ?? "success") === "success" &&
    (input.generateOutput ?? true) === true &&
    (input.eligible ?? true) === true &&
    input.interviewRun.status === "completed"
  );
}

function requirementEvidence(
  transcriptSegments: ReturnType<typeof flattenTranscript>,
  requirement: JobRequirement,
): EvaluationEvidence | null {
  const keywords = tokenize(`${requirement.label} ${requirement.description}`);
  if (keywords.length === 0) {
    return null;
  }

  const bestSegment = transcriptSegments
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
      };
    })
    .filter((candidate) => candidate.score > 0)
    .sort((left, right) => right.score - left.score)[0];

  if (!bestSegment) {
    return null;
  }

  return {
    highlightedQuote: bestSegment.segment.text.trim(),
    transcriptStartMs: bestSegment.segment.startMs ?? null,
    transcriptEndMs: bestSegment.segment.endMs ?? null,
  };
}

function scoreRequirement(
  transcriptSegments: ReturnType<typeof flattenTranscript>,
  requirement: JobRequirement,
): EvaluationRequirementResult {
  const evidence = requirementEvidence(transcriptSegments, requirement);
  const transcriptText = transcriptSegments
    .map((segment) => segment.text)
    .join(" ");
  const normalizedTranscript = normalizeText(transcriptText);
  const requirementText = normalizeText(
    `${requirement.label} ${requirement.description}`,
  );
  const requirementKeywords = tokenize(requirementText);
  const importance = deriveRequirementImportance(requirement);

  let score = requirement.category === "essential" ? 58 : 52;

  const keywordHits = requirementKeywords.filter((keyword) =>
    normalizedTranscript.includes(keyword),
  ).length;
  const positiveHits = positiveCues.filter((cue) =>
    normalizedTranscript.includes(cue),
  ).length;
  const negativeHits = negativeCues.filter((cue) =>
    normalizedTranscript.includes(cue),
  ).length;

  score += Math.min(keywordHits * 10, 30);
  score += Math.min(positiveHits * 3, 12);
  score -= Math.min(negativeHits * 12, 36);

  if (!evidence) {
    score -= 10;
  }

  if (importance === "MANDATORY") {
    score += keywordHits > 0 ? 4 : -6;
  } else {
    score += keywordHits > 0 ? 2 : -3;
  }

  const numericScore = clampScore(score);

  return {
    requirementId: requirement.id,
    label: requirement.label,
    importance,
    numericScore,
    scoreState: toScoreState(numericScore),
    explanation: evidence
      ? `The transcript provides direct evidence for ${requirement.label.toLowerCase()}.`
      : `The transcript provides limited direct evidence for ${requirement.label.toLowerCase()}.`,
    evidence,
  };
}

function weightedAverage(
  values: Array<{ numericScore: number | null; weight: number }>,
) {
  const usable = values.filter((item) => item.numericScore !== null);
  if (usable.length === 0) {
    return null;
  }

  const numerator = usable.reduce(
    (sum, item) => sum + (item.numericScore ?? 0) * item.weight,
    0,
  );
  const denominator = usable.reduce((sum, item) => sum + item.weight, 0);

  if (denominator === 0) {
    return null;
  }

  return clampScore(numerator / denominator);
}

function buildBlock(
  category: EvaluationBlockCategory,
  requirements: JobRequirement[],
  transcriptSegments: ReturnType<typeof flattenTranscript>,
  weightConfig: EvaluationWeightConfig,
): EvaluationBlockResult {
  const evaluatedRequirements = requirements.map((requirement) =>
    scoreRequirement(transcriptSegments, requirement),
  );

  const numericScore = weightedAverage(
    evaluatedRequirements.map((result) => ({
      numericScore: result.numericScore,
      weight:
        result.importance === "MANDATORY"
          ? weightConfig.mandatoryRequirementWeight
          : weightConfig.optionalRequirementWeight,
    })),
  );

  return {
    category,
    label: blockLabels[category],
    numericScore,
    scoreState: toScoreState(numericScore),
    requirements: evaluatedRequirements,
  };
}

function finalClassification(score: number | null) {
  if (score === null) {
    return null;
  }

  if (score >= 80) {
    return "strong_fit";
  }

  if (score >= 60) {
    return "viable_fit";
  }

  return "weak_fit";
}

export function extractEvaluationFromInterview(input: EvaluationExtractionInput): CandidateEvaluation {
  const generatedAt = (input.generatedAt ?? new Date()).toISOString();
  const weightConfigSnapshot = normalizeWeightConfig(input.weightConfig);
  const transcriptSegments = flattenTranscript(input.transcript);

  if (!hasRichOutputGate(input)) {
    return {
      id: `eval_${input.interviewRun.id}`,
      interviewRunId: input.interviewRun.id,
      generatedAt,
      finalNumericScore: null,
      finalScoreState: "Pending",
      blocks: buildBlankBlocks(),
      weightConfigSnapshot,
      fitClassification: null,
    };
  }

  const blocks = categoryOrder.map((category) =>
    buildBlock(
      category,
      input.job.requirements.filter(
        (requirement) =>
          !blockedCategories.includes(requirement.category) &&
          requirement.category === category,
      ),
      transcriptSegments,
      weightConfigSnapshot,
    ),
  );

  const finalNumericScore = weightedAverage(
    blocks.map((block) => ({
      numericScore: block.numericScore,
      weight:
        block.category === "essential"
          ? weightConfigSnapshot.essentialBlockWeight
          : block.category === "technical"
            ? weightConfigSnapshot.technicalBlockWeight
            : weightConfigSnapshot.interpersonalBlockWeight,
    })),
  );

  return {
    id: `eval_${input.interviewRun.id}`,
    interviewRunId: input.interviewRun.id,
    generatedAt,
    finalNumericScore,
    finalScoreState: toScoreState(finalNumericScore),
    blocks,
    weightConfigSnapshot,
    fitClassification: finalClassification(finalNumericScore),
  };
}
