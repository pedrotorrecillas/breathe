import { PlaceholderState } from "@/components/placeholder-state";
import { DataPoint, DetailPanel, SectionCard } from "@/components/section-card";
import { LoadingState } from "@/components/shared-states";

const extractedSections = [
  "Job conditions",
  "Essential requirements",
  "Technical skills",
  "Interpersonal skills",
];

export default function NewJobPage() {
  return (
    <div className="flex flex-1 flex-col gap-6 px-6 py-6 md:px-8">
      <PlaceholderState
        eyebrow="BRE-7 Preview"
        title="New job configuration starts from recruiter inputs, not manual script authoring."
        description="This placeholder route establishes the URL and the expected data shape for the future job creation flow: recruiter inputs, extracted configuration sections, interview limits, and publish actions."
      >
        <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <SectionCard
            title="Recruiter inputs"
            kicker="Manual entry"
            description="The form panel holds the operational brief, language, and role context that seed the job draft."
            tone="strong"
          >
            <ul className="space-y-3 text-sm leading-7 text-slate-600">
              <li>Job title</li>
              <li>Interview language</li>
              <li>Job description</li>
            </ul>
          </SectionCard>

          <SectionCard
            title="Extracted editable sections"
            kicker="AI-assisted review"
            description="A report-style panel keeps the generated structure readable before the recruiter starts editing."
          >
            <LoadingState
              eyebrow="Shared loading"
              title="Extraction is preparing the first configuration draft."
              description="Use this while job conditions, requirements, and limits are still being assembled from the recruiter input."
            />
            <ul className="mt-6 space-y-3 text-sm leading-7 text-slate-600">
              {extractedSections.map((section) => (
                <li key={section}>{section}</li>
              ))}
            </ul>
          </SectionCard>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1fr_0.8fr]">
          <SectionCard
            title="Job draft metrics"
            kicker="Structured review"
            description="Cards and panels share the same spacing and density rules across configuration and recruiter review surfaces."
          >
            <div className="grid gap-3 sm:grid-cols-3">
              <DataPoint label="Sections" value={4} detail="Editable blocks" />
              <DataPoint
                label="Language"
                value="EN"
                detail="Interview locale"
              />
              <DataPoint
                label="Runtime"
                value="Voice"
                detail="Dispatch method"
              />
            </div>
          </SectionCard>

          <DetailPanel
            title="Lateral review panel"
            kicker="Operator context"
            description="Side panels stay available for quick AI hints, extracted risks, or publish checks without interrupting form work."
          >
            <div className="space-y-3 text-sm leading-7 text-slate-600">
              <p>Role is optimized for high-volume intake.</p>
              <p>
                Extraction separates conditions, hard requirements, and soft
                skills.
              </p>
              <p>
                Publish checks can attach here later without a new panel
                language.
              </p>
            </div>
          </DetailPanel>
        </div>
      </PlaceholderState>
    </div>
  );
}
