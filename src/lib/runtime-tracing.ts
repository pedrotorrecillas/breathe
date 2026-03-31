export type RuntimeTracePhase =
  | "interview_preparation.started"
  | "interview_preparation.completed"
  | "dispatch.started"
  | "dispatch.completed"
  | "dispatch.failed";

export type RuntimeTraceEvent = {
  phase: RuntimeTracePhase;
  occurredAt: string;
  interviewRunId: string;
  candidateId: string;
  jobId: string;
  interviewPackageId: string | null;
  language: string | null;
  questionCount: number | null;
  outboundNumber: string | null;
  providerCallId: string | null;
  providerStatus: string | null;
  failureCode: string | null;
  failureMessage: string | null;
  metadata: Record<string, string | number | boolean | null>;
};

export type RuntimeTraceSink = (event: RuntimeTraceEvent) => void;

export type RuntimeTraceCollector = {
  events: RuntimeTraceEvent[];
  sink: RuntimeTraceSink;
};

function emitRuntimeTrace(sink: RuntimeTraceSink | undefined, event: RuntimeTraceEvent) {
  if (!sink) {
    return;
  }

  sink(event);
}

export function createRuntimeTraceCollector(): RuntimeTraceCollector {
  const events: RuntimeTraceEvent[] = [];

  return {
    events,
    sink: (event) => {
      events.push(event);
    },
  };
}

export function traceInterviewPreparationStarted(input: {
  sink?: RuntimeTraceSink;
  occurredAt: string;
  interviewRunId: string;
  candidateId: string;
  jobId: string;
}): void {
  emitRuntimeTrace(input.sink, {
    phase: "interview_preparation.started",
    occurredAt: input.occurredAt,
    interviewRunId: input.interviewRunId,
    candidateId: input.candidateId,
    jobId: input.jobId,
    interviewPackageId: null,
    language: null,
    questionCount: null,
    outboundNumber: null,
    providerCallId: null,
    providerStatus: null,
    failureCode: null,
    failureMessage: null,
    metadata: {},
  });
}

export function traceInterviewPreparationCompleted(input: {
  sink?: RuntimeTraceSink;
  occurredAt: string;
  interviewRunId: string;
  candidateId: string;
  jobId: string;
  interviewPackageId: string;
  language: string;
  questionCount: number;
  normalizedAt: string | null;
  outboundNumber: string | null;
}): void {
  emitRuntimeTrace(input.sink, {
    phase: "interview_preparation.completed",
    occurredAt: input.occurredAt,
    interviewRunId: input.interviewRunId,
    candidateId: input.candidateId,
    jobId: input.jobId,
    interviewPackageId: input.interviewPackageId,
    language: input.language,
    questionCount: input.questionCount,
    outboundNumber: input.outboundNumber,
    providerCallId: null,
    providerStatus: null,
    failureCode: null,
    failureMessage: null,
    metadata: {
      normalizedAt: input.normalizedAt,
    },
  });
}

export function traceDispatchStarted(input: {
  sink?: RuntimeTraceSink;
  occurredAt: string;
  interviewRunId: string;
  candidateId: string;
  jobId: string;
  interviewPackageId: string;
  language: string;
  outboundNumber: string | null;
}): void {
  emitRuntimeTrace(input.sink, {
    phase: "dispatch.started",
    occurredAt: input.occurredAt,
    interviewRunId: input.interviewRunId,
    candidateId: input.candidateId,
    jobId: input.jobId,
    interviewPackageId: input.interviewPackageId,
    language: input.language,
    questionCount: null,
    outboundNumber: input.outboundNumber,
    providerCallId: null,
    providerStatus: null,
    failureCode: null,
    failureMessage: null,
    metadata: {},
  });
}

export function traceDispatchCompleted(input: {
  sink?: RuntimeTraceSink;
  occurredAt: string;
  interviewRunId: string;
  candidateId: string;
  jobId: string;
  interviewPackageId: string;
  language: string;
  outboundNumber: string | null;
  providerCallId: string;
  providerStatus: string;
}): void {
  emitRuntimeTrace(input.sink, {
    phase: "dispatch.completed",
    occurredAt: input.occurredAt,
    interviewRunId: input.interviewRunId,
    candidateId: input.candidateId,
    jobId: input.jobId,
    interviewPackageId: input.interviewPackageId,
    language: input.language,
    questionCount: null,
    outboundNumber: input.outboundNumber,
    providerCallId: input.providerCallId,
    providerStatus: input.providerStatus,
    failureCode: null,
    failureMessage: null,
    metadata: {},
  });
}

export function traceDispatchFailed(input: {
  sink?: RuntimeTraceSink;
  occurredAt: string;
  interviewRunId: string;
  candidateId: string;
  jobId: string;
  interviewPackageId: string;
  language: string;
  outboundNumber: string | null;
  failureCode: string;
  failureMessage: string;
  providerStatus: string | null;
}): void {
  emitRuntimeTrace(input.sink, {
    phase: "dispatch.failed",
    occurredAt: input.occurredAt,
    interviewRunId: input.interviewRunId,
    candidateId: input.candidateId,
    jobId: input.jobId,
    interviewPackageId: input.interviewPackageId,
    language: input.language,
    questionCount: null,
    outboundNumber: input.outboundNumber,
    providerCallId: null,
    providerStatus: input.providerStatus,
    failureCode: input.failureCode,
    failureMessage: input.failureMessage,
    metadata: {},
  });
}
