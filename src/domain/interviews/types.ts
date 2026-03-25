export type InterviewRunStatus =
  | "queued"
  | "dialing"
  | "in_progress"
  | "completed"
  | "failed"
  | "needs_human";

export type InterviewProvider = "happyrobot";

export type InterviewRun = {
  id: string;
  candidateId: string;
  applicationId: string;
  jobId: string;
  provider: InterviewProvider;
  status: InterviewRunStatus;
  initiatedAt: string | null;
  completedAt: string | null;
  recordingUrl: string | null;
  transcriptUrl: string | null;
};
