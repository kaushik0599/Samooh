import type { ReactNode } from "react";

export interface OnboardingQuestionProps {
  question: string;
  hint?: string;
  children: ReactNode;
}

/** One onboarding question + its input control (target: 30-60s total, per docs/API_SPEC.md). */
export function OnboardingQuestion({ question, hint, children }: OnboardingQuestionProps) {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-h1 text-text-primary">{question}</h1>
        {hint && <p className="mt-2 text-body text-text-secondary">{hint}</p>}
      </div>
      {children}
    </div>
  );
}
