import { getPublicApplySubmissionSnapshot } from "@/lib/public-apply-submissions";

export type CandidateInterviewRecording = {
  recordingUrl: string;
  recordingDurationSeconds: number | null;
  providerCallId: string | null;
  completedAt: string | null;
  transcriptUrl: string | null;
};

function normalizeFullName(value: string) {
  return value.trim().toLowerCase();
}

export function getInterviewRecordingForCandidate(
  candidateFullName: string,
): CandidateInterviewRecording | null {
  const snapshot = getPublicApplySubmissionSnapshot();
  const normalizedName = normalizeFullName(candidateFullName);
  const matchingCandidateIds = snapshot.candidates
    .filter((candidate) => normalizeFullName(candidate.fullName) === normalizedName)
    .map((candidate) => candidate.id);

  if (matchingCandidateIds.length === 0) {
    return null;
  }

  const matchingRun = [...snapshot.interviewRuns]
    .reverse()
    .find(
      (run) =>
        matchingCandidateIds.includes(run.candidateId) &&
        run.artifacts.recordingUrl !== null,
    );

  if (!matchingRun || !matchingRun.artifacts.recordingUrl) {
    return null;
  }

  return {
    recordingUrl: matchingRun.artifacts.recordingUrl,
    recordingDurationSeconds: matchingRun.artifacts.recordingDurationSeconds,
    providerCallId: matchingRun.dispatch.providerCallId,
    completedAt: matchingRun.trace.completedAt,
    transcriptUrl: matchingRun.artifacts.transcriptUrl,
  };
}
