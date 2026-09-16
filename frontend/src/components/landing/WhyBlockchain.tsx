import { ArrowRight } from "lucide-react";
import { ScrollReveal } from "./ScrollReveal";

const TRADITIONAL = ["Participants", "Central Administrator", "Database", "Decision", "Execution"];
const SAMOOH_FLOW = ["Participants", "Governance", "Smart Contract", "Transparent Execution"];

function FlowRow({ steps }: { steps: string[] }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {steps.map((step, i) => (
        <div key={step} className="flex items-center gap-2">
          <span className="glass-pill text-text-primary">{step}</span>
          {i < steps.length - 1 && (
            <ArrowRight className="h-4 w-4 shrink-0 text-text-secondary" aria-hidden="true" />
          )}
        </div>
      ))}
    </div>
  );
}

export function WhyBlockchain() {
  return (
    <section className="relative border-t border-border/60">
      <div className="mx-auto max-w-6xl px-6 py-16 sm:py-20 md:py-28">
        <ScrollReveal className="flex flex-col gap-4">
          <span className="landing-kicker w-fit">
            <span className="landing-kicker-dot" aria-hidden="true" />
            Why blockchain
          </span>
          <h2 className="text-display text-text-primary">Why blockchain?</h2>
        </ScrollReveal>

        <ScrollReveal delayMs={60} className="glass-panel mt-10 flex flex-col gap-8 p-8">
          <div className="flex flex-col gap-3">
            <p className="text-label tracking-widest text-text-secondary">TRADITIONAL</p>
            <FlowRow steps={TRADITIONAL} />
          </div>
          <div className="flex flex-col gap-3">
            <p className="text-label tracking-widest text-primary">SAMOOH</p>
            <FlowRow steps={SAMOOH_FLOW} />
          </div>
        </ScrollReveal>

        <ScrollReveal
          as="p"
          delayMs={120}
          className="mt-12 max-w-2xl text-h4 font-medium leading-snug text-text-primary"
        >
          Blockchain is infrastructure for trust where collective decisions and shared resources
          need to be verifiable.
        </ScrollReveal>
      </div>
    </section>
  );
}
