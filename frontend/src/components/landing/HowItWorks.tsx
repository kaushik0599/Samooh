import { ScrollReveal } from "./ScrollReveal";

const STEPS = [
  { n: "01", label: "Form a Samooh" },
  { n: "02", label: "Bring participants together" },
  { n: "03", label: "Pool resources" },
  { n: "04", label: "Create a proposal" },
  { n: "05", label: "Members vote" },
  { n: "06", label: "Smart contracts execute" },
  { n: "07", label: "Collective outcome" },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="relative border-t border-border/60 scroll-mt-14">
      <div className="mx-auto max-w-6xl px-6 py-16 sm:py-20 md:py-28">
        <ScrollReveal className="flex flex-col gap-4">
          <span className="landing-kicker w-fit">
            <span className="landing-kicker-dot" aria-hidden="true" />
            How SAMOOH works
          </span>
          <h2 className="text-display text-text-primary">How it works</h2>
        </ScrollReveal>

        <ol className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, i) => (
            <ScrollReveal key={step.n} as="li" delayMs={i * 45}>
              <div className="glass-panel glass-panel-hover flex h-full flex-col gap-2 p-5">
                <span className="text-h2 font-bold text-primary/35">{step.n}</span>
                <span className="text-body font-medium text-text-primary">{step.label}</span>
              </div>
            </ScrollReveal>
          ))}
        </ol>

        <ScrollReveal
          as="p"
          className="mt-16 text-h3 font-semibold leading-snug text-text-primary"
        >
          People decide.
          <br />
          Code enforces.
          <br />
          Everyone can verify.
        </ScrollReveal>
      </div>
    </section>
  );
}
