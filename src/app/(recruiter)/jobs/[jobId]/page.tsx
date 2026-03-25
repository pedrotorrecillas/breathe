import { notFound } from "next/navigation";

import { JobDetailWorkspace } from "@/components/job-detail-workspace";

type JobDetailPageProps = {
  params: Promise<{
    jobId: string;
  }>;
};

const knownJobIds = new Set([
  "warehouse-associate-madrid",
  "retail-shift-lead-barcelona",
]);

export default async function JobDetailPage({ params }: JobDetailPageProps) {
  const { jobId } = await params;

  if (!knownJobIds.has(jobId)) {
    notFound();
  }

  return <JobDetailWorkspace jobId={jobId} />;
}
