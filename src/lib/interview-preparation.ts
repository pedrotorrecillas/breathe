import type {
  InterviewPreparationPackage,
  InterviewQuestion,
  InterviewQuestionKind,
  QuestionConfidenceBand,
  QuestionConfidenceLevel,
} from "@/domain/interview-preparation/types";
import type { Job } from "@/domain/jobs/types";

const confidenceLevelBaselines: Array<{
  band: QuestionConfidenceBand;
  level: string;
  summary: string;
}> = [
  {
    band: "excellent",
    level: "90-100",
    summary:
      "The response is not only appropriate but also adds significant value through clear, relevant, and well-supported evidence.",
  },
  {
    band: "very_good",
    level: "75-89",
    summary:
      "The response is solid, well-structured, and shows good understanding with relevant experience or examples.",
  },
  {
    band: "good",
    level: "60-74",
    summary:
      "The response covers most key points but could be more complete, specific, or detailed.",
  },
  {
    band: "adequate",
    level: "50-59",
    summary:
      "The response is basic but acceptable, with some valid points and limited depth.",
  },
  {
    band: "poor",
    level: "30-49",
    summary:
      "The response is partial, unclear, or shows limited understanding, with notable gaps or weak evidence.",
  },
  {
    band: "inadequate",
    level: "1-29",
    summary:
      "The response is not appropriate for the question and shows no clear understanding or relevant experience.",
  },
];

function toQuestionKind(
  requirement: Job["requirements"][number],
): InterviewQuestionKind {
  switch (requirement.category) {
    case "condition":
      return "condition_check";
    case "technical":
      return "experience_probe";
    case "interpersonal":
      return "soft_skill_probe";
    case "essential":
    default:
      return "requirement_probe";
  }
}

function buildQuestionPrompt(requirement: Job["requirements"][number]) {
  if (requirement.category === "condition") {
    return `Before we continue, could you confirm how ${requirement.label.toLowerCase()} works for you?`;
  }

  return `Could you walk me through your experience with ${requirement.label.toLowerCase()}?`;
}

function buildQuestionRubric(requirement: Job["requirements"][number]) {
  if (requirement.category === "condition") {
    return requirement.isKnockout
      ? "Confirm the candidate clearly meets this job condition. If the answer is vague, ask one short clarification before continuing."
      : "Confirm whether this operating condition works for the candidate and capture any relevant constraints.";
  }

  return requirement.weight >= 3
    ? "Collect concrete evidence, examples, and depth of experience. A higher confidence score requires specific and relevant examples."
    : "Collect clear evidence of experience and fit. Use the answer to judge relevance, consistency, and strength.";
}

function buildConfidenceLevels(
  requirement: Job["requirements"][number],
): QuestionConfidenceLevel[] {
  return confidenceLevelBaselines.map((baseline) => ({
    band: baseline.band,
    level: baseline.level,
    description:
      requirement.category === "condition"
        ? `${baseline.summary} Evaluate whether the candidate clearly satisfies the condition "${requirement.label}".`
        : `${baseline.summary} Evaluate how strongly the answer demonstrates evidence for "${requirement.label}".`,
  }));
}

export function generateInterviewQuestions(job: Job): InterviewQuestion[] {
  return job.requirements.map((requirement) => ({
    id: `question_${requirement.id}`,
    requirementId: requirement.id,
    kind: toQuestionKind(requirement),
    type: requirement.category === "condition" ? "killer" : "standard",
    prompt: buildQuestionPrompt(requirement),
    metadata: null,
    rubric: buildQuestionRubric(requirement),
    confidenceLevels: buildConfidenceLevels(requirement),
  }));
}

export function createInterviewPreparationPackage(input: {
  job: Job;
  candidateId: string;
  now?: Date;
}): InterviewPreparationPackage {
  const createdAt = (input.now ?? new Date()).toISOString();

  return {
    id: `prep_${input.job.id}_${input.candidateId}`,
    jobId: input.job.id,
    candidateId: input.candidateId,
    language: input.job.interviewLanguage,
    createdAt,
    questions: generateInterviewQuestions(input.job),
  };
}
