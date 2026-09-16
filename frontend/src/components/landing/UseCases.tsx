import { ShoppingCart, Wheat, Store, PenTool, Building2, Factory } from "lucide-react";
import { ScrollReveal } from "./ScrollReveal";

const USE_CASES = [
  {
    icon: ShoppingCart,
    title: "Collective Procurement",
    body: "Independent buyers pool orders to negotiate bulk pricing and shared suppliers.",
  },
  {
    icon: Wheat,
    title: "Producer Collectives",
    body: "Farmers and small producers coordinate output, storage, and sale terms together.",
  },
  {
    icon: Store,
    title: "Local Commerce",
    body: "Neighborhood merchants share logistics, marketing spend, and negotiating leverage.",
  },
  {
    icon: PenTool,
    title: "Creator / Freelancer Collectives",
    body: "Independent creators pool clients, tools, and revenue-sharing arrangements.",
  },
  {
    icon: Building2,
    title: "Community Infrastructure",
    body: "Residents fund and govern shared infrastructure they all rely on.",
  },
  {
    icon: Factory,
    title: "Small Manufacturing",
    body: "Workshops share equipment, raw-material sourcing, and maintenance costs.",
  },
];

export function UseCases() {
  return (
    <section id="use-cases" className="relative border-t border-border/60 scroll-mt-14">
      <div className="mx-auto max-w-6xl px-6 py-16 sm:py-20 md:py-28">
        <ScrollReveal className="flex flex-col gap-4">
          <span className="landing-kicker w-fit">
            <span className="landing-kicker-dot" aria-hidden="true" />
            Where SAMOOH fits
          </span>
          <h2 className="text-display text-text-primary">Where SAMOOH fits</h2>
        </ScrollReveal>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {USE_CASES.map(({ icon: Icon, title, body }, i) => (
            <ScrollReveal key={title} delayMs={i * 50}>
              <div className="glass-panel glass-panel-hover flex h-full flex-col gap-3 p-6">
                <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
                <h3 className="text-body font-medium text-text-primary">{title}</h3>
                <p className="text-body-sm text-text-secondary">{body}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
