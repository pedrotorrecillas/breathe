import type { JobRequirementCategory } from "@/domain/jobs/types";

export type RequirementSection = Extract<
  JobRequirementCategory,
  "essential" | "technical" | "interpersonal"
>;

export type SanitizedRequirementCandidate = {
  section: RequirementSection;
  label: string;
};

const recruiterCopyPrefixes = [
  /^we are looking for\b/i,
  /^we are hiring\b/i,
  /^our team is looking for\b/i,
  /^the ideal candidate\b/i,
  /^the successful candidate\b/i,
  /^candidate profile\b/i,
  /^about the role\b/i,
  /^role overview\b/i,
  /^job overview\b/i,
  /^responsibilities\b/i,
  /^key responsibilities\b/i,
  /^requirements\b/i,
  /^qualifications\b/i,
  /^skills\b/i,
  /^what you'll do\b/i,
  /^what you will do\b/i,
  /^relevant experience and expected outcomes\b/i,
];

const qualificationPatterns = [
  /\b\d+\+?\s+years?\b/i,
  /\byears? of experience\b/i,
  /\bexperience\b/i,
  /\bdegree\b/i,
  /\bdiploma\b/i,
  /\bcertif/i,
  /\blicen[cs]e\b/i,
  /\bpermit\b/i,
  /\bwork authorization\b/i,
  /\bright to work\b/i,
  /\blanguage\b/i,
  /\bfluenc/i,
];

const interpersonalPatterns = [
  /\bcollaborat/i,
  /\bcommunicat/i,
  /\bteamwork\b/i,
  /\bstakeholder\b/i,
  /\bleadership\b/i,
  /\balign/i,
  /\bmentor/i,
  /\bcoordinat/i,
  /\breliabil/i,
  /\badaptab/i,
  /\bproblem solving\b/i,
  /\battention to detail\b/i,
];

const technicalPatterns = [
  /\bproduct\b/i,
  /\broadmap\b/i,
  /\banalyt/i,
  /\bexperimentation\b/i,
  /\bmetrics?\b/i,
  /\bdata\b/i,
  /\btool\b/i,
  /\bsystem\b/i,
  /\bprocess\b/i,
  /\bworkflow\b/i,
  /\bpriorit/i,
  /\bdeliver/i,
  /\bmanage\b/i,
  /\bbuild\b/i,
  /\bdesign\b/i,
  /\bmonitor\b/i,
  /\binventory\b/i,
  /\bvisibility\b/i,
  /\binsights?\b/i,
];

const actionVerbRewrites: Array<[RegExp, string]> = [
  [/^prioritizing and delivering\b/i, "Prioritize and deliver"],
  [/^prioritizing\b/i, "Prioritize"],
  [/^delivering\b/i, "Deliver"],
  [/^collaborating\b/i, "Collaborate"],
  [/^communicating\b/i, "Communicate"],
  [/^managing\b/i, "Manage"],
  [/^supporting\b/i, "Support"],
  [/^leading\b/i, "Lead"],
  [/^driving\b/i, "Drive"],
  [/^building\b/i, "Build"],
  [/^working\b/i, "Work"],
  [/^owning\b/i, "Own"],
];

function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function stripDecorations(value: string) {
  return normalizeWhitespace(
    value
      .replace(/^[\s\-–•\d.)]+/, "")
      .replace(/["'“”‘’]+/g, "")
      .replace(/[.:;]+$/, ""),
  );
}

function isHeadingLike(value: string) {
  return (
    value.length < 12 ||
    /[:]\s*$/.test(value) ||
    /^(?:about the role|role overview|responsibilities|requirements|qualifications|skills|what you'll do|what you will do|candidate profile|job overview)$/i.test(
      value,
    )
  );
}

function isRecruiterCopy(value: string) {
  return recruiterCopyPrefixes.some((pattern) => pattern.test(value));
}

function isQualificationLike(value: string) {
  return qualificationPatterns.some((pattern) => pattern.test(value));
}

function isInterpersonalLike(value: string) {
  return interpersonalPatterns.some((pattern) => pattern.test(value));
}

function isTechnicalLike(value: string) {
  return technicalPatterns.some((pattern) => pattern.test(value));
}

function rewriteCollaborationPhrase(value: string) {
  const workCloselyMatch = value.match(
    /^(?:you(?:'|’)?ll|you will) work closely with\s+(.+)$/i,
  );

  if (workCloselyMatch?.[1]) {
    const target = workCloselyMatch[1]
      .split(/\bto\b/i)[0]
      .trim()
      .replace(/\s+and\s+/i, ", ")
      .replace(/\s+/g, " ");

    if (target) {
      return `Collaborate effectively with ${target}.`;
    }
  }

  if (/^collaboration will be essential$/i.test(value)) {
    return "Collaborate effectively with cross-functional stakeholders.";
  }

  return value;
}

function rewriteActionSentence(value: string) {
  for (const [pattern, replacement] of actionVerbRewrites) {
    if (pattern.test(value)) {
      return normalizeWhitespace(
        value.replace(pattern, replacement).replace(/[.:;]+$/, ""),
      );
    }
  }

  return value;
}

function finalize(value: string) {
  const trimmed = stripDecorations(value);

  if (!trimmed) {
    return null;
  }

  const sentence = trimmed.endsWith(".") ? trimmed : `${trimmed}.`;
  return sentence[0].toUpperCase() + sentence.slice(1);
}

export function sanitizeRequirementCandidate(input: {
  section: RequirementSection;
  label: string;
}): SanitizedRequirementCandidate | null {
  const baseText = stripDecorations(input.label);

  if (!baseText || isHeadingLike(baseText)) {
    return null;
  }

  if (isRecruiterCopy(baseText)) {
    if (
      /^you(?:'|’)?ll work closely with\b/i.test(baseText) ||
      /^you will work closely with\b/i.test(baseText) ||
      /^collaboration will be essential$/i.test(baseText)
    ) {
      const rewritten = finalize(rewriteCollaborationPhrase(baseText));

      if (!rewritten) {
        return null;
      }

      return {
        section: "interpersonal",
        label: rewritten,
      };
    }

    return null;
  }

  let section = input.section;
  let label = baseText;

  if (isQualificationLike(baseText)) {
    section = "essential";
  } else if (isInterpersonalLike(baseText)) {
    section = "interpersonal";
  } else if (isTechnicalLike(baseText)) {
    section = "technical";
  } else if (input.section === "essential") {
    return null;
  }

  label = rewriteCollaborationPhrase(label);
  label = rewriteActionSentence(label);

  const finalized = finalize(label);

  if (!finalized) {
    return null;
  }

  return {
    section,
    label: finalized,
  };
}

export function sanitizeInterviewPromptLabel(
  label: string,
  section: RequirementSection,
) {
  const sanitized = sanitizeRequirementCandidate({ label, section });
  return sanitized?.label ?? null;
}
