import { PlaceholderState } from "@/components/placeholder-state";
import { SectionCard } from "@/components/section-card";

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
          <SectionCard title="Recruiter inputs" kicker="Manual entry">
            <ul className="space-y-3 text-sm leading-7 text-slate-600">
              <li>Job title</li>
              <li>Interview language</li>
              <li>Job description</li>
            </ul>
          </SectionCard>

          <SectionCard
            title="Extracted editable sections"
            kicker="AI-assisted review"
          >
            <ul className="space-y-3 text-sm leading-7 text-slate-600">
              {extractedSections.map((section) => (
                <li key={section}>{section}</li>
              ))}
            </ul>
          </SectionCard>
        </div>
      </PlaceholderState>
    </div>
  );
}
