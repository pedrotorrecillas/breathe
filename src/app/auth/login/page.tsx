import Link from "next/link";
import { redirect } from "next/navigation";

import { FormField } from "@/components/form-field";
import { buttonVariants } from "@/components/ui/button-variants";
import { Input } from "@/components/ui/input";
import { signInAction } from "@/app/auth/login/actions";
import {
  DEFAULT_AUTH_REDIRECT_PATH,
  GOOGLE_AUTH_PATH,
  sanitizeRedirectTarget,
} from "@/lib/auth/constants";
import { isGoogleAuthEnabled } from "@/lib/auth/google";
import { getCurrentRecruiter } from "@/lib/auth/server";
import { getAuthSetupState } from "@/lib/auth/store";
import { cn } from "@/lib/utils";

type LoginPageProps = {
  searchParams: Promise<{
    error?: string;
    logged_out?: string;
    next?: string;
  }>;
};

function messageForError(error: string | undefined) {
  if (error === "invalid_credentials") {
    return "We could not verify that email and password.";
  }

  if (error === "google_not_configured") {
    return "Google sign-in is not configured for this environment yet.";
  }

  if (error === "google_access_denied") {
    return "Google sign-in was canceled before access was granted.";
  }

  if (error === "google_state_mismatch") {
    return "Google sign-in could not be verified. Please try again.";
  }

  if (error === "google_unverified_email") {
    return "Google returned an email address that is not verified.";
  }

  if (error === "google_account_not_allowed") {
    return "That Google account does not match a recruiter account in this workspace.";
  }

  if (error === "google_signin_failed") {
    return "Google sign-in failed before we could create your recruiter session.";
  }

  return null;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const recruiter = await getCurrentRecruiter();
  const [{ error, logged_out: loggedOut, next }, setup] = await Promise.all([
    searchParams,
    getAuthSetupState(),
  ]);

  const redirectTarget = sanitizeRedirectTarget(
    next,
    DEFAULT_AUTH_REDIRECT_PATH,
  );

  if (recruiter) {
    redirect(redirectTarget);
  }

  const errorMessage = messageForError(error);
  const googleSignInHref =
    redirectTarget === DEFAULT_AUTH_REDIRECT_PATH
      ? GOOGLE_AUTH_PATH
      : `${GOOGLE_AUTH_PATH}?next=${encodeURIComponent(redirectTarget)}`;
  const googleEnabled = isGoogleAuthEnabled();

  return (
    <main className="brand-stage bg-background text-foreground relative flex min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(94,126,255,0.08),transparent_24%),radial-gradient(circle_at_bottom_right,_rgba(170,184,232,0.14),transparent_28%)]" />

      <div className="relative mx-auto flex w-full max-w-6xl flex-1 items-center">
        <div className="grid w-full gap-6 lg:grid-cols-[1.08fr_0.92fr]">
          <section className="brand-hero text-primary-foreground overflow-hidden rounded-[2rem] p-8 sm:p-10">
            <div className="flex h-full flex-col justify-between gap-10">
              <div className="space-y-6">
                <span className="brand-chip-inverse rounded-full px-3 py-1 font-mono text-[11px] tracking-[0.22em] uppercase">
                  Recruiter authentication
                </span>
                <div className="space-y-4">
                  <h1 className="max-w-xl text-[3rem] leading-[0.9] sm:text-[4rem]">
                    Secure company access for recruiter workspaces.
                  </h1>
                  <p className="text-primary-foreground/68 max-w-xl text-base leading-8">
                    Sign in with your company account to access recruiter
                    routes, create jobs, and keep session state attached to the
                    right company membership foundation.
                  </p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  googleEnabled
                    ? "Google and password login"
                    : "Password login today",
                  "Session persistence in Postgres",
                  "Company and membership foundation",
                ].map((item) => (
                  <div
                    key={item}
                    className="text-primary-foreground/78 rounded-[1rem] border border-white/10 bg-white/[0.04] p-4 text-sm"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="brand-surface rounded-[2rem] p-6 sm:p-8">
            <div className="mx-auto max-w-md space-y-6">
              <div className="space-y-2">
                <p className="text-muted-foreground font-mono text-[11px] tracking-[0.22em] uppercase">
                  Company login
                </p>
                <h2 className="text-foreground text-3xl">Sign in</h2>
                <p className="text-muted-foreground text-sm leading-7">
                  Use your recruiter account. Google sign-in maps onto the same
                  local company membership and session model.
                </p>
              </div>

              {errorMessage ? (
                <div className="rounded-[1rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {errorMessage}
                </div>
              ) : null}

              {loggedOut === "1" ? (
                <div className="rounded-[1rem] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  You have been signed out.
                </div>
              ) : null}

              {!setup.hasUsers ? (
                <div className="rounded-[1rem] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  Configure <code>AUTH_SEED_EMAIL</code> and{" "}
                  <code>AUTH_SEED_PASSWORD</code> to create the initial
                  recruiter account.
                </div>
              ) : null}

              <div className="space-y-3">
                <a
                  href={googleSignInHref}
                  className={cn(
                    buttonVariants({ size: "lg", variant: "outline" }),
                    "border-border bg-card text-foreground hover:bg-popover flex h-12 w-full items-center justify-center gap-3 rounded-[0.9rem]",
                    !googleEnabled && "pointer-events-none opacity-60",
                  )}
                  aria-disabled={!googleEnabled}
                >
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    className="h-5 w-5"
                  >
                    <path
                      fill="#EA4335"
                      d="M12 10.2v3.93h5.46c-.24 1.27-.96 2.35-2.04 3.07l3.3 2.56c1.92-1.77 3.03-4.38 3.03-7.5 0-.72-.06-1.42-.18-2.1H12Z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 22c2.7 0 4.97-.9 6.63-2.44l-3.3-2.56c-.92.62-2.08.99-3.33.99-2.56 0-4.72-1.73-5.49-4.05H3.1v2.64A9.99 9.99 0 0 0 12 22Z"
                    />
                    <path
                      fill="#4A90E2"
                      d="M6.51 13.94A6 6 0 0 1 6.2 12c0-.67.11-1.31.31-1.94V7.42H3.1A10 10 0 0 0 2 12c0 1.61.39 3.13 1.1 4.58l3.41-2.64Z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M12 5.96c1.47 0 2.8.51 3.84 1.51l2.88-2.88C16.96 2.95 14.69 2 12 2A9.99 9.99 0 0 0 3.1 7.42l3.41 2.64C7.28 7.69 9.44 5.96 12 5.96Z"
                    />
                  </svg>
                  Continue with Google
                </a>

                {!googleEnabled ? (
                  <p className="text-muted-foreground text-xs leading-6">
                    Add <code>AUTH_GOOGLE_CLIENT_ID</code> and{" "}
                    <code>AUTH_GOOGLE_CLIENT_SECRET</code> to enable Google
                    sign-in.
                  </p>
                ) : null}
              </div>

              <div className="relative py-1">
                <div className="absolute inset-0 flex items-center">
                  <div className="border-border w-full border-t" />
                </div>
                <div className="relative flex justify-center">
                  <span className="text-muted-foreground bg-[linear-gradient(180deg,rgba(251,247,239,0.96),rgba(239,232,221,0.92))] px-3 text-xs font-medium tracking-[0.18em] uppercase">
                    Or use password
                  </span>
                </div>
              </div>

              <form action={signInAction} className="space-y-4">
                <input type="hidden" name="next" value={redirectTarget} />

                <FormField
                  label="Work email"
                  hint="Use the recruiter account email configured for this environment."
                  required
                >
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="recruiting@company.com"
                    required
                  />
                </FormField>

                <FormField
                  label="Password"
                  hint="Password login remains available alongside Google sign-in."
                  required
                >
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    placeholder="••••••••••••"
                    required
                  />
                </FormField>

                <button
                  type="submit"
                  className={cn(
                    buttonVariants({ size: "lg" }),
                    "h-12 w-full rounded-[0.9rem]",
                  )}
                >
                  Sign in to recruiter
                </button>
              </form>

              <p className="text-muted-foreground text-sm leading-7">
                Need public candidate access instead? Head back to{" "}
                <Link
                  href="/"
                  className="text-foreground font-medium underline-offset-4 hover:underline"
                >
                  the home page
                </Link>
                .
              </p>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
