import type { ReactNode } from "react";

/** Centered single-question layout shared by every onboarding step. */
export function OnboardingShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative isolate min-h-screen">
      <div className="landing-field" aria-hidden="true" />
      <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col justify-center px-6 py-12">
        <span className="landing-kicker mx-auto mb-6 w-fit">
          <span className="landing-kicker-dot" aria-hidden="true" />
          Your entry point
        </span>
        <div className="glass-panel p-6 sm:p-10">{children}</div>
      </main>
    </div>
  );
}
