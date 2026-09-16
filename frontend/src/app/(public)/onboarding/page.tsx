"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@/lib/wallet/provider";
import { useAppState } from "@/lib/state/app-state";
import { submitOnboarding } from "@/lib/api/endpoints";
import { describeApiError } from "@/lib/api/client";
import { OnboardingShell } from "@/components/onboarding/OnboardingShell";
import { OnboardingProgress } from "@/components/onboarding/OnboardingProgress";
import { OnboardingQuestion } from "@/components/onboarding/OnboardingQuestion";
import { OptionCard } from "@/components/ui/OptionCard";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { LoadingState } from "@/components/ui/LoadingState";
import type { OnboardingPreference } from "@samooh/types";

const TOTAL_STEPS = 5;

const PREFERENCE_OPTIONS: { value: OnboardingPreference; label: string; description: string }[] = [
  { value: "JOIN", label: "Join a Samooh", description: "I want to find and join an existing collective." },
  { value: "START", label: "Start a Samooh", description: "I want to form a new collective." },
  { value: "EITHER", label: "Either works", description: "Show me what's possible either way." },
];

export default function OnboardingPage() {
  const { address } = useWallet();
  const { refreshOnboardingStatus } = useAppState();
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    category: "",
    region: "",
    needs: "",
    objectives: "",
    preference: null as OnboardingPreference | null,
    biggest_challenge: "",
  });

  useEffect(() => {
    if (!address) router.replace("/wallet");
  }, [address, router]);

  const next = () => setStep((s) => Math.min(TOTAL_STEPS, s + 1));
  const back = () => setStep((s) => Math.max(1, s - 1));

  const canAdvance =
    (step === 1 && form.category.trim().length > 0) ||
    step === 2 ||
    (step === 3 && form.region.trim().length > 0) ||
    (step === 4 && form.preference !== null) ||
    step === 5;

  const handleSubmit = async () => {
    if (!address || !form.preference) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await submitOnboarding({
        wallet_address: address,
        category: form.category,
        region: form.region,
        needs: form.needs.split("\n").map((n) => n.trim()).filter(Boolean),
        objectives: form.objectives.split("\n").map((o) => o.trim()).filter(Boolean),
        preference: form.preference,
        biggest_challenge: form.biggest_challenge || undefined,
      });
      refreshOnboardingStatus();
      // Show a brief transition instead of an instant jump — the discover
      // page runs its own first fetch right after this navigation.
      setIsRedirecting(true);
      router.push("/discover");
    } catch (err) {
      setError(describeApiError("Could not save your profile. Please try again.", err));
      setIsSubmitting(false);
    }
  };

  if (isRedirecting) {
    return (
      <OnboardingShell>
        <LoadingState label="Finding Samoohs that fit you..." />
      </OnboardingShell>
    );
  }

  return (
    <OnboardingShell>
      <OnboardingProgress step={step} totalSteps={TOTAL_STEPS} />

      {step === 1 && (
        <OnboardingQuestion question="What do you do?" hint="Your category or line of work.">
          <Input
            label="Category"
            hideLabel
            placeholder="e.g. Electronics manufacturing"
            value={form.category}
            onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
            autoFocus
          />
        </OnboardingQuestion>
      )}

      {step === 2 && (
        <OnboardingQuestion question="What are you looking for?" hint="Your needs and objectives, one per line. Optional.">
          <div className="space-y-3">
            <Textarea
              label="Needs"
              placeholder="e.g. Cheaper raw materials"
              value={form.needs}
              onChange={(e) => setForm((f) => ({ ...f, needs: e.target.value }))}
              autoFocus
            />
            <Textarea
              label="Objectives"
              placeholder="e.g. Collective procurement"
              value={form.objectives}
              onChange={(e) => setForm((f) => ({ ...f, objectives: e.target.value }))}
            />
          </div>
        </OnboardingQuestion>
      )}

      {step === 3 && (
        <OnboardingQuestion question="Where do you operate?" hint="City or region.">
          <Input
            label="Region"
            hideLabel
            placeholder="e.g. Pune, Maharashtra"
            value={form.region}
            onChange={(e) => setForm((f) => ({ ...f, region: e.target.value }))}
            autoFocus
          />
        </OnboardingQuestion>
      )}

      {step === 4 && (
        <OnboardingQuestion question="What are you looking to do?">
          <div role="radiogroup" className="space-y-2">
            {PREFERENCE_OPTIONS.map((option) => (
              <OptionCard
                key={option.value}
                label={option.label}
                description={option.description}
                selected={form.preference === option.value}
                onSelect={() => setForm((f) => ({ ...f, preference: option.value }))}
              />
            ))}
          </div>
        </OnboardingQuestion>
      )}

      {step === 5 && (
        <OnboardingQuestion question="Biggest challenge?" hint="Optional — helps Sarthi find better opportunities.">
          <Textarea
            label="Biggest challenge"
            hideLabel
            placeholder="What's slowing you down right now?"
            value={form.biggest_challenge}
            onChange={(e) => setForm((f) => ({ ...f, biggest_challenge: e.target.value }))}
          />
        </OnboardingQuestion>
      )}

      {error && (
        <p role="alert" className="mt-4 text-body-sm text-error">
          {error}
        </p>
      )}

      <div className="mt-8 flex justify-between">
        <Button variant="ghost" onClick={back} disabled={step === 1}>
          Back
        </Button>
        {step < TOTAL_STEPS ? (
          <Button onClick={next} disabled={!canAdvance}>
            Continue
          </Button>
        ) : (
          <Button onClick={handleSubmit} isLoading={isSubmitting} disabled={!form.preference}>
            Finish
          </Button>
        )}
      </div>
    </OnboardingShell>
  );
}
