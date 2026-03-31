import type {
  CandidateEvaluation,
  EvaluationBlockCategory,
  EvaluationBlockResult,
  EvaluationRequirementResult,
  EvaluationScoreState,
} from "@/domain/evaluations/types";

export type EvaluationSummary = {
  headline: string;
  summary: string;
  strengths: string[];
  concerns: string[];
  finalNumericScore: number | null;
  finalScoreState: EvaluationScoreState;
};

const blockPriority: Record<EvaluationBlockCategory, number> = {
  essential: 0,
  technical: 1,
  interpersonal: 2,
};

function hasScore(block: EvaluationBlockResult) {
  return block.numericScore !== null && block.requirements.length > 0;
}

function sortBlocks(blocks: EvaluationBlockResult[]) {
  return [...blocks].sort((left, right) => {
    const scoreDelta = (right.numericScore ?? -1) - (left.numericScore ?? -1);
    if (scoreDelta !== 0) {
      return scoreDelta;
    }

    return blockPriority[left.category] - blockPriority[right.category];
  });
}

function sortRequirements(requirements: EvaluationRequirementResult[]) {
  return [...requirements].sort((left, right) => {
    const scoreDelta = (right.numericScore ?? -1) - (left.numericScore ?? -1);
    if (scoreDelta !== 0) {
      return scoreDelta;
    }

    if (left.importance !== right.importance) {
      return left.importance === "MANDATORY" ? -1 : 1;
    }

    return left.label.localeCompare(right.label);
  });
}

function formatRequirements(requirements: EvaluationRequirementResult[], limit: number) {
  return sortRequirements(requirements)
    .slice(0, limit)
    .map((requirement) => `${requirement.label} (${requirement.scoreState})`);
}

function joinPhrases(items: string[]) {
  if (items.length <= 1) {
    return items[0] ?? "";
  }

  if (items.length === 2) {
    return `${items[0]} and ${items[1]}`;
  }

  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}

function headlineForScore(score: number | null, scoreState: EvaluationScoreState) {
  if (score === null) {
    return "Pending · no score yet";
  }

  return `${scoreState} · ${score}/100`;
}

function buildBlockSentence(
  block: EvaluationBlockResult,
  label: "strongest" | "softest",
  limit: number,
) {
  const requirements = formatRequirements(block.requirements, limit);
  const prefix =
    label === "strongest"
      ? `${block.label} stand out as the strongest block`
      : `${block.label} stand out as the softest area`;

  if (requirements.length === 0) {
    return `${prefix}.`;
  }

  const verb = label === "strongest" ? "led by" : "with";
  const suffix =
    label === "strongest"
      ? joinPhrases(requirements)
      : `${joinPhrases(requirements)} as the main watchout`;

  return `${prefix}, ${verb} ${suffix}.`;
}

export function buildEvaluationSummary(
  evaluation: CandidateEvaluation,
): EvaluationSummary {
  const scoredBlocks = sortBlocks(
    evaluation.blocks.filter((block) => hasScore(block)),
  );

  if (scoredBlocks.length === 0) {
    return {
      headline: headlineForScore(evaluation.finalNumericScore, evaluation.finalScoreState),
      summary: "No scored requirements are available yet.",
      strengths: [],
      concerns: [],
      finalNumericScore: evaluation.finalNumericScore,
      finalScoreState: evaluation.finalScoreState,
    };
  }

  const strongestBlock = scoredBlocks[0];
  const weakestBlock =
    scoredBlocks.length > 1 ? scoredBlocks[scoredBlocks.length - 1] : null;

  const strengths = formatRequirements(strongestBlock.requirements, 2);
  const concerns =
    weakestBlock && weakestBlock.category !== strongestBlock.category
      ? formatRequirements(weakestBlock.requirements, 2)
      : [];

  const summaryParts = [buildBlockSentence(strongestBlock, "strongest", 2)];

  if (weakestBlock && weakestBlock.category !== strongestBlock.category) {
    summaryParts.push(buildBlockSentence(weakestBlock, "softest", 1));
  }

  return {
    headline: headlineForScore(evaluation.finalNumericScore, evaluation.finalScoreState),
    summary: summaryParts.join(" "),
    strengths,
    concerns,
    finalNumericScore: evaluation.finalNumericScore,
    finalScoreState: evaluation.finalScoreState,
  };
}
