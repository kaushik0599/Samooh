import { Sparkles, ArrowDown } from "lucide-react";
import { ScrollReveal } from "./ScrollReveal";

const FLOW = [
  {
    kind: "sarthi",
    label: "SARTHI INSIGHT",
    text: "5 members have overlapping procurement requirements.",
  },
  {
    kind: "sarthi",
    label: "RECOMMENDATION",
    text: "Create a collective procurement proposal.",
  },
  { kind: "human", label: "CREATE PROPOSAL", text: null },
  { kind: "human", label: "MEMBERS VOTE", text: null },
  { kind: "human", label: "SMART CONTRACT EXECUTES", text: null },
] as const;

export function SarthiSection() {
  return (
    <section id="sarthi" className="relative mx-auto max-w-6xl px-6 py-16 sm:py-20 md:py-28 scroll-mt-14">
      <div className="grid gap-8 lg:grid-cols-2 lg:items-start">
        <ScrollReveal className="glass-panel flex flex-col gap-5 p-8 lg:min-h-[360px]">
          <span className="text-label tracking-[0.15em] text-cyan">SARTHI / INTELLIGENCE LAYER</span>
          <h2 className="text-display text-text-primary">Every collective needs a guide.</h2>
          <p className="flex items-center gap-2 text-h4 text-primary">
            <Sparkles className="h-5 w-5" aria-hidden="true" />
            Meet Sarthi.
          </p>
          <p className="max-w-lg text-body-lg text-text-secondary">
            Sarthi is SAMOOH&apos;s intelligence layer. It can identify opportunities,
            bottlenecks, unused resources, collaboration opportunities, procurement
            opportunities, governance issues, and growth opportunities.
          </p>

          <p className="mt-2 text-h3 font-semibold leading-snug text-text-primary">
            Sarthi recommends.
            <br />
            Samooh decides.
            <br />
            Smart contracts execute.
          </p>
        </ScrollReveal>

        <ol className="flex flex-col items-stretch gap-2">
          {FLOW.map((step, i) => (
            <ScrollReveal
              key={step.label}
              as="li"
              delayMs={i * 60}
              className="flex flex-col items-center gap-2"
            >
              <div
                className={
                  step.kind === "sarthi"
                    ? "glass-panel w-full border-primary/25 px-4 py-3"
                    : "w-full rounded-xl border border-border bg-surface px-4 py-3"
                }
              >
                <p
                  className={
                    step.kind === "sarthi"
                      ? "text-label tracking-widest text-cyan"
                      : "text-label tracking-widest text-text-secondary"
                  }
                >
                  {step.label}
                </p>
                {step.text && <p className="mt-1 text-body-sm text-text-primary">{step.text}</p>}
              </div>
              {i < FLOW.length - 1 && (
                <ArrowDown className="h-4 w-4 text-text-secondary" aria-hidden="true" />
              )}
            </ScrollReveal>
          ))}
        </ol>
      </div>
    </section>
  );
}
