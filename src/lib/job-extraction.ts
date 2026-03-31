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

type ExtractJobConfigurationInput = {
  title: string;
  description: string;
  language?: string;
};

type AnthropicTextBlock = {
  type: string;
  text?: string;
};

type AnthropicMessageResponse = {
  content?: AnthropicTextBlock[];
};

const DEFAULT_ANTHROPIC_MODEL =
  process.env.ANTHROPIC_MODEL ?? "claude-3-5-haiku-20241022";

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

function extractJsonObject(value: string) {
  const fenced = value.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced?.[1] ?? value;

  const startIndex = candidate.indexOf("{");
  const endIndex = candidate.lastIndexOf("}");

  if (startIndex === -1 || endIndex === -1 || endIndex <= startIndex) {
    throw new Error("Model response did not contain a JSON object.");
  }

  return candidate.slice(startIndex, endIndex + 1);
}

function buildAnthropicPrompt(input: ExtractJobConfigurationInput) {
  const languageInstruction =
    input.language === "es"
      ? "Write every human-readable label, value, and detail in Spanish."
      : "Write every human-readable label, value, and detail in English.";

  return `
You are a world-class Talent Acquisition Director and Subject Matter Expert across multiple global industries. Your goal is to generate exceptionally realistic, high-quality, and nuanced job profiles that will instantly impress hiring managers and HR executives.

Based on the provided input, fill out all fields of the output JSON schema. The input may be a short job title or a full job description. Your output will be used to power an advanced AI recruiter, so the requirements you define must be concrete, measurable, and highly professional.

TONE AND STYLE
- Language: Professional and engaging.
- Vocabulary: Use precise, industry-standard terminology.
- Format: Write every requirement as a complete, standalone, action-oriented sentence starting with a strong verb when possible.
- Never use a "Title: description" format.

ROLE-APPROPRIATE REALISM
- For white-collar roles: focus on strategy, experience, business impact, leadership, and advanced methodologies.
- For frontline or operational roles: prioritize clarity, safety, physical requirements, punctuality, and operational efficiency. Avoid corporate fluff.

DUAL-MODE HANDLING
- Short input: infer a realistic, complete hiring profile for this role.
- Long input: extract directly from the text, enhance weak phrasing, and infer missing critical fields from context.
- If skills are not explicit, infer them from the role.

REQUIREMENTS CLASSIFICATION
- importance must be exactly "MANDATORY" or "OPTIONAL".
- Each section must contain at least one MANDATORY item when the section is non-empty.
- essentialRequirements: eligibility and baseline fit only. Include years of experience, certifications, education, licenses, legal work permits, or language fluency.
- technicalSkills: hard skills, tools, software, methods, operational knowledge.
- interpersonalSkills: observable behavioural traits, written as observable actions.
- Do not duplicate the same concept across sections.

JOB CONDITIONS
- Use jobConditions for salary, location, schedule, right_to_work, driving_license, remote_policy, contract_type, visa_status when relevant.
- state must be one of "complete", "incomplete", or "missing".
- Use "missing" when the condition is not present but should exist as a recruiter-editable field, especially for salary, location, and schedule.
- Use code "other" only for a truly custom condition.

OUTPUT RULES
- Return JSON only. No prose, no markdown fences, no explanations.
- Use this exact schema:
{
  "jobConditions": [
    {
      "id": "cond_salary",
      "code": "salary",
      "label": "Salary",
      "value": "",
      "state": "missing",
      "details": ""
    }
  ],
  "essentialRequirements": [
    {
      "id": "essential_example",
      "label": "Have at least two years of warehouse experience in outbound operations.",
      "importance": "MANDATORY"
    }
  ],
  "technicalSkills": [
    {
      "id": "technical_example",
      "label": "Operate barcode scanners and inventory systems accurately during each shift.",
      "importance": "MANDATORY"
    }
  ],
  "interpersonalSkills": [
    {
      "id": "interpersonal_example",
      "label": "Communicate stock incidents clearly to teammates and shift leads before they affect operations.",
      "importance": "MANDATORY"
    }
  ]
}

ID RULES
- Use stable snake or slug style IDs.
- Prefix condition IDs with "cond_".
- Prefix essential requirement IDs with "essential_".
- Prefix technical skills with "technical_".
- Prefix interpersonal skills with "interpersonal_".

LOCALE
- ${languageInstruction}

INPUT
- job_title: ${JSON.stringify(input.title)}
- full_job_description: ${JSON.stringify(input.description)}
`.trim();
}

function buildHeuristicExtraction(
  input: ExtractJobConfigurationInput,
): JobExtractionResult {
  const description = input.description.trim();
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

async function extractWithAnthropic(
  input: ExtractJobConfigurationInput,
): Promise<JobExtractionResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();

  if (!apiKey) {
    const fallback = buildHeuristicExtraction(input);

    if (!fallback.success) {
      return fallback;
    }

    return {
      ...fallback,
      warnings: [
        "ANTHROPIC_API_KEY is missing, so the draft used the local fallback extractor.",
        ...fallback.warnings,
      ],
    };
  }

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: DEFAULT_ANTHROPIC_MODEL,
      max_tokens: 2200,
      temperature: 0.2,
      messages: [
        {
          role: "user",
          content: buildAnthropicPrompt(input),
        },
      ],
    }),
  });

  if (!response.ok) {
    const fallback = buildHeuristicExtraction(input);
    const reason = await response.text();

    if (!fallback.success) {
      return {
        success: false,
        error: `Claude extraction failed with status ${response.status}. ${reason}`,
      };
    }

    return {
      ...fallback,
      warnings: [
        `Claude extraction failed with status ${response.status}. Falling back to the local extractor.`,
        ...fallback.warnings,
      ],
    };
  }

  const payload = (await response.json()) as AnthropicMessageResponse;
  const text = payload.content
    ?.filter((block) => block.type === "text" && typeof block.text === "string")
    .map((block) => block.text?.trim() ?? "")
    .join("\n")
    .trim();

  if (!text) {
    return {
      success: false,
      error: "Claude returned an empty extraction response.",
    };
  }

  let jsonText: string;
  try {
    jsonText = extractJsonObject(text);
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Claude response could not be parsed as JSON.",
    };
  }

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(jsonText);
  } catch {
    return {
      success: false,
      error: "Claude returned invalid JSON for the extraction draft.",
    };
  }

  const parsedDraft = parseJobExtractionDraft(parsedJson);

  if (!parsedDraft.success) {
    return {
      success: false,
      error: parsedDraft.errors.join(" "),
    };
  }

  return {
    success: true,
    data: parsedDraft.data,
    warnings: [],
  };
}

export async function extractJobConfiguration(
  input: ExtractJobConfigurationInput,
): Promise<JobExtractionResult> {
  const description = input.description.trim();

  if (description.length < 40) {
    return {
      success: false,
      error:
        "Job description is too short to extract a reliable configuration draft.",
    };
  }

  return extractWithAnthropic(input);
}
