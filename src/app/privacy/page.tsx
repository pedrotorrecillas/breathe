import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy | Nacar",
  description: "Privacy Policy for Nacar.",
};

const sections = [
  {
    title: "Information we collect",
    body: [
      "We collect business contact information such as name, work email, company, role, and any information you provide when requesting a demo or contacting us.",
      "When customers use Nacar, we may process candidate, recruiter, job, workflow, and hiring operations data on behalf of that customer under the relevant agreement.",
      "We may collect technical information such as IP address, device information, browser type, pages visited, and basic analytics events to operate and improve the website and service.",
    ],
  },
  {
    title: "How we use information",
    body: [
      "We use information to respond to inquiries, provide and improve the service, operate candidate workflow automation, maintain security, troubleshoot issues, and meet legal or contractual obligations.",
      "We do not sell personal information. We do not use customer hiring data to build unrelated advertising profiles.",
    ],
  },
  {
    title: "Service providers",
    body: [
      "We may use trusted service providers for hosting, analytics, communications, authentication, customer support, and infrastructure. These providers are authorized to process information only as needed to provide their services to us.",
    ],
  },
  {
    title: "Customer data",
    body: [
      "For customer hiring data, Nacar generally acts as a processor or service provider. The customer remains responsible for determining what data is submitted to the service and for providing required notices to candidates and users.",
    ],
  },
  {
    title: "Retention",
    body: [
      "We keep information only for as long as reasonably necessary for the purposes described in this policy, unless a longer period is required by law, contract, security, or legitimate business needs.",
    ],
  },
  {
    title: "Security",
    body: [
      "We use administrative, technical, and organizational measures designed to protect information. No system is perfectly secure, but we work to keep access limited, attributable, and appropriate to the use of the service.",
    ],
  },
  {
    title: "Your rights",
    body: [
      "Depending on your location, you may have rights to access, correct, delete, restrict, or object to certain processing of your personal information. To make a request, contact us at privacy@nacar.ai.",
    ],
  },
  {
    title: "Changes",
    body: [
      "We may update this policy from time to time. If changes are material, we will take reasonable steps to notify customers or website users as appropriate.",
    ],
  },
] as const;

function Logo() {
  return (
    <span className="flex items-center gap-2.5" aria-label="Nacar">
      <Image
        src="/brand/nacar-mark.svg"
        alt=""
        width={24}
        height={42}
        className="h-8 w-auto"
      />
      <span className="brand-wordmark text-[1.35rem] leading-none font-medium lowercase">
        nacar
      </span>
    </span>
  );
}

export default function PrivacyPage() {
  return (
    <main className="brand-stage bg-background text-foreground min-h-screen">
      <header className="border-border bg-background/90 border-b">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
          <Link href="/">
            <Logo />
          </Link>
          <Link
            href="/terms"
            className="text-muted-foreground hover:text-foreground font-mono text-[11px] font-medium tracking-[0.14em] uppercase"
          >
            Terms
          </Link>
        </div>
      </header>

      <article className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-20">
        <p className="text-muted-foreground font-mono text-[11px] font-medium tracking-[0.14em] uppercase">
          Legal
        </p>
        <h1 className="mt-5 text-[3.2rem] leading-none font-medium sm:text-[5rem]">
          Privacy Policy
        </h1>
        <p className="text-muted-foreground mt-5 max-w-2xl text-base leading-7">
          Last updated: May 17, 2026. This policy explains how Nacar
          Intelligence handles personal information through our website and
          business-to-business software services.
        </p>

        <div className="divide-border border-border mt-12 divide-y border-y">
          {sections.map((section) => (
            <section
              key={section.title}
              className="grid gap-6 py-8 md:grid-cols-[16rem_1fr]"
            >
              <h2 className="text-2xl leading-tight font-medium">
                {section.title}
              </h2>
              <div className="space-y-4">
                {section.body.map((paragraph) => (
                  <p
                    key={paragraph}
                    className="text-muted-foreground text-base leading-7"
                  >
                    {paragraph}
                  </p>
                ))}
              </div>
            </section>
          ))}
        </div>

        <section className="border-border bg-card mt-10 border p-6">
          <h2 className="text-2xl leading-tight font-medium">Contact</h2>
          <p className="text-muted-foreground mt-3 text-base leading-7">
            For privacy questions or requests, contact{" "}
            <a
              className="text-foreground underline underline-offset-4"
              href="mailto:privacy@nacar.ai"
            >
              privacy@nacar.ai
            </a>
            .
          </p>
        </section>
      </article>
    </main>
  );
}
