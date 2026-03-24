import { Button } from "@/components/ui/button";
import { PlaceholderState } from "@/components/placeholder-state";
import { SectionCard } from "@/components/section-card";
import { ErrorState } from "@/components/shared-states";
import { StatusBadge } from "@/components/status-badge";

type ApplyPageProps = {
  params: Promise<{
    jobId: string;
  }>;
};

export default async function ApplyPage({ params }: ApplyPageProps) {
  const { jobId } = await params;

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-6 py-10">
      <PlaceholderState
        eyebrow="BRE-8 Preview"
        title="The candidate apply flow is public, lightweight, and ready for immediate phone dispatch."
        description="This route anchors the public application surface where candidates submit contact details, accept terms, and enter the interview queue."
      >
        <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <SectionCard title="Public form surface" kicker={jobId}>
            <ul className="space-y-3 text-sm leading-7 text-slate-600">
              <li>Candidate name and phone</li>
              <li>Email and language preference</li>
              <li>Optional CV upload</li>
              <li>Terms and AI disclosure acceptance</li>
            </ul>
          </SectionCard>

          <SectionCard title="Expected confirmation" kicker="Post-submit state">
            <StatusBadge intent="warning">
              Calls happen after submit
            </StatusBadge>
            <p className="mt-4 text-sm leading-7 text-slate-600">
              The MVP confirmation message is simple: “Thanks, we’ll call you
              now.”
            </p>
            <Button className="mt-6 rounded-full bg-slate-950 text-white hover:bg-slate-800">
              Continue later
            </Button>
          </SectionCard>
        </div>

        <ErrorState
          eyebrow="Shared error"
          title="This job is not currently accepting applications."
          description="Reuse this when a public apply link is inactive, expired, or temporarily unavailable without building a one-off error surface."
        >
          <p className="text-sm leading-7 text-slate-600">
            In later issues this can link candidates to an alternate flow or a
            human contact path.
          </p>
        </ErrorState>
      </PlaceholderState>
    </div>
  );
}
