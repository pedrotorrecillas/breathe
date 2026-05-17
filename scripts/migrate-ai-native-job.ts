import fs from "node:fs";
import path from "node:path";

import type {
  CandidateApplication,
  CandidatePipelineStage,
  CandidateProfile,
  CandidateSource,
} from "@/domain/candidates/types";
import type {
  CandidateEvaluation,
  EvaluationBlockResult,
  EvaluationRequirementImportance,
  EvaluationRequirementResult,
  EvaluationScoreState,
  EvaluationWeightConfig,
} from "@/domain/evaluations/types";
import type { InterviewRun } from "@/domain/interviews/types";
import type { JobRequirement } from "@/domain/jobs/types";
import type { SeededPublicJobRecord } from "@/lib/job-seeds";
import {
  loadRuntimeStoreState,
  saveRuntimeStoreState,
} from "@/lib/db/runtime-store";
import { mapNumericScoreToState } from "@/lib/evaluation-scoring";

type CsvRow = Record<string, string>;

const csvPathDefault = path.join(
  process.env.HOME ?? "",
  "Downloads",
  "candidates-export-6d83782f-02e6-4912-ac91-1eca392bfbca.csv",
);

const companyId = "company_seed_demo";
const jobId = "job_ai_native_software_engineer";
const recruiterSlug = "ai-native-software-engineer";
const publicApplyPath = "/apply/ai-native-software-engineer";

const weightConfig: EvaluationWeightConfig = {
  mandatoryRequirementWeight: 0.8,
  optionalRequirementWeight: 0.2,
  essentialBlockWeight: 0.45,
  technicalBlockWeight: 0.45,
  interpersonalBlockWeight: 0.1,
};

const jobRequirements: JobRequirement[] = [
  {
    id: "cond_salary_private",
    code: "salary",
    label: "Compensation",
    description: "Private compensation package discussed later in process.",
    category: "condition",
    weight: 1,
    isKnockout: true,
  },
  {
    id: "cond_location_remote",
    code: "location",
    label: "Location",
    description: "Remote role with travel availability to Madrid when needed.",
    category: "condition",
    weight: 1,
    isKnockout: true,
  },
  {
    id: "cond_schedule_intense",
    code: "schedule",
    label: "Pace",
    description: "Flexible but intense operating rhythm.",
    category: "condition",
    weight: 1,
    isKnockout: true,
  },
  {
    id: "cond_remote_policy_madrid",
    code: "remote_policy",
    label: "Remote policy",
    description:
      "Remote, with availability to travel to Madrid once every one or two months for in-person sessions.",
    category: "condition",
    weight: 1,
    isKnockout: true,
  },
  {
    id: "cond_contract_type_permanent",
    code: "contract_type",
    label: "Contract type",
    description: "Permanent contract.",
    category: "condition",
    weight: 1,
    isKnockout: true,
  },
  {
    id: "cond_visa_europe",
    code: "visa_status",
    label: "Work authorization",
    description: "Candidate must be eligible to work in Europe.",
    category: "condition",
    weight: 1,
    isKnockout: true,
  },
  {
    id: "req_sw_fundamentals",
    code: null,
    label: "Strong software engineering fundamentals",
    description: "Strong software engineering fundamentals",
    category: "essential",
    weight: 3,
    isKnockout: false,
  },
  {
    id: "req_ai_workflows",
    code: null,
    label:
      "Deep practical experience working with AI coding tools or AI agents in real development workflows",
    description:
      "Deep practical experience working with AI coding tools or AI agents in real development workflows",
    category: "essential",
    weight: 3,
    isKnockout: false,
  },
  {
    id: "req_core_product_systems",
    code: null,
    label:
      "Build core product systems across application logic, workflows, integrations, and internal tooling",
    description:
      "Build core product systems across application logic, workflows, integrations, and internal tooling",
    category: "technical",
    weight: 3,
    isKnockout: false,
  },
  {
    id: "req_daily_ai_agents",
    code: null,
    label: "Use AI agents intensively as part of day-to-day engineering work",
    description:
      "Use AI agents intensively as part of day-to-day engineering work",
    category: "technical",
    weight: 3,
    isKnockout: false,
  },
  {
    id: "req_problem_breakdown",
    code: null,
    label:
      "Break down ambiguous product and technical problems into executable workflows for both humans and AI systems",
    description:
      "Break down ambiguous product and technical problems into executable workflows for both humans and AI systems",
    category: "technical",
    weight: 2,
    isKnockout: false,
  },
  {
    id: "req_execution_speed",
    code: null,
    label:
      "Move quickly from idea to working production behavior while maintaining sound technical judgment",
    description:
      "Move quickly from idea to working production behavior while maintaining sound technical judgment",
    category: "technical",
    weight: 3,
    isKnockout: false,
  },
  {
    id: "req_jvm_kotlin",
    code: null,
    label: "Experience reading or working with JVM/Kotlin backends",
    description: "Experience reading or working with JVM/Kotlin backends",
    category: "technical",
    weight: 2,
    isKnockout: false,
  },
  {
    id: "req_system_comprehension",
    code: null,
    label: "Strong system comprehension and ability to work through ambiguity",
    description:
      "Strong system comprehension and ability to work through ambiguity",
    category: "interpersonal",
    weight: 2,
    isKnockout: false,
  },
  {
    id: "req_ownership_stack",
    code: null,
    label: "High ownership and comfort working across the stack",
    description: "High ownership and comfort working across the stack",
    category: "interpersonal",
    weight: 3,
    isKnockout: false,
  },
  {
    id: "req_product_instincts",
    code: null,
    label: "Good product instincts and strong execution speed",
    description: "Good product instincts and strong execution speed",
    category: "interpersonal",
    weight: 3,
    isKnockout: false,
  },
];

const jobDescription = `AI-native Software Engineer

We’re building Breathe: an AI-native recruiting product where software, voice interviews, evaluation systems, automations, and agent workflows come together into one operating system for hiring.

We’re looking for an AI-native software engineer to help us build the product itself. This is not a traditional software role. We need someone who is genuinely fluent working with AI coding tools and agents as part of day-to-day engineering, and who can use them to move quickly from idea to production-quality behavior.

You’ll work across the real surfaces that make Breathe work: application logic, workflow orchestration, integrations, internal tooling, evaluation systems, and recruiter-facing product experiences. The ideal person is strong in fundamentals, comfortable navigating ambiguity, and able to turn messy product or technical problems into clear execution plans for both humans and AI systems.

This role is especially strong for someone who enjoys building with high ownership, working across the stack, and using AI not just as an assistant but as a real part of how they design, implement, and ship software.

What we’re looking for:
- Strong software engineering fundamentals
- Deep practical experience working with AI coding tools or AI agents in real development workflows
- Ability to build core product systems across application logic, workflows, integrations, and internal tooling
- Intensive day-to-day use of AI agents as part of engineering work
- Ability to break down ambiguous product and technical problems into executable workflows for both humans and AI systems
- Strong execution speed with sound technical judgment
- Comfort reading or working with JVM/Kotlin backends
- Strong system comprehension and ability to work through ambiguity
- High ownership and comfort working across the stack
- Good product instincts and strong execution speed

Role details:
- Interview language: English
- Location: Remote
- Travel: Availability to travel to Madrid once every 1-2 months for in-person sessions
- Contract type: Permanent
- Work authorization: Must be eligible to work in Europe
- Compensation: Private
- Pace: Flexible but intense`;

function loadDotEnvLocal() {
  const envPath = path.join(process.cwd(), ".env.local");

  if (!fs.existsSync(envPath)) {
    return;
  }

  const content = fs.readFileSync(envPath, "utf8");
  for (const line of content.split(/\r?\n/)) {
    if (!line || line.trimStart().startsWith("#")) {
      continue;
    }

    const separatorIndex = line.indexOf("=");
    if (separatorIndex <= 0) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    const rawValue = line.slice(separatorIndex + 1).trim();

    if (!key || process.env[key]) {
      continue;
    }

    const unquoted =
      (rawValue.startsWith('"') && rawValue.endsWith('"')) ||
      (rawValue.startsWith("'") && rawValue.endsWith("'"))
        ? rawValue.slice(1, -1)
        : rawValue;

    process.env[key] = unquoted;
  }
}

function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function normalizeEmail(email: string | undefined) {
  const normalized = normalizeWhitespace(email ?? "").toLowerCase();
  return normalized || null;
}

function normalizePhone(phone: string | undefined) {
  const trimmed = normalizeWhitespace(phone ?? "");
  if (!trimmed) {
    return "";
  }

  const prefix = trimmed.startsWith("+") ? "+" : "";
  const digits = trimmed.replace(/\D+/g, "");
  return `${prefix}${digits}`;
}

function slugify(value: string) {
  return normalizeWhitespace(value)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function parseCsv(content: string): CsvRow[] {
  const rows: string[][] = [];
  let current = "";
  let row: string[] = [];
  let insideQuotes = false;

  for (let index = 0; index < content.length; index += 1) {
    const char = content[index];
    const next = content[index + 1];

    if (char === '"') {
      if (insideQuotes && next === '"') {
        current += '"';
        index += 1;
      } else {
        insideQuotes = !insideQuotes;
      }
      continue;
    }

    if (char === "," && !insideQuotes) {
      row.push(current);
      current = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !insideQuotes) {
      if (char === "\r" && next === "\n") {
        index += 1;
      }

      row.push(current);
      current = "";
      rows.push(row);
      row = [];
      continue;
    }

    current += char;
  }

  if (current.length > 0 || row.length > 0) {
    row.push(current);
    rows.push(row);
  }

  const [header = [], ...dataRows] = rows;
  return dataRows
    .filter((dataRow) =>
      dataRow.some((value) => normalizeWhitespace(value).length > 0),
    )
    .map((dataRow) => {
      const record: CsvRow = {};
      header.forEach((key, index) => {
        record[key] = dataRow[index] ?? "";
      });
      return record;
    });
}

function parseMadridDateTime(value: string | undefined, fallbackIso: string) {
  const trimmed = normalizeWhitespace(value ?? "");
  if (!trimmed) {
    return fallbackIso;
  }

  const match = trimmed.match(
    /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?)?$/,
  );

  if (!match) {
    return fallbackIso;
  }

  const [, year, month, day, hour = "12", minute = "00", second = "00"] = match;
  return `${year}-${month}-${day}T${hour}:${minute}:${second}+02:00`;
}

function hasLegacyReport(row: CsvRow) {
  return Boolean(
    normalizeWhitespace(row["puntuación general"]) ||
    normalizeWhitespace(row["resumen"]),
  );
}

function stageFromLegacyStatus(
  status: string,
  options: { hasReport: boolean },
): CandidatePipelineStage {
  switch (normalizeWhitespace(status)) {
    case "SHORTLISTED":
      return "shortlisted";
    case "DECLINED":
    case "CV_DECLINED":
    case "ACTION_REQUIRED":
      return "rejected";
    case "REVIEW_PENDING":
      return options.hasReport ? "interviewed" : "applicant";
    default:
      return options.hasReport ? "interviewed" : "applicant";
  }
}

function candidateSourceFromLegacySource(source: string): CandidateSource {
  const normalized = normalizeWhitespace(source).toLowerCase();

  if (normalized === "clara_works_link") {
    return "public_apply_link";
  }

  return "ats";
}

function buildJob(
  pipeline: SeededPublicJobRecord["pipeline"],
): SeededPublicJobRecord {
  const createdAt = new Date().toISOString();

  return {
    id: jobId,
    companyId,
    recruiterSlug,
    title: "AI-native Software Engineer",
    summary:
      "Build Breathe itself across product systems, agent workflows, and AI-native engineering surfaces.",
    description: jobDescription,
    location: "Remote",
    salary: "Private",
    schedule: "Flexible but intense",
    status: "active",
    interviewLanguage: "en",
    createdAt,
    publishedAt: createdAt,
    expiresAt: null,
    publicApplyPath,
    pipeline,
    requirements: jobRequirements,
    interviewLimits: {
      maxInterviews: null,
      outstandingCap: null,
      greatCap: null,
    },
  };
}

function requirementIndex() {
  return new Map(
    jobRequirements
      .filter((requirement) => requirement.category !== "condition")
      .map((requirement) => [
        normalizeWhitespace(requirement.label).toLowerCase(),
        requirement,
      ]),
  );
}

function importanceFor(
  requirement: JobRequirement,
): EvaluationRequirementImportance {
  return requirement.weight >= 3 ? "MANDATORY" : "OPTIONAL";
}

function blockLabel(category: EvaluationBlockResult["category"]) {
  switch (category) {
    case "essential":
      return "Essential requirements";
    case "technical":
      return "Technical skills";
    case "interpersonal":
      return "Interpersonal skills";
  }
}

function averageScore(results: EvaluationRequirementResult[]) {
  if (results.length === 0) {
    return null;
  }

  const total = results.reduce(
    (sum, item) => sum + (item.numericScore ?? 0),
    0,
  );
  return Math.round(total / results.length);
}

function buildRequirementResult(
  requirement: JobRequirement,
  numericScore: number | null,
  explanation: string,
): EvaluationRequirementResult {
  const scoreState = mapNumericScoreToState(numericScore);

  return {
    requirementId: requirement.id,
    label: requirement.label,
    importance: importanceFor(requirement),
    numericScore,
    scoreState,
    explanation:
      explanation || `Legacy report imported for ${requirement.label}.`,
    evidence: null,
  };
}

function createEvaluation(
  interviewRunId: string,
  generatedAt: string,
  row: CsvRow,
  requirementByLabel: Map<string, JobRequirement>,
): CandidateEvaluation | null {
  const overallScoreText = normalizeWhitespace(row["puntuación general"]);
  const summary = normalizeWhitespace(row["resumen"]);

  if (!overallScoreText && !summary) {
    return null;
  }

  const essentialFields = [
    ["essential_req_1_name", "essential_req_1_score", "essential_req_1_answer"],
    ["essential_req_2_name", "essential_req_2_score", "essential_req_2_answer"],
  ] as const;

  const technicalFields = [
    ["skill_1_name", "skill_1_score", "skill_1_answer"],
    ["skill_2_name", "skill_2_score", "skill_2_answer"],
    ["skill_3_name", "skill_3_score", "skill_3_answer"],
    ["skill_4_name", "skill_4_score", "skill_4_answer"],
    ["skill_5_name", "skill_5_score", "skill_5_answer"],
  ] as const;

  const interpersonalFields = [
    ["soft_skill_1_name", "soft_skill_1_score", "soft_skill_1_answer"],
    ["soft_skill_2_name", "soft_skill_2_score", "soft_skill_2_answer"],
    ["soft_skill_3_name", "soft_skill_3_score", "soft_skill_3_answer"],
  ] as const;

  const buildBlock = (
    category: EvaluationBlockResult["category"],
    fields: readonly (readonly [string, string, string])[],
  ): EvaluationBlockResult => {
    const requirements = fields.flatMap(
      ([nameField, scoreField, answerField]) => {
        const label = normalizeWhitespace(row[nameField]);
        if (!label) {
          return [];
        }

        const requirement = requirementByLabel.get(label.toLowerCase());
        if (!requirement) {
          return [];
        }

        const numericScoreText = normalizeWhitespace(row[scoreField]);
        const numericScore = numericScoreText
          ? Number.parseInt(numericScoreText, 10)
          : null;

        return [
          buildRequirementResult(
            requirement,
            Number.isFinite(numericScore) ? numericScore : null,
            normalizeWhitespace(row[answerField]),
          ),
        ];
      },
    );

    const numericScore = averageScore(requirements);
    const scoreState: EvaluationScoreState =
      mapNumericScoreToState(numericScore);

    return {
      category,
      label: blockLabel(category),
      numericScore,
      scoreState,
      requirements,
    };
  };

  const blocks = [
    buildBlock("essential", essentialFields),
    buildBlock("technical", technicalFields),
    buildBlock("interpersonal", interpersonalFields),
  ];

  const finalNumericScore = overallScoreText
    ? Number.parseInt(overallScoreText, 10)
    : averageScore(blocks.flatMap((block) => block.requirements));

  const resolvedFinalNumericScore = Number.isFinite(finalNumericScore)
    ? finalNumericScore
    : null;

  return {
    id: `eval_${interviewRunId}`,
    companyId,
    interviewRunId,
    generatedAt,
    finalNumericScore: resolvedFinalNumericScore,
    finalScoreState: mapNumericScoreToState(resolvedFinalNumericScore),
    blocks,
    weightConfigSnapshot: weightConfig,
    fitClassification:
      resolvedFinalNumericScore === null
        ? null
        : resolvedFinalNumericScore >= 80
          ? "strong_fit"
          : resolvedFinalNumericScore >= 60
            ? "viable_fit"
            : "weak_fit",
  };
}

function buildImportedData(rows: CsvRow[]) {
  const requirementByLabel = requirementIndex();
  const candidates: CandidateProfile[] = [];
  const applications: CandidateApplication[] = [];
  const interviewRuns: InterviewRun[] = [];
  const evaluations: CandidateEvaluation[] = [];

  const pipeline = {
    applicants: 0,
    interviewed: 0,
    shortlisted: 0,
    hired: 0,
    rejected: 0,
  };

  for (const row of rows) {
    const sourceId = normalizeWhitespace(row["ID candidato"]);
    const fullName = normalizeWhitespace(
      `${row["nombre"] ?? ""} ${row["apellidos"] ?? ""}`,
    );
    const hasReport = hasLegacyReport(row);
    const submittedAt = parseMadridDateTime(
      normalizeWhitespace(row["solicitud"]),
      new Date().toISOString(),
    );
    const stage = stageFromLegacyStatus(row["estado"] ?? "", { hasReport });
    const source = candidateSourceFromLegacySource(row["fuente"] ?? "");
    const candidateId = `cand_import_${sourceId || slugify(fullName)}`;
    const applicationId = `app_import_${sourceId || slugify(fullName)}`;

    if (!fullName) {
      continue;
    }

    candidates.push({
      id: candidateId,
      companyId,
      fullName,
      phone: normalizeWhitespace(row["móvil"]),
      normalizedPhone: normalizePhone(row["móvil"]),
      email: normalizeEmail(row["email"]),
      normalizedEmail: normalizeEmail(row["email"]),
      linkedinUrl: null,
      cvAssetRef: null,
      locale: "en",
      source,
      consentAcceptedAt: null,
    });

    applications.push({
      id: applicationId,
      companyId,
      candidateId,
      jobId,
      source,
      stage,
      submittedAt,
      needsHumanReviewAt: null,
      legalAcceptance: null,
    });

    if (stage === "applicant") pipeline.applicants += 1;
    if (stage === "interviewed") pipeline.interviewed += 1;
    if (stage === "shortlisted") pipeline.shortlisted += 1;
    if (stage === "hired") pipeline.hired += 1;
    if (stage === "rejected") pipeline.rejected += 1;

    const interviewDate = parseMadridDateTime(
      row["fecha entrevista"],
      submittedAt,
    );
    const evaluation = createEvaluation(
      `run_import_${sourceId || slugify(fullName)}`,
      interviewDate,
      row,
      requirementByLabel,
    );

    if (!evaluation) {
      continue;
    }

    const failureReason =
      stage === "rejected"
        ? normalizeWhitespace(row["motivo de descarte"]) ||
          "Rejected in legacy system"
        : null;

    interviewRuns.push({
      id: evaluation.interviewRunId,
      companyId,
      candidateId,
      applicationId,
      jobId,
      interviewPreparationId: null,
      provider: "happyrobot",
      status: "completed",
      pipelineStage:
        stage === "shortlisted"
          ? "shortlisted"
          : stage === "hired"
            ? "hired"
            : stage === "rejected"
              ? "rejected"
              : "interviewed",
      dispatch: {
        dispatchedAt: interviewDate,
        providerCallId: null,
        providerAgentId: null,
        providerSessionId: null,
        outboundNumber: null,
      },
      metadata: {
        selectedLanguage: "en",
        candidateTimezone: {
          timezone: "Europe/Madrid",
          localDateTime: interviewDate,
          utcDateTime: interviewDate,
        },
        disclosedWithAi: true,
        disclosureText: "Imported legacy interview report.",
        callbackRequestedAt: null,
        failureReason,
        providerOutcomeLabel: "legacy_import",
      },
      trace: {
        createdAt: submittedAt,
        normalizedAt: interviewDate,
        initiatedAt: interviewDate,
        completedAt: interviewDate,
        lastEventAt: interviewDate,
      },
      artifacts: {
        recordingUrl: null,
        transcriptUrl: null,
        transcriptAssetRef: null,
        providerPayloadSnapshotRef: null,
        recordingDurationSeconds: null,
      },
    });

    evaluations.push(evaluation);
  }

  return {
    candidates,
    applications,
    interviewRuns,
    evaluations,
    job: buildJob(pipeline),
  };
}

async function main() {
  loadDotEnvLocal();

  const dryRun = process.argv.includes("--dry-run");
  const csvPathArg = process.argv.find((argument) =>
    argument.startsWith("--csv="),
  );
  const csvPath = csvPathArg
    ? csvPathArg.slice("--csv=".length)
    : csvPathDefault;

  if (!fs.existsSync(csvPath)) {
    throw new Error(`CSV not found at ${csvPath}`);
  }

  const csvContent = fs.readFileSync(csvPath, "utf8");
  const imported = buildImportedData(parseCsv(csvContent));
  const state = await loadRuntimeStoreState();

  const importedCandidateIds = new Set(
    imported.candidates.map((candidate) => candidate.id),
  );
  const importedApplicationIds = new Set(
    imported.applications.map((application) => application.id),
  );
  const importedInterviewRunIds = new Set(
    imported.interviewRuns.map((interviewRun) => interviewRun.id),
  );

  const nextState = {
    ...state,
    jobs: [
      ...state.jobs.filter(
        (job) => job.id !== jobId && job.recruiterSlug !== recruiterSlug,
      ),
      imported.job,
    ],
    candidates: [
      ...state.candidates.filter(
        (candidate) => !importedCandidateIds.has(candidate.id),
      ),
      ...imported.candidates,
    ],
    applications: [
      ...state.applications.filter(
        (application) =>
          !importedApplicationIds.has(application.id) &&
          application.jobId !== jobId &&
          !importedCandidateIds.has(application.candidateId),
      ),
      ...imported.applications,
    ],
    interviewRuns: [
      ...state.interviewRuns.filter(
        (interviewRun) =>
          !importedInterviewRunIds.has(interviewRun.id) &&
          interviewRun.jobId !== jobId &&
          !importedCandidateIds.has(interviewRun.candidateId),
      ),
      ...imported.interviewRuns,
    ],
    evaluations: [
      ...state.evaluations.filter(
        (evaluation) => !importedInterviewRunIds.has(evaluation.interviewRunId),
      ),
      ...imported.evaluations,
    ],
  };

  if (!dryRun) {
    await saveRuntimeStoreState(nextState);
  }

  console.log(
    JSON.stringify(
      {
        dryRun,
        csvPath,
        job: {
          id: imported.job.id,
          recruiterSlug: imported.job.recruiterSlug,
          publicApplyPath: imported.job.publicApplyPath,
        },
        counts: {
          candidates: imported.candidates.length,
          applications: imported.applications.length,
          interviewRuns: imported.interviewRuns.length,
          evaluations: imported.evaluations.length,
          pipeline: imported.job.pipeline,
        },
      },
      null,
      2,
    ),
  );
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exitCode = 1;
});
