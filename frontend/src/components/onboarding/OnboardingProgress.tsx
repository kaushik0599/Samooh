import { Progress } from "@/components/ui/Progress";

export function OnboardingProgress({ step, totalSteps }: { step: number; totalSteps: number }) {
  return (
    <div className="mb-8 flex items-end justify-between gap-4">
      <div className="flex-1">
        <Progress value={step} max={totalSteps} />
      </div>
      <p className="shrink-0 text-caption font-semibold tracking-widest text-text-secondary">
        {step} / {totalSteps}
      </p>
    </div>
  );
}
