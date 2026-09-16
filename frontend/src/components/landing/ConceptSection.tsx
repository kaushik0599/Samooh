import { Gavel, PieChart, Layers, TrendingUp } from "lucide-react";
import { ScrollReveal } from "./ScrollReveal";

const FEATURES = [
  {
    icon: Gavel,
    title: "GOVERN",
    body: "Collective decisions through transparent governance.",
  },
  {
    icon: PieChart,
    title: "OWN",
    body: "Shared economic participation and ownership.",
  },
  {
    icon: Layers,
    title: "POOL",
    body: "Coordinate collective resources and treasury.",
  },
  {
    icon: TrendingUp,
    title: "GROW",
    body: "Turn collective intelligence into collective opportunity.",
  },
];

export function ConceptSection() {
  return (
    <section className="relative mx-auto max-w-6xl px-6 py-16 sm:py-20 md:py-28">
      <ScrollReveal className="flex flex-col gap-6 lg:max-w-2xl">
        <span className="landing-kicker w-fit">
          <span className="landing-kicker-dot" aria-hidden="true" />
          The collective layer
        </span>
        <h2 className="text-display text-text-primary">
          A Samooh is more than a group.
          <br />
          It&apos;s a shared economic system.
        </h2>
        <p className="text-body-lg text-text-secondary">
          SAMOOH enables independent participants to coordinate, contribute, govern, allocate
          shared resources, make collective decisions, and execute approved actions
          transparently.
        </p>
      </ScrollReveal>

      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {FEATURES.map(({ icon: Icon, title, body }, i) => (
          <ScrollReveal key={title} delayMs={i * 60}>
            <div className="glass-panel glass-panel-hover flex h-full flex-col gap-3 p-6">
              <span className="flex h-10 w-10 items-center justify-center rounded-[13px] border border-[color:var(--glass-border)] bg-[color:var(--glass-bg)] text-primary">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <h3 className="text-label tracking-widest text-text-primary">{title}</h3>
              <p className="text-body-sm text-text-secondary">{body}</p>
            </div>
          </ScrollReveal>
        ))}
      </div>
    </section>
  );
}
