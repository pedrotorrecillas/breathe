import type { Job } from "@/domain/jobs/types";
import {
  findStoredJobById,
  findStoredJobByPublicSlug,
  listStoredJobs,
} from "@/lib/db/runtime-store";

export type PublicJobRecord = Job & {
  recruiterSlug: string;
  description: string;
  salary: string | null;
  schedule: string | null;
};

export async function listPublicJobs() {
  return listStoredJobs();
}

export async function findPublicJobBySlug(slug: string) {
  return findStoredJobByPublicSlug(slug);
}

export async function findPublicJobById(jobId: string) {
  return findStoredJobById(jobId);
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
