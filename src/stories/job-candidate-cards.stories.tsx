import type { Story, StoryDefault } from "@ladle/react";

import { CandidateStageCard } from "@/components/candidate-stage-card";
import { JobCandidateRow } from "@/components/job-candidate-row";
import type { JobDetailTab, PipelineCandidate } from "@/lib/job-pipeline";
import { cn } from "@/lib/utils";

type PlaygroundProps = {
  fullName: string;
  stage: JobDetailTab;
  summary: string;
  relevantDateLabel: string;
  relevantDateValue: string;
  scoreState?: PipelineCandidate["scoreState"];
  operationalState?: PipelineCandidate["operationalState"];
  rejectedReason?: string;
  selected: boolean;
};

type StageCardRule = {
  showScore: boolean;
  showOperationalState: boolean;
  actions: string[];
};

const candidatesByStage: Record<JobDetailTab, PipelineCandidate[]> = {
  Applicants: [
    {
      id: "cand_1",
      fullName: "Lucia Torres",
      stage: "Applicants",
      summary:
        "Forklift-certified warehouse operator with four years in high-volume logistics and a very clear availability window for rotating shifts.",
      relevantDateLabel: "Applied",
      relevantDateValue: "Today, 09:12",
      scoreState: "Great",
      operationalState: "calling",
    },
    {
      id: "cand_2",
      fullName: "Bea Soto",
      stage: "Applicants",
      summary:
        "Consistent order-picking throughput, retail plus warehouse background, and strong clarity when describing repetitive-process discipline.",
      relevantDateLabel: "Applied",
      relevantDateValue: "Today, 08:34",
      scoreState: "Good",
      operationalState: "pending",
    },
  ],
  Interviewed: [
    {
      id: "cand_3",
      fullName: "Nuria Vega",
      stage: "Interviewed",
      summary:
        "Clear communication, stable warehouse tenure, and a stronger-than-average fit on schedule flexibility and team coordination.",
      relevantDateLabel: "Interviewed",
      relevantDateValue: "Today, 11:05",
      scoreState: "Great",
    },
  ],
  Shortlisted: [
    {
      id: "cand_4",
      fullName: "Ines Gomez",
      stage: "Shortlisted",
      summary:
        "Very strong fit across reliability, shift flexibility, and supervisor feedback from previous logistics roles.",
      relevantDateLabel: "Shortlisted",
      relevantDateValue: "Today, 12:10",
      scoreState: "Outstanding",
    },
  ],
  Hired: [
    {
      id: "cand_5",
      fullName: "Carlos Perez",
      stage: "Hired",
      summary:
        "Accepted for the role after strong interview signal, clean availability match, and prior forklift certification.",
      relevantDateLabel: "Hired",
      relevantDateValue: "Apr 19",
      scoreState: "Great",
    },
  ],
  Rejected: [
    {
      id: "cand_6",
      fullName: "Marta Gil",
      stage: "Rejected",
      summary:
        "Warehouse experience is relevant, but schedule flexibility is too limited for the late-shift coverage the role needs.",
      relevantDateLabel: "Discarded",
      relevantDateValue: "Apr 18",
      scoreState: "Low",
      rejectedReason: "Schedule mismatch",
    },
  ],
};

const stageCardRules: Record<JobDetailTab, StageCardRule> = {
  Applicants: {
    showScore: false,
    showOperationalState: true,
    actions: ["Reject"],
  },
  Interviewed: {
    showScore: true,
    showOperationalState: false,
    actions: ["Shortlist", "Reject"],
  },
  Shortlisted: {
    showScore: true,
    showOperationalState: false,
    actions: ["Hire", "Back to interviewed"],
  },
  Hired: {
    showScore: true,
    showOperationalState: false,
    actions: ["Back to shortlisted"],
  },
  Rejected: {
    showScore: false,
    showOperationalState: false,
    actions: ["Restore"],
  },
};

const defaultPlaygroundCandidate = candidatesByStage.Applicants[0]!;
const rejectedCandidate = candidatesByStage.Rejected[0]!;

function buildCandidate(args: PlaygroundProps): PipelineCandidate {
  return {
    id: "playground",
    fullName: args.fullName,
    stage: args.stage,
    summary: args.summary,
    relevantDateLabel: args.relevantDateLabel,
    relevantDateValue: args.relevantDateValue,
    scoreState: args.scoreState,
    operationalState: args.operationalState,
    rejectedReason: args.rejectedReason,
  };
}

function buildActions(labels: string[]) {
  return labels.map((label, index) => (
    <button
      key={label}
      type="button"
      onClick={(event) => event.stopPropagation()}
      className={cn(
        "rounded-full border px-3 py-1.5 text-[11px] font-medium tracking-[0.14em] uppercase transition-colors",
        index === 0
          ? "border-slate-950 bg-slate-950 text-white hover:bg-slate-800"
          : "border-slate-300/90 bg-white/82 text-slate-600 hover:border-slate-400 hover:text-slate-950",
      )}
    >
      {label}
    </button>
  ));
}

function getCardRule(stage: JobDetailTab) {
  return stageCardRules[stage];
}

export default {
  title: "Job/Candidate Cards",
  decorators: [
    (StoryComponent) => (
      <div className="bg-ops-canvas min-h-screen p-6 md:p-8">
        <div className="mx-auto max-w-6xl">
          <StoryComponent />
        </div>
      </div>
    ),
  ],
  args: {
    fullName: defaultPlaygroundCandidate.fullName,
    stage: defaultPlaygroundCandidate.stage,
    summary: defaultPlaygroundCandidate.summary,
    relevantDateLabel: defaultPlaygroundCandidate.relevantDateLabel,
    relevantDateValue: defaultPlaygroundCandidate.relevantDateValue,
    scoreState: defaultPlaygroundCandidate.scoreState,
    operationalState: defaultPlaygroundCandidate.operationalState,
    rejectedReason: defaultPlaygroundCandidate.rejectedReason,
    selected: false,
  },
  argTypes: {
    stage: {
      control: { type: "select" },
      options: [
        "Applicants",
        "Interviewed",
        "Shortlisted",
        "Hired",
        "Rejected",
      ],
    },
    scoreState: {
      control: { type: "select" },
      options: [
        undefined,
        "Outstanding",
        "Great",
        "Good",
        "Average",
        "Low",
        "Poor",
      ],
    },
    operationalState: {
      control: { type: "select" },
      options: [
        undefined,
        "pending",
        "calling",
        "completed",
        "human_requested",
        "no_response",
      ],
    },
  },
} satisfies StoryDefault<PlaygroundProps>;

export const CurrentVertical: Story<PlaygroundProps> = (args) => (
  <div className="max-w-sm">
    <CandidateStageCard
      candidate={buildCandidate(args)}
      isSelected={args.selected}
      showOperationalState={args.stage === "Applicants"}
    />
  </div>
);

CurrentVertical.storyName = "Current Vertical";

export const HorizontalComfortable: Story<PlaygroundProps> = (args) => {
  const candidate = buildCandidate(args);
  const rule = getCardRule(candidate.stage);

  return (
    <JobCandidateRow
      candidate={candidate}
      density="comfortable"
      isSelected={args.selected}
      visualVariant="ops"
      showOperationalState={rule.showOperationalState}
      showScore={rule.showScore}
      actions={buildActions(rule.actions)}
    />
  );
};

HorizontalComfortable.storyName = "Horizontal Comfortable";

export const HorizontalCompact: Story<PlaygroundProps> = (args) => {
  const candidate = buildCandidate(args);
  const rule = getCardRule(candidate.stage);

  return (
    <JobCandidateRow
      candidate={candidate}
      density="compact"
      isSelected={args.selected}
      visualVariant="ops"
      showOperationalState={rule.showOperationalState}
      showScore={rule.showScore}
      actions={buildActions(rule.actions)}
    />
  );
};

HorizontalCompact.storyName = "Horizontal Compact";

export const StageRules: Story = () => (
  <section className="rounded-[1rem] border border-slate-200/85 bg-white/80 p-4 shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
    <div className="mb-4 grid gap-1">
      <p className="text-base font-semibold text-slate-950">Ops Row baseline</p>
      <p className="text-sm text-slate-500">
        Direccion cerrada para las candidate cards: una fila limpia, clickable,
        con metadata a la derecha y acciones contextuales ligeras.
      </p>
    </div>

    <div className="grid gap-4">
      {(Object.keys(stageCardRules) as JobDetailTab[]).map((stage) => {
        const candidate = candidatesByStage[stage][0]!;
        const rule = stageCardRules[stage];

        return (
          <div
            key={stage}
            className="grid gap-2 rounded-[0.95rem] border border-slate-200/80 bg-white/72 p-3"
          >
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-semibold text-slate-950">
                {stage === "Rejected" ? "Discarded" : stage}
              </p>
              <span className="ops-kicker text-slate-500">
                score: {rule.showScore ? "shown" : "hidden"}
              </span>
              <span className="ops-kicker text-slate-500">
                operational state:{" "}
                {rule.showOperationalState ? "shown" : "hidden"}
              </span>
              <span className="ops-kicker text-slate-500">
                actions: {rule.actions.join(" / ")}
              </span>
            </div>

            <JobCandidateRow
              candidate={candidate}
              density="comfortable"
              visualVariant="ops"
              showOperationalState={rule.showOperationalState}
              showScore={rule.showScore}
              actions={buildActions(rule.actions)}
            />
          </div>
        );
      })}
    </div>
  </section>
);

StageRules.storyName = "Stage Rules";

export const DiscardedState: Story = () => {
  const rule = getCardRule(rejectedCandidate.stage);

  return (
    <JobCandidateRow
      candidate={rejectedCandidate}
      density="comfortable"
      visualVariant="ops"
      showOperationalState={rule.showOperationalState}
      showScore={rule.showScore}
      actions={buildActions(rule.actions)}
    />
  );
};

DiscardedState.storyName = "Discarded State";

export const ApplicantsTabPreview: Story = () => (
  <div className="space-y-5">
    <div className="flex flex-wrap gap-2">
      {[
        { label: "Applicants", count: 18, isActive: true },
        { label: "Interviewed", count: 9, isActive: false },
        { label: "Shortlisted", count: 3, isActive: false },
        { label: "Hired", count: 1, isActive: false },
        { label: "Discarded", count: 6, isActive: false },
      ].map(({ label, count, isActive }) => (
        <button
          key={label}
          type="button"
          className={
            isActive
              ? "rounded-full border border-slate-950 bg-slate-950 px-4 py-2 text-xs font-medium tracking-[0.14em] text-white uppercase"
              : "rounded-full border border-slate-300/90 bg-white/90 px-4 py-2 text-xs font-medium tracking-[0.14em] text-slate-500 uppercase"
          }
        >
          {label} ({count})
        </button>
      ))}
    </div>

    <div className="space-y-3">
      {candidatesByStage.Applicants.map((candidate, index) => (
        <JobCandidateRow
          key={candidate.id}
          candidate={candidate}
          density="comfortable"
          isSelected={index === 0}
          visualVariant="ops"
          showOperationalState
          showScore={false}
          actions={buildActions(stageCardRules.Applicants.actions)}
        />
      ))}
    </div>
  </div>
);

ApplicantsTabPreview.storyName = "Applicants Tab Preview";
