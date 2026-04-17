import { notFound } from "next/navigation";

import { JobDetailWorkspace } from "@/components/job-detail-workspace";
import {
  getJobPipelineSnapshot,
} from "@/lib/job-pipeline-server";
import { listInterviewRunRuntimeSnapshotsByCandidateId } from "@/lib/public-apply-submissions";

type JobDetailPageProps = {
  params: Promise<{
    jobId: string;
  }>;
};

export default async function JobDetailPage({ params }: JobDetailPageProps) {
  const { jobId } = await params;
  const snapshot = await getJobPipelineSnapshot(jobId);

  if (!snapshot) {
    notFound();
  }

  const runtimeSnapshotsByCandidateId =
    await listInterviewRunRuntimeSnapshotsByCandidateId(
      snapshot.candidates.map((candidate) => candidate.id),
    );

  return (
    <JobDetailWorkspace
      initialSnapshot={snapshot}
      runtimeSnapshotsByCandidateId={runtimeSnapshotsByCandidateId}
    />
  );
}
