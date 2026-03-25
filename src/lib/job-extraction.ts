import {
  parseJobExtractionDraft,
  type JobConditionInput,
  type JobExtractionDraft,
  type JobRequirementInput,
  type RequirementImportance,
} from "@/domain/jobs/configuration";
import type { JobConditionCode } from "@/domain/jobs/types";

type ExtractionSuccess = {
  success: true;
  data: JobExtractionDraft;
  warnings: string[];
};

type ExtractionFailure = {
  success: false;
  error: string;
};

export type JobExtractionResult = ExtractionSuccess | ExtractionFailure;

type ConditionRule = {
  code: JobConditionCode;
  label: string;
  patterns: RegExp[];
};

const conditionRules: ConditionRule[] = [
  {
    code: "salary",
    label: "Salary",
    patterns: [/\b(?:€|eur|\$|salary|pay|gross|hourly)\b/i],
  },
  {
    code: "location",
    label: "Location",
    patterns: [
      /\b(?:location|based in|onsite|on-site|madrid|barcelona|valencia)\b/i,
    ],
  },
  {
    code: "schedule",
    label: "Schedule",
    patterns: [/\b(?:shift|schedule|weekend|night|day shift|hours)\b/i],
  },
  {
    code: "right_to_work",
    label: "Right to work",
    patterns: [/\b(?:right to work|work permit|eligible to work)\b/i],
  },
  {
    code: "driving_license",
    label: "Driving license",
    patterns: [
      /\b(?:driver'?s license|driving licence|driving license|license required)\b/i,
    ],
  },
  {
    code: "remote_policy",
    label: "Remote policy",
    patterns: [/\b(?:remote|hybrid|on-site|onsite)\b/i],
  },
  {
    code: "contract_type",
    label: "Contract type",
    patterns: [/\b(?:full-time|part-time|temporary|permanent|contract)\b/i],
  },
  {
    code: "visa_status",
    label: "Visa status",
    patterns: [/\b(?:visa|sponsorship)\b/i],
  },
];

const technicalKeywords = [
  "forklift",
  "scanner",
  "inventory",
  "excel",
  "crm",
  "salesforce",
  "warehouse",
  "cash register",
  "merchandising",
  "loading",
  "packing",
  "logistics",
  "machine",
  "assembly",
  "food safety",
];

const interpersonalKeywords = [
  "communication",
  "teamwork",
  "customer service",
  "problem solving",
  "adaptability",
  "attention to detail",
  "reliability",
  "leadership",
  "collaboration",
  "time management",
];

const essentialKeywords = [
  "experience",
  "must",
  "required",
  "ability to",
  "able to",
  "fluent",
  "english",
  "spanish",
  "availability",
  "physical",
];

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

function unique<T>(items: T[]) {
  return Array.from(new Set(items));
}

function splitDescription(description: string) {
  return unique(
    description
      .split(/\n|[.;]/)
      .map((part) => part.trim())
      .filter((part) => part.length > 0),
  );
}

function inferImportance(text: string): RequirementImportance {
  return /\b(?:must|required|need to|essential|minimum|at least)\b/i.test(text)
    ? "MANDATORY"
    : "OPTIONAL";
}

function toRequirement(idPrefix: string, label: string): JobRequirementInput {
  return {
    id: `${idPrefix}_${slugify(label)}`,
    label,
    importance: inferImportance(label),
  };
}

function pickMatchingSentences(sentences: string[], patterns: RegExp[]) {
  return sentences.filter((sentence) =>
    patterns.some((pattern) => pattern.test(sentence)),
  );
}

function buildConditions(sentences: string[]) {
  const conditions: JobConditionInput[] = [];

  for (const rule of conditionRules) {
    const matches = pickMatchingSentences(sentences, rule.patterns);

    if (matches.length === 0) {
      if (
        rule.code === "salary" ||
        rule.code === "location" ||
        rule.code === "schedule"
      ) {
        conditions.push({
          id: `cond_${rule.code}`,
          code: rule.code,
          label: rule.label,
          value: "",
          state: "missing",
          details: "No clear value was found in the source job description.",
        });
      }
      continue;
    }

    const value = matches[0] ?? "";
    const state = /\b(?:tbd|to be defined|depending|competitive)\b/i.test(value)
      ? "incomplete"
      : "complete";

    conditions.push({
      id: `cond_${rule.code}`,
      code: rule.code,
      label: rule.label,
      value,
      state,
      details:
        state === "incomplete"
          ? "The condition is referenced but not fully specified."
          : "",
    });
  }

  return conditions;
}

function collectKeywordDrivenItems(
  sentences: string[],
  keywords: string[],
  idPrefix: string,
) {
  const labels = unique(
    sentences.filter((sentence) =>
      keywords.some((keyword) => sentence.toLowerCase().includes(keyword)),
    ),
  );

  return labels.map((label) => toRequirement(idPrefix, label));
}

function collectEssentialRequirements(sentences: string[]) {
  const labels = unique(
    sentences.filter((sentence) =>
      essentialKeywords.some((keyword) =>
        sentence.toLowerCase().includes(keyword),
      ),
    ),
  );

  return labels.map((label) => toRequirement("essential", label));
}

function removeCrossSectionDuplicates(
  items: JobRequirementInput[],
  seen: Set<string>,
) {
  return items.filter((item) => {
    const key = item.label.toLowerCase();
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

export function extractJobConfiguration(input: {
  title: string;
  description: string;
}): JobExtractionResult {
  const description = input.description.trim();

  if (description.length < 40) {
    return {
      success: false,
      error:
        "Job description is too short to extract a reliable configuration draft.",
    };
  }

  const sentences = splitDescription(`${input.title}. ${description}`);
  const warnings: string[] = [];

  const conditions = buildConditions(sentences);

  const seenLabels = new Set<string>();
  const essentialRequirements = removeCrossSectionDuplicates(
    collectEssentialRequirements(sentences),
    seenLabels,
  );
  const technicalSkills = removeCrossSectionDuplicates(
    collectKeywordDrivenItems(sentences, technicalKeywords, "technical"),
    seenLabels,
  );
  const interpersonalSkills = removeCrossSectionDuplicates(
    collectKeywordDrivenItems(
      sentences,
      interpersonalKeywords,
      "interpersonal",
    ),
    seenLabels,
  );

  if (technicalSkills.length === 0) {
    warnings.push("No technical skills were extracted with enough confidence.");
  }
  if (interpersonalSkills.length === 0) {
    warnings.push(
      "No interpersonal skills were extracted with enough confidence.",
    );
  }

  const draft = {
    jobConditions: conditions,
    essentialRequirements,
    technicalSkills,
    interpersonalSkills,
  };

  const parsed = parseJobExtractionDraft(draft);

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.errors.join(" "),
    };
  }

  return {
    success: true,
    data: parsed.data,
    warnings,
  };
}
