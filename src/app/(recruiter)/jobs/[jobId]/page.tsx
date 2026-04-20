import { notFound } from "next/navigation";

import { JobDetailWorkspace } from "@/components/job-detail-workspace";
import { getCurrentRecruiter } from "@/lib/auth/server";
import { listCandidateNotesByCandidateIdForJob } from "@/lib/candidate-notes";
import {
  getJobPipelineSnapshot,
  getJobPipelineSnapshotForRecruiter,
} from "@/lib/job-pipeline-server";
import { listInterviewRunRuntimeSnapshotsByCandidateId } from "@/lib/public-apply-submissions";

type JobDetailPageProps = {
  params: Promise<{
    jobId: string;
  }>;
};

export default async function JobDetailPage({ params }: JobDetailPageProps) {
  const recruiter = await getCurrentRecruiter().catch(() => null);
  const { jobId } = await params;
  const snapshot = recruiter
    ? await getJobPipelineSnapshotForRecruiter(recruiter, jobId)
    : await getJobPipelineSnapshot(jobId);

  if (!snapshot) {
    notFound();
  }

  const runtimeSnapshotsByCandidateId =
    await listInterviewRunRuntimeSnapshotsByCandidateId(
      snapshot.candidates.map((candidate) => candidate.id),
    );
  const candidateNotesByCandidateId =
    await listCandidateNotesByCandidateIdForJob(
      snapshot.candidates[0]?.jobId ?? jobId,
      snapshot.candidates.map((candidate) => candidate.id),
    );

  return (
    <JobDetailWorkspace
      initialSnapshot={snapshot}
      candidateNotesByCandidateId={candidateNotesByCandidateId}
      runtimeSnapshotsByCandidateId={runtimeSnapshotsByCandidateId}
    />
  );
}
