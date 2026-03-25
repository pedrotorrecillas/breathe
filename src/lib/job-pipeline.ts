export const activePipelineStages = [
  "Applicants",
  "Interviewed",
  "Shortlisted",
  "Hired",
] as const;

export const jobDetailTabs = [...activePipelineStages, "Rejected"] as const;

export type ActivePipelineStage = (typeof activePipelineStages)[number];
export type JobDetailTab = (typeof jobDetailTabs)[number];

export type PipelineScoreState =
  | "Outstanding"
  | "Great"
  | "Good"
  | "Average"
  | "Low"
  | "Poor";

export type PipelineOperationalState =
  | "pending"
  | "calling"
  | "completed"
  | "human_requested"
  | "no_response";

export type PipelineCandidate = {
  id: string;
  fullName: string;
  stage: JobDetailTab;
  summary: string;
  relevantDateLabel: string;
  relevantDateValue: string;
  scoreState?: PipelineScoreState;
  operationalState?: PipelineOperationalState;
  rejectedReason?: string;
};

type JobPipelineSeed = {
  title: string;
  candidates: PipelineCandidate[];
};

const jobPipelineSeeds: Record<string, JobPipelineSeed> = {
  "warehouse-associate-madrid": {
    title: "Warehouse Associate",
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
        id: "cand_clara_nieto",
        fullName: "Clara Nieto",
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

export function getJobPipelineSnapshot(jobId: string) {
  const seed = jobPipelineSeeds[jobId];

  if (!seed) {
    return null;
  }

  return {
    title: seed.title,
    candidates: seed.candidates.map((candidate) => ({ ...candidate })),
  };
}

export function getCandidatesForStage(
  candidates: PipelineCandidate[],
  stage: JobDetailTab,
) {
  return candidates.filter((candidate) => candidate.stage === stage);
}
