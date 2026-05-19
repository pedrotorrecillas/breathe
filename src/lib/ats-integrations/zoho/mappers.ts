import type { ATSStageCategory } from "@/domain/ats-integrations/types";
import type {
  ATSProviderApplication,
  ATSProviderCandidate,
  ATSProviderJob,
} from "@/lib/ats-integrations/adapters/types";

export type ZohoRecord = Record<string, unknown>;

function stringField(record: ZohoRecord, key: string): string | null {
  const value = record[key];

  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }

  if (typeof value === "number") {
    return String(value);
  }

  return null;
}

function requiredStringField(record: ZohoRecord, key: string) {
  const value = stringField(record, key);

  if (!value) {
    throw new Error(`Zoho Recruit record is missing ${key}.`);
  }

  return value;
}

function normalizeZohoTimestamp(value: string | null) {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toISOString();
}

function normalizeText(value: string | null) {
  return value?.trim().toLowerCase().replace(/\s+/g, " ") ?? "";
}

export function mapZohoStatusToStageCategory(
  status: string | null,
): ATSStageCategory {
  const normalized = normalizeText(status);

  if (!normalized) {
    return "new";
  }

  if (
    normalized.includes("screen") ||
    normalized.includes("new") ||
    normalized.includes("associated")
  ) {
    return "screening";
  }

  if (normalized.includes("interview")) {
    return "interview";
  }

  if (normalized.includes("shortlist") || normalized.includes("review")) {
    return "evaluation";
  }

  if (normalized.includes("offer")) {
    return "offer";
  }

  if (normalized.includes("hire") || normalized.includes("placed")) {
    return "hired";
  }

  if (
    normalized.includes("reject") ||
    normalized.includes("unqualified") ||
    normalized.includes("disqual")
  ) {
    return "rejected";
  }

  return "other";
}

export function mapZohoJobOpeningToProviderJob(
  record: ZohoRecord,
): ATSProviderJob {
  const status = normalizeText(stringField(record, "Job_Opening_Status"));

  return {
    externalId: requiredStringField(record, "id"),
    externalUrl: stringField(record, "Record_Image") ?? null,
    title:
      stringField(record, "Posting_Title") ??
      stringField(record, "Job_Opening_Name") ??
      "Untitled Zoho job",
    status:
      status.includes("closed") ||
      status.includes("cancelled") ||
      status.includes("filled")
        ? "archived_external"
        : "active",
    externalUpdatedAt: normalizeZohoTimestamp(stringField(record, "Modified_Time")),
    raw: record,
  };
}

export function mapZohoCandidateToProviderCandidate(
  record: ZohoRecord,
): ATSProviderCandidate {
  const joinedName = [
    stringField(record, "First_Name"),
    stringField(record, "Last_Name"),
  ]
    .filter(Boolean)
    .join(" ");

  return {
    externalId: requiredStringField(record, "id"),
    externalUrl: stringField(record, "Record_Image") ?? null,
    fullName:
      stringField(record, "Full_Name") ??
      (joinedName.length > 0 ? joinedName : "Unknown candidate"),
    email: stringField(record, "Email"),
    phone: stringField(record, "Mobile") ?? stringField(record, "Phone"),
    status: "active",
    externalUpdatedAt: normalizeZohoTimestamp(stringField(record, "Modified_Time")),
    raw: record,
  };
}

export function mapZohoCandidateToProviderApplication(input: {
  candidate: ZohoRecord;
  fallbackJobId: string;
  fallbackJobTitle: string;
}): ATSProviderApplication {
  const candidate = mapZohoCandidateToProviderCandidate(input.candidate);
  const status = stringField(input.candidate, "Candidate_Status") ?? "New";

  return {
    externalId: `${candidate.externalId}:${input.fallbackJobId}`,
    externalCandidateId: candidate.externalId,
    externalJobId: input.fallbackJobId,
    externalStageId: status,
    externalUrl: candidate.externalUrl,
    candidateName: candidate.fullName,
    candidateEmail: candidate.email,
    candidatePhone: candidate.phone,
    jobTitle: input.fallbackJobTitle,
    stageName: status,
    stageCategory: mapZohoStatusToStageCategory(status),
    status: candidate.status,
    externalUpdatedAt: candidate.externalUpdatedAt,
    raw: input.candidate,
  };
}
