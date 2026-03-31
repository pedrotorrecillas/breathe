import type { Job } from "@/domain/jobs/types";

export type PublicJobRecord = Job & {
  description: string;
  salary: string | null;
  schedule: string | null;
};

const publicJobs: PublicJobRecord[] = [
  {
    id: "job_warehouse_madrid",
    title: "Warehouse Associate",
    summary: "Night shift warehouse intake with immediate phone interview.",
    description:
      "Join a high-volume warehouse operation in Madrid. You will manage picking, loading, barcode scanning, and shift handoff tasks in a fast-paced environment.",
    location: "Madrid",
    salary: "EUR 22,000 gross yearly",
    schedule: "Night shift, weekend availability required",
    status: "active",
    interviewLanguage: "en",
    createdAt: "2026-03-24T00:00:00.000Z",
    publishedAt: "2026-03-24T12:00:00.000Z",
    expiresAt: null,
    publicApplyPath: "/apply/demo-warehouse-associate",
    pipeline: {
      applicants: 42,
      interviewed: 28,
      shortlisted: 9,
      hired: 2,
      rejected: 11,
    },
    requirements: [
      {
        id: "req_warehouse_schedule",
        code: "schedule",
        label: "Night shift availability",
        description: "Candidate can reliably work night shifts and weekend coverage.",
        category: "condition",
        weight: 1,
        isKnockout: true,
      },
      {
        id: "req_warehouse_experience",
        code: null,
        label: "Warehouse experience",
        description: "Previous warehouse work with fast-paced picking or loading.",
        category: "essential",
        weight: 3,
        isKnockout: false,
      },
      {
        id: "req_warehouse_scanners",
        code: null,
        label: "Scanner systems",
        description: "Daily handheld scanning and inventory system use.",
        category: "technical",
        weight: 2,
        isKnockout: false,
      },
      {
        id: "req_warehouse_teamwork",
        code: null,
        label: "Team communication",
        description: "Coordinate clearly with shift leads and warehouse peers.",
        category: "interpersonal",
        weight: 2,
        isKnockout: false,
      },
    ],
    interviewLimits: {
      maxInterviews: 60,
      outstandingCap: null,
      greatCap: null,
    },
  },
  {
    id: "job_retail_barcelona",
    title: "Retail Shift Lead",
    summary: "Public link retained for reference, but intake is currently paused.",
    description:
      "Lead an in-store shift with opening, closing, floor coordination, and team escalation responsibilities across a busy Barcelona retail location.",
    location: "Barcelona",
    salary: null,
    schedule: "Rotating shift pattern",
    status: "inactive",
    interviewLanguage: "es",
    createdAt: "2026-03-24T00:00:00.000Z",
    publishedAt: "2026-03-24T13:00:00.000Z",
    expiresAt: null,
    publicApplyPath: "/apply/demo-retail-shift-lead",
    pipeline: {
      applicants: 8,
      interviewed: 8,
      shortlisted: 2,
      hired: 0,
      rejected: 6,
    },
    requirements: [],
    interviewLimits: {
      maxInterviews: 8,
      outstandingCap: null,
      greatCap: null,
    },
  },
  {
    id: "job_ops_coordinator_valencia",
    title: "Operations Coordinator",
    summary: "Public intake is paused because the interview queue is full.",
    description:
      "Coordinate shift coverage, warehouse escalations, and reporting handoff across a busy Valencia operation.",
    location: "Valencia",
    salary: "EUR 26,000 gross yearly",
    schedule: "Early and late shift rotation",
    status: "active",
    interviewLanguage: "es",
    createdAt: "2026-03-24T00:00:00.000Z",
    publishedAt: "2026-03-24T14:00:00.000Z",
    expiresAt: null,
    publicApplyPath: "/apply/demo-operations-coordinator",
    pipeline: {
      applicants: 14,
      interviewed: 14,
      shortlisted: 4,
      hired: 1,
      rejected: 9,
    },
    requirements: [],
    interviewLimits: {
      maxInterviews: 14,
      outstandingCap: null,
      greatCap: null,
    },
  },
];

export function listPublicJobs() {
  return publicJobs;
}

export function findPublicJobBySlug(slug: string) {
  return publicJobs.find((job) => job.publicApplyPath === `/apply/${slug}`) ?? null;
}

export function findPublicJobById(jobId: string) {
  return publicJobs.find((job) => job.id === jobId) ?? null;
}

export function isPublicJobAvailable(job: PublicJobRecord) {
  if (job.status !== "active") {
    return {
      isAvailable: false,
      reason: "inactive" as const,
    };
  }

  if (
    job.interviewLimits.maxInterviews !== null &&
    job.pipeline.interviewed >= job.interviewLimits.maxInterviews
  ) {
    return {
      isAvailable: false,
      reason: "limit_reached" as const,
    };
  }

  return {
    isAvailable: true,
    reason: null,
  };
}
