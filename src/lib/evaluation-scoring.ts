import type {
  CandidateEvaluation,
  EvaluationBlockCategory,
  EvaluationBlockResult,
  EvaluationRequirementEvidence,
  EvaluationRequirementEvidenceSet,
  EvaluationRequirementImportance,
  EvaluationRequirementResult,
  EvaluationWeightConfig,
} from "@/domain/evaluations/types";
import type { InterviewRun } from "@/domain/interviews/types";
import type { JobRequirement, JobRequirementCategory } from "@/domain/jobs/types";

type EvaluationScoringInput = {
  interviewRun: InterviewRun;
  requirements: JobRequirement[];
  requirementEvidence: EvaluationRequirementEvidenceSet;
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

const blockLabels: Record<EvaluationBlockCategory, string> = {
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

function buildBlankBlocks(): EvaluationBlockResult[] {
  return categoryOrder.map((category) => ({
    category,
    label: blockLabels[category],
    numericScore: null,
    scoreState: "Pending",
    requirements: [],
  }));
}

function hasRichOutputGate(input: EvaluationScoringInput) {
  return (
    (input.classification ?? "success") === "success" &&
    (input.generateOutput ?? true) === true &&
    (input.eligible ?? true) === true &&
    input.interviewRun.status === "completed"
  );
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

function requirementEvidenceText(evidence: EvaluationRequirementEvidence | null) {
  if (!evidence) {
    return "";
  }

  return normalizeText(
    [evidence.answerText, evidence.highlightedQuote]
      .filter((part): part is string => typeof part === "string" && part.length > 0)
      .join(" "),
  );
}

function scoreRequirement(
  requirement: JobRequirement,
  evidence: EvaluationRequirementEvidence | null,
): EvaluationRequirementResult {
  const evidenceText = requirementEvidenceText(evidence);
  const requirementText = normalizeText(
    `${requirement.label} ${requirement.description}`,
  );
  const requirementKeywords = tokenize(requirementText);
  const importance = deriveRequirementImportance(requirement);

  let score = requirement.category === "essential" ? 58 : 52;

  const keywordHits = requirementKeywords.filter((keyword) =>
    evidenceText.includes(keyword),
  ).length;
  const positiveHits = positiveCues.filter((cue) => evidenceText.includes(cue)).length;
  const negativeHits = negativeCues.filter((cue) => evidenceText.includes(cue)).length;

  score += Math.min(keywordHits * 10, 30);
  score += Math.min(positiveHits * 3, 12);
  score -= Math.min(negativeHits * 12, 36);

  if (!evidence?.answerText) {
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
    scoreState: mapNumericScoreToState(numericScore),
    explanation: evidence?.answerText
      ? `The extracted answer provides direct evidence for ${requirement.label.toLowerCase()}.`
      : `The extracted answer provides limited direct evidence for ${requirement.label.toLowerCase()}.`,
    evidence: evidence
      ? {
          highlightedQuote: evidence.highlightedQuote,
          transcriptStartMs: evidence.transcriptStartMs,
          transcriptEndMs: evidence.transcriptEndMs,
        }
      : null,
  };
}

function buildBlock(
  category: EvaluationBlockCategory,
  requirements: JobRequirement[],
  evidenceByRequirementId: Map<string, EvaluationRequirementEvidence>,
  weightConfig: EvaluationWeightConfig,
): EvaluationBlockResult {
  const evaluatedRequirements = requirements.map((requirement) =>
    scoreRequirement(requirement, evidenceByRequirementId.get(requirement.id) ?? null),
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
    scoreState: mapNumericScoreToState(numericScore),
    requirements: evaluatedRequirements,
  };
}

export function mapNumericScoreToState(
  score: number | null,
): CandidateEvaluation["finalScoreState"] {
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

export function scoreEvaluationFromRequirementEvidence(
  input: EvaluationScoringInput,
): CandidateEvaluation {
  const generatedAt = (input.generatedAt ?? new Date()).toISOString();
  const weightConfigSnapshot = normalizeWeightConfig(input.weightConfig);

  if (!hasRichOutputGate(input)) {
    return {
      id: `eval_${input.interviewRun.id}`,
      interviewRunId: input.interviewRun.id,
      generatedAt,
      finalNumericScore: null,
      finalScoreState: mapNumericScoreToState(null),
      blocks: buildBlankBlocks(),
      weightConfigSnapshot,
      fitClassification: null,
    };
  }

  const evidenceByRequirementId = new Map(
    input.requirementEvidence.requirementEvidence.map((evidence) => [
      evidence.requirementId,
      evidence,
    ]),
  );

  const scoredRequirements = input.requirements.filter(
    (requirement) => !blockedCategories.includes(requirement.category),
  );

  const blocks = categoryOrder.map((category) =>
    buildBlock(
      category,
      scoredRequirements.filter((requirement) => requirement.category === category),
      evidenceByRequirementId,
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
    finalScoreState: mapNumericScoreToState(finalNumericScore),
    blocks,
    weightConfigSnapshot,
    fitClassification: finalClassification(finalNumericScore),
  };
}

