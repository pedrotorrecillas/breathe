import { Button } from "@/components/ui/button";
import { FormField } from "@/components/form-field";
import { PlaceholderState } from "@/components/placeholder-state";
import { SectionCard } from "@/components/section-card";
import { ErrorState } from "@/components/shared-states";
import { StatusBadge } from "@/components/status-badge";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

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
          <SectionCard
            title="Public form surface"
            kicker={jobId}
            description="Candidate capture stays lightweight and operational so the interview can start immediately."
            tone="strong"
          >
            <form className="grid gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="Full name" required>
                  <Input defaultValue="Lucia Torres" />
                </FormField>
                <FormField label="Phone" required>
                  <Input defaultValue="+34 600 123 456" />
                </FormField>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  label="Email"
                  hint="Optional for the first call, useful for follow-up."
                >
                  <Input defaultValue="lucia@example.com" type="email" />
                </FormField>
                <FormField label="Language preference" required>
                  <Select defaultValue="en">
                    <option value="en">English</option>
                    <option value="es">Spanish</option>
                  </Select>
                </FormField>
              </div>

              <FormField
                label="CV upload"
                hint="Optional in MVP. Candidates can continue without a file."
              >
                <Input type="file" />
              </FormField>

              <FormField
                label="Consent and AI disclosure"
                required
                error="Candidates must accept the disclosure before entering the queue."
              >
                <div className="rounded-[1rem] border border-slate-300/90 bg-white/92 px-4 py-3 text-sm leading-7 text-slate-700">
                  I understand this interview uses AI to support human
                  recruiters.
                </div>
              </FormField>

              <Button className="mt-2 rounded-full bg-slate-950 px-6 text-white hover:bg-slate-800">
                Submit and receive call
              </Button>
            </form>
          </SectionCard>

          <SectionCard
            title="Expected confirmation"
            kicker="Post-submit state"
            description="Actions and messaging stay direct so candidates know the next step immediately."
          >
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
