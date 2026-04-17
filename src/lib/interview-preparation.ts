import type {
  InterviewPreparationPackage,
  InterviewQuestion,
  InterviewQuestionKind,
  QuestionConfidenceBand,
  QuestionConfidenceLevel,
} from "@/domain/interview-preparation/types";
import type { Job } from "@/domain/jobs/types";
import type { SupportedLanguage } from "@/domain/shared/types";
import { sanitizeInterviewPromptLabel } from "@/lib/job-requirement-cleanup";

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

function toLanguageName(language: SupportedLanguage) {
  return language === "es" ? "Spanish" : "English";
}

function toLanguageNameInBaseLanguage(
  language: SupportedLanguage,
  baseLanguage: SupportedLanguage,
) {
  if (baseLanguage === "es") {
    return language === "es" ? "español" : "inglés";
  }

  return language === "es" ? "Spanish" : "English";
}

function normalizeText(value: string) {
  return value.trim().toLowerCase();
}

function detectLanguageRequirement(
  requirement: Job["requirements"][number],
): { lang: SupportedLanguage; certificate: string | null } | null {
  const text = normalizeText(
    [requirement.label, requirement.description, requirement.code ?? ""].join(" "),
  );

  if (
    text.includes("language") ||
    text.includes("english") ||
    text.includes("inglés") ||
    text.includes("español") ||
    text.includes("spanish")
  ) {
    const lang: SupportedLanguage =
      text.includes("spanish") || text.includes("español") ? "es" : "en";

    const certificateMatch =
      requirement.description.match(
        /\b(certification|certificate|certified)\b(?:\s*(?:in|for))?\s*([A-Za-z0-9+ -]{2,40})/i,
      ) ?? requirement.label.match(
        /\b(certification|certificate|certified)\b(?:\s*(?:in|for))?\s*([A-Za-z0-9+ -]{2,40})/i,
      );

    return {
      lang,
      certificate: certificateMatch?.[2]?.trim() || null,
    };
  }

  return null;
}

function buildQuestionPrompt(requirement: Job["requirements"][number]) {
  if (requirement.category === "condition") {
    return `Before we continue, could you confirm how ${requirement.label.toLowerCase()} works for you?`;
  }

  const safeLabel = sanitizeInterviewPromptLabel(
    requirement.label,
    requirement.category,
  );

  if (!safeLabel) {
    return "Could you tell me more about your experience in this area?";
  }

  if (
    /^(?:Collaborate|Prioritize|Deliver|Manage|Lead|Build|Work|Own|Communicate|Support|Drive|Have|Demonstrate|Use|Operate|Coordinate|Monitor|Design|Analyze|Align)\b/i.test(
      safeLabel,
    )
  ) {
    return "Could you tell me about a recent example that demonstrates this requirement?";
  }

  return `Could you walk me through your experience with ${safeLabel.toLowerCase()}?`;
}

function buildLanguageQuestionPrompt(input: {
  requirement: Job["requirements"][number];
  interviewLanguage: SupportedLanguage;
  requiredLanguage: SupportedLanguage;
}) {
  const intro =
    input.interviewLanguage === "es"
      ? `Para la siguiente pregunta, vamos a cambiar a ${toLanguageNameInBaseLanguage(input.requiredLanguage, "es")}, ¿te parece bien? (espera la respuesta del candidato)`
      : `For the next question, we are going to change to ${toLanguageName(input.requiredLanguage)}, is it ok for you? (wait for the candidate's response)`;

  const question =
    input.interviewLanguage === "es"
      ? `Por favor, responde en ${toLanguageNameInBaseLanguage(input.requiredLanguage, "es")} y cuéntame sobre una situación laboral reciente en la que hayas usado ${toLanguageNameInBaseLanguage(input.requiredLanguage, "es")}.`
      : `Please answer in ${toLanguageName(input.requiredLanguage)} and tell me about a recent work situation where you used ${toLanguageName(input.requiredLanguage)}.`;

  return `${intro} ${question}`;
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

function buildLanguageQuestionRubric(input: {
  requirement: Job["requirements"][number];
  requiredLanguage: SupportedLanguage;
}) {
  return `Assess whether the candidate can communicate in ${toLanguageName(input.requiredLanguage)} for ${input.requirement.label.toLowerCase()}. Reward functional communication over perfect grammar when the role only needs basic or intermediate proficiency.`;
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

function buildLanguageConfidenceLevels(input: {
  requirement: Job["requirements"][number];
  requiredLanguage: SupportedLanguage;
}): QuestionConfidenceLevel[] {
  return confidenceLevelBaselines.map((baseline) => ({
    band: baseline.band,
    level: baseline.level,
    description: buildLanguageQuestionLevelDescription({
      ...input,
      summary: baseline.summary,
    }),
  }));
}

function buildLanguageQuestionLevelDescription(input: {
  summary: string;
  requirement: Job["requirements"][number];
  requiredLanguage: SupportedLanguage;
}) {
  const proficiencyHint = normalizeText(
    `${input.requirement.label} ${input.requirement.description}`,
  );

  let calibrationText = "Reward functional communication, clear meaning, and enough fluency to do the job.";

  if (
    proficiencyHint.includes("basic") ||
    proficiencyHint.includes("low") ||
    proficiencyHint.includes("a1") ||
    proficiencyHint.includes("a2")
  ) {
    calibrationText =
      "For basic proficiency, reward simple everyday communication and the ability to get the point across despite errors.";
  } else if (
    proficiencyHint.includes("intermediate") ||
    proficiencyHint.includes("medium") ||
    proficiencyHint.includes("b1") ||
    proficiencyHint.includes("b2")
  ) {
    calibrationText =
      "For intermediate proficiency, reward practical workplace communication with some errors allowed if the meaning stays clear.";
  } else if (
    proficiencyHint.includes("advanced") ||
    proficiencyHint.includes("fluent") ||
    proficiencyHint.includes("native") ||
    proficiencyHint.includes("c1") ||
    proficiencyHint.includes("c2")
  ) {
    calibrationText =
      "For advanced proficiency, reward nuanced and accurate communication, including role-specific detail and natural flow.";
  }

  return `${input.summary} ${calibrationText} Evaluate how well the candidate uses ${toLanguageName(input.requiredLanguage)} for "${input.requirement.label}".`;
}

function buildQuestionMetadata(
  requirement: Job["requirements"][number],
) {
  const languageRequirement = detectLanguageRequirement(requirement);

  if (!languageRequirement) {
    return null;
  }

  return JSON.stringify({
    lang: languageRequirement.lang,
    ...(languageRequirement.certificate
      ? { certificate: languageRequirement.certificate }
      : {}),
  });
}

export function generateInterviewQuestions(job: Job): InterviewQuestion[] {
  return job.requirements.map((requirement) => {
    const languageRequirement = detectLanguageRequirement(requirement);

    if (languageRequirement) {
      return {
        id: `question_${requirement.id}`,
        requirementId: requirement.id,
        kind: "language_check",
        type: "language",
        prompt: buildLanguageQuestionPrompt({
          requirement,
          interviewLanguage: job.interviewLanguage,
          requiredLanguage: languageRequirement.lang,
        }),
        metadata: buildQuestionMetadata(requirement),
        rubric: buildLanguageQuestionRubric({
          requirement,
          requiredLanguage: languageRequirement.lang,
        }),
        confidenceLevels: buildLanguageConfidenceLevels({
          requirement,
          requiredLanguage: languageRequirement.lang,
        }),
      } satisfies InterviewQuestion;
    }

    return {
      id: `question_${requirement.id}`,
      requirementId: requirement.id,
      kind: toQuestionKind(requirement),
      type: requirement.category === "condition" ? "killer" : "standard",
      prompt: buildQuestionPrompt(requirement),
      metadata: buildQuestionMetadata(requirement),
      rubric: buildQuestionRubric(requirement),
      confidenceLevels: buildConfidenceLevels(requirement),
    } satisfies InterviewQuestion;
  });
}

export function createInterviewPreparationPackage(input: {
  job: Job;
  candidateId: string;
  now?: Date;
}): InterviewPreparationPackage {
  const createdAt = (input.now ?? new Date()).toISOString();
  const createdAtKey = createdAt.replace(/[^0-9]/g, "");

  return {
    id: `prep_${input.job.id}_${input.candidateId}_${createdAtKey}`,
    jobId: input.job.id,
    candidateId: input.candidateId,
    language: input.job.interviewLanguage,
    createdAt,
    requirements: input.job.requirements.map((requirement) => ({
      ...requirement,
    })),
    questions: generateInterviewQuestions(input.job),
  };
}
