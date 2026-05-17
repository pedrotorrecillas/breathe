import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service | Nacar",
  description: "Terms of Service for Nacar.",
};

const sections = [
  {
    title: "Use of the service",
    body: [
      "Nacar provides business-to-business software for candidate operations and hiring workflow automation. You may use the service only for lawful business purposes and in accordance with your agreement with Nacar.",
      "You are responsible for the users, systems, candidate data, workflow rules, and configurations you submit to the service.",
    ],
  },
  {
    title: "Customer responsibilities",
    body: [
      "Customers are responsible for obtaining required rights, notices, and consents for candidate and recruiter data processed through Nacar.",
      "Customers must not use Nacar to make unlawful employment decisions, send prohibited communications, or process sensitive information without an appropriate legal basis.",
    ],
  },
  {
    title: "Recruiter control",
    body: [
      "Nacar is designed to automate operational workflow steps and route exceptions for human review. Customers remain responsible for hiring decisions, policy settings, and compliance with employment, privacy, and communications laws.",
    ],
  },
  {
    title: "Accounts and access",
    body: [
      "You must keep account credentials secure and promptly notify us of any unauthorized access. We may suspend access if we believe use of the service creates a security, legal, or operational risk.",
    ],
  },
  {
    title: "Intellectual property",
    body: [
      "Nacar and its software, workflows, designs, and documentation are owned by Nacar or its licensors. Customers retain their rights to customer data submitted to the service.",
    ],
  },
  {
    title: "Confidentiality",
    body: [
      "Each party may receive confidential business, technical, or operational information from the other. Confidential information should be protected with reasonable care and used only for the purpose of the relationship.",
    ],
  },
  {
    title: "Disclaimers",
    body: [
      "The website and any beta or evaluation services are provided on an as-is basis unless otherwise agreed in writing. Production service commitments, if any, will be set out in a separate written agreement.",
    ],
  },
  {
    title: "Limitation of liability",
    body: [
      "To the maximum extent permitted by law, Nacar will not be liable for indirect, incidental, special, consequential, or punitive damages arising from use of the website or service.",
    ],
  },
  {
    title: "Changes",
    body: [
      "We may update these terms from time to time. If changes are material, we will take reasonable steps to notify customers or users as appropriate.",
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

export default function TermsPage() {
  return (
    <main className="brand-stage bg-background text-foreground min-h-screen">
      <header className="border-border bg-background/90 border-b">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
          <Link href="/">
            <Logo />
          </Link>
          <Link
            href="/privacy"
            className="text-muted-foreground hover:text-foreground font-mono text-[11px] font-medium tracking-[0.14em] uppercase"
          >
            Privacy
          </Link>
        </div>
      </header>

      <article className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-20">
        <p className="text-muted-foreground font-mono text-[11px] font-medium tracking-[0.14em] uppercase">
          Legal
        </p>
        <h1 className="mt-5 text-[3.2rem] leading-none font-medium sm:text-[5rem]">
          Terms of Service
        </h1>
        <p className="text-muted-foreground mt-5 max-w-2xl text-base leading-7">
          Last updated: May 17, 2026. These terms apply to the Nacar website and
          early business-to-business software services unless a separate written
          agreement applies.
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
            For questions about these terms, contact{" "}
            <a
              className="text-foreground underline underline-offset-4"
              href="mailto:legal@nacar.ai"
            >
              legal@nacar.ai
            </a>
            .
          </p>
        </section>
      </article>
    </main>
  );
}
