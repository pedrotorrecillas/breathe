import { buildEvaluationSummary } from "@/lib/evaluation-summary";
import { loadRuntimeStoreState, type RuntimeStoreState } from "@/lib/db/runtime-store";
import {
  type JobDetailTab,
  type PipelineCandidate,
  activePipelineStages,
} from "@/lib/job-pipeline";

type JobPipelineSeed = {
  title: string;
  publicApplyPath?: string;
  candidates: PipelineCandidate[];
};

const jobPipelineSeeds: Record<string, JobPipelineSeed> = {
  "warehouse-associate-madrid": {
    title: "Warehouse Associate",
    publicApplyPath: "/apply/demo-warehouse-associate",
    candidates: [
      {
        id: "cand_lucia_torres",
        fullName: "Lucia Torres",
        stage: "Applicants",
        summary: "Forklift-certified warehouse operator with bilingual shift availability.",
        relevantDateLabel: "Applied",
        relevantDateValue: "Today, 09:12",
        scoreState: "Great",
        operationalState: "calling",
      },
      {
        id: "cand_daniel_ruiz",
        fullName: "Daniel Ruiz",
        stage: "Applicants",
        summary: "Night-shift picker with cold-chain experience and fast start date.",
        relevantDateLabel: "Applied",
        relevantDateValue: "Today, 08:46",
        scoreState: "Good",
        operationalState: "pending",
      },
      {
        id: "cand_sofia_martin",
        fullName: "Sofia Martin",
        stage: "Applicants",
        summary: "Warehouse lead assistant asking for a human callback before interview.",
        relevantDateLabel: "Applied",
        relevantDateValue: "Yesterday",
        operationalState: "human_requested",
      },
      {
        id: "cand_aitor_vega",
        fullName: "Aitor Vega",
        stage: "Applicants",
        summary: "Returns specialist with stable warehouse tenure and weekend availability.",
        relevantDateLabel: "Applied",
        relevantDateValue: "Yesterday",
        scoreState: "Average",
        operationalState: "completed",
      },
      {
        id: "cand_rocio_perez",
        fullName: "Rocio Perez",
        stage: "Applicants",
        summary: "Packaging line operator with multi-site retail warehouse coverage.",
        relevantDateLabel: "Applied",
        relevantDateValue: "2 days ago",
        scoreState: "Good",
        operationalState: "no_response",
      },
      {
        id: "cand_nora_alonso",
        fullName: "Nora Alonso",
        stage: "Applicants",
        summary: "High-volume inventory assistant with same-day shift flexibility.",
        relevantDateLabel: "Applied",
        relevantDateValue: "2 days ago",
      },
      {
        id: "cand_tomas_vidal",
        fullName: "Tomas Vidal",
        stage: "Interviewed",
        summary: "Strong warehouse systems exposure and reliable team lead references.",
        relevantDateLabel: "Interviewed",
        relevantDateValue: "Today, 11:20",
        scoreState: "Outstanding",
      },
      {
        id: "cand_bea_soto",
        fullName: "Bea Soto",
        stage: "Interviewed",
        summary: "Consistent order-picking throughput with clean attendance record.",
        relevantDateLabel: "Interviewed",
        relevantDateValue: "Today, 10:02",
        scoreState: "Great",
      },
      {
        id: "cand_mario_lopez",
        fullName: "Mario Lopez",
        stage: "Interviewed",
        summary: "Calm communicator with previous warehouse onboarding experience.",
        relevantDateLabel: "Interviewed",
        relevantDateValue: "Yesterday",
        scoreState: "Good",
      },
      {
        id: "cand_paula_arias",
        fullName: "Paula Arias",
        stage: "Interviewed",
        summary: "Short commute and strong handling equipment familiarity.",
        relevantDateLabel: "Interviewed",
        relevantDateValue: "Yesterday",
        scoreState: "Average",
      },
      {
        id: "cand_ines_gomez",
        fullName: "Ines Gomez",
        stage: "Shortlisted",
        summary: "Fastest intake-to-shift profile with excellent supervisor feedback.",
        relevantDateLabel: "Shortlisted",
        relevantDateValue: "Today, 12:05",
        scoreState: "Outstanding",
      },
      {
        id: "cand_omar_navarro",
        fullName: "Omar Navarro",
        stage: "Shortlisted",
        summary: "Reliable late-shift candidate with strong attendance and stamina.",
        relevantDateLabel: "Shortlisted",
        relevantDateValue: "Today, 09:48",
        scoreState: "Great",
      },
      {
        id: "cand_marta_gil",
        fullName: "Marta Gil",
        stage: "Rejected",
        summary: "Relevant logistics experience but not enough weekend flexibility.",
        relevantDateLabel: "Rejected",
        relevantDateValue: "Yesterday",
        rejectedReason: "Schedule mismatch",
      },
      {
        id: "cand_jaime_sanz",
        fullName: "Jaime Sanz",
        stage: "Rejected",
        summary: "Good interview outcome but commute risk flagged by recruiter review.",
        relevantDateLabel: "Rejected",
        relevantDateValue: "2 days ago",
        rejectedReason: "Commute risk",
      },
    ],
  },
  "retail-shift-lead-barcelona": {
    title: "Retail Shift Lead",
    publicApplyPath: "/apply/demo-retail-shift-lead",
    candidates: [
      {
        id: "cand_elena_mora",
        fullName: "Elena Mora",
        stage: "Applicants",
        summary: "Store-floor lead with multilingual customer support background.",
        relevantDateLabel: "Applied",
        relevantDateValue: "Today, 08:10",
        scoreState: "Great",
        operationalState: "pending",
      },
      {
        id: "cand_ruben_ortega",
        fullName: "Ruben Ortega",
        stage: "Interviewed",
        summary: "Strong closing-shift ownership and cash reconciliation discipline.",
        relevantDateLabel: "Interviewed",
        relevantDateValue: "Yesterday",
        scoreState: "Great",
      },
      {
        id: "cand_carla_nieto",
        fullName: "Carla Nieto",
        stage: "Shortlisted",
        summary: "Team leadership signal is strong, with stable weekend availability.",
        relevantDateLabel: "Shortlisted",
        relevantDateValue: "Yesterday",
        scoreState: "Outstanding",
      },
      {
        id: "cand_raul_serra",
        fullName: "Raul Serra",
        stage: "Hired",
        summary: "Offer accepted and onboarding checkpoint in progress.",
        relevantDateLabel: "Hired",
        relevantDateValue: "Today",
        scoreState: "Outstanding",
      },
      {
        id: "cand_laura_pardo",
        fullName: "Laura Pardo",
        stage: "Rejected",
        summary: "Shift constraints conflicted with the rota this store needs.",
        relevantDateLabel: "Rejected",
        relevantDateValue: "3 days ago",
        rejectedReason: "Availability mismatch",
      },
    ],
  },
};

function normalizeStage(stage: string): JobDetailTab {
  switch (stage) {
    case "interviewed":
      return "Interviewed";
    case "shortlisted":
      return "Shortlisted";
    case "hired":
      return "Hired";
    case "rejected":
      return "Rejected";
    default:
      return "Applicants";
  }
}

function pipelineScoreStateFromFinal(scoreState: string | null | undefined) {
  if (
    scoreState === "Outstanding" ||
    scoreState === "Great" ||
    scoreState === "Good" ||
    scoreState === "Average" ||
    scoreState === "Low" ||
    scoreState === "Poor"
  ) {
    return scoreState;
  }

  return undefined;
}

function operationalStateFromRuntimeStatus(status?: string | null) {
  switch (status) {
    case "queued":
    case "normalized":
    case "dispatching":
    case "dialing":
    case "in_progress":
      return "calling";
    case "completed":
      return "completed";
    case "human_requested":
      return "human_requested";
    case "no_response":
      return "no_response";
    default:
      return undefined;
  }
}

function formatRelevantDate(
  stage: JobDetailTab,
  submittedAt: string,
  completedAt: string | null,
  lastEventAt: string | null,
) {
  if (stage === "Interviewed" && completedAt) {
    return {
      label: "Interviewed",
      value: completedAt,
    };
  }

  if (stage === "Rejected" && lastEventAt) {
    return {
      label: "Rejected",
      value: lastEventAt,
    };
  }

  return {
    label: "Applied",
    value: submittedAt,
  };
}

function deriveRuntimeSnapshotFromState(
  state: RuntimeStoreState,
  candidateId: string,
) {
  const interviewRun = [...state.interviewRuns]
    .reverse()
    .find((run) => run.candidateId === candidateId);

  if (!interviewRun) {
    return null;
  }

  const evaluation =
    state.evaluations.find((item) => item.interviewRunId === interviewRun.id) ?? null;

  return {
    interviewRun,
    evaluation,
  };
}

function latestApplicationsByCandidate(
  applications: RuntimeStoreState["applications"],
) {
  const latestByCandidate = new Map<string, RuntimeStoreState["applications"][number]>();

  for (const application of applications) {
    const existing = latestByCandidate.get(application.candidateId);

    if (!existing || application.submittedAt > existing.submittedAt) {
      latestByCandidate.set(application.candidateId, application);
    }
  }

  return [...latestByCandidate.values()];
}

function buildLivePipelineSnapshot(
  state: RuntimeStoreState,
  jobId: string,
): JobPipelineSeed | null {
  const job = state.jobs.find((item) => item.recruiterSlug === jobId);

  if (!job) {
    return null;
  }

  const liveApplications = state.applications.filter(
    (application) => application.jobId === job.id,
  );
  const latestApplications = latestApplicationsByCandidate(liveApplications);

  if (latestApplications.length === 0) {
    return null;
  }

  const candidates = latestApplications
    .map((application) => {
      const candidate = state.candidates.find(
        (item) => item.id === application.candidateId,
      );
      if (!candidate) {
        return null;
      }

      const interviewRun = deriveRuntimeSnapshotFromState(state, candidate.id);
      const evaluation = interviewRun?.evaluation ?? null;
      const summary = evaluation ? buildEvaluationSummary(evaluation) : null;
      const stage = normalizeStage(application.stage);
      const relevant = formatRelevantDate(
        stage,
        application.submittedAt,
        interviewRun?.interviewRun.trace.completedAt ?? null,
        interviewRun?.interviewRun.trace.lastEventAt ?? null,
      );

      return {
        id: candidate.id,
        fullName: candidate.fullName,
        stage,
        summary:
          summary?.summary ??
          (stage === "Interviewed"
            ? "Completed interview and ready for recruiter review."
            : stage === "Rejected"
              ? "Interview outcome routed to rejected review."
              : interviewRun?.interviewRun.status === "human_requested"
                ? "Candidate asked for a human callback during the interview."
                : "Public apply candidate awaiting runtime progression."),
        relevantDateLabel: relevant.label,
        relevantDateValue: relevant.value,
        scoreState: pipelineScoreStateFromFinal(summary?.finalScoreState ?? null),
        operationalState: operationalStateFromRuntimeStatus(
          interviewRun?.interviewRun.status ?? null,
        ),
        rejectedReason:
          stage === "Rejected"
            ? interviewRun?.interviewRun.metadata.failureReason ?? "Rejected"
            : undefined,
      } satisfies PipelineCandidate;
    })
    .filter((candidate): candidate is PipelineCandidate => candidate !== null)
    .sort((left, right) => {
      const order: Record<JobDetailTab, number> = {
        Applicants: 0,
        Interviewed: 1,
        Shortlisted: 2,
        Hired: 3,
        Rejected: 4,
      };

      if (order[left.stage] !== order[right.stage]) {
        return order[left.stage] - order[right.stage];
      }

      return left.fullName.localeCompare(right.fullName);
    });

  return {
    title: job.title,
    publicApplyPath: job.publicApplyPath,
    candidates,
  };
}

export async function getJobPipelineSnapshot(jobId: string) {
  const state = await loadRuntimeStoreState();
  const liveSnapshot = buildLivePipelineSnapshot(state, jobId);

  if (liveSnapshot) {
    return liveSnapshot;
  }

  const seed = jobPipelineSeeds[jobId];

  if (!seed) {
    return null;
  }

  return {
    title: seed.title,
    publicApplyPath: seed.publicApplyPath ?? null,
    candidates: seed.candidates.map((candidate) => ({ ...candidate })),
  };
}

export async function listRecruiterJobs() {
  const state = await loadRuntimeStoreState();

  return state.jobs.map((job) => {
    const liveApplications = state.applications.filter(
      (application) => application.jobId === job.id,
    );
    const counts = latestApplicationsByCandidate(liveApplications).reduce(
      (accumulator, application) => {
        if (application.stage === "applicant") {
          accumulator.applicants += 1;
        } else if (application.stage === "interviewed") {
          accumulator.interviewed += 1;
        } else if (application.stage === "shortlisted") {
          accumulator.shortlisted += 1;
        } else if (application.stage === "hired") {
          accumulator.hired += 1;
        } else if (application.stage === "rejected") {
          accumulator.rejected += 1;
        }

        return accumulator;
      },
      {
        applicants: 0,
        interviewed: 0,
        shortlisted: 0,
        hired: 0,
        rejected: 0,
      },
    );

    return {
      id: job.recruiterSlug,
      title: job.title,
      publicApplyPath: job.publicApplyPath,
      status: job.status === "active" ? "Active" : job.status === "draft" ? "Draft" : "Inactive",
      location: job.location ?? "Unknown",
      createdAt: new Date(job.createdAt).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      }),
      pipeline: liveApplications.length > 0 ? counts : job.pipeline,
    };
  });
}

export { activePipelineStages };
