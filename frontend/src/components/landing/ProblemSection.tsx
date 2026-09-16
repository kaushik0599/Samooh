import { ScrollReveal } from "./ScrollReveal";

const FRAGMENTS = [
  "Purchasing power",
  "Capital",
  "Knowledge",
  "Market access",
  "Bargaining power",
  "Decision-making",
];

export function ProblemSection() {
  return (
    <section className="relative border-t border-border/60">
      <div className="mx-auto grid max-w-6xl gap-12 px-6 py-16 sm:py-20 md:py-28 lg:grid-cols-2 lg:items-center">
        <ScrollReveal className="flex flex-col gap-6">
          <span className="landing-kicker w-fit">
            <span className="landing-kicker-dot" aria-hidden="true" />
            The problem
          </span>
          <h2 className="text-display text-text-primary">Individually, we&apos;re fragmented.</h2>
          <p className="max-w-lg text-body-lg text-text-secondary">
            Independent participants each carry a piece of what a collective needs — but on
            their own, that piece rarely goes far. Purchasing power stays small. Capital stays
            siloed. Knowledge, market access, bargaining power, and decision-making all stay
            fragmented across people who are ultimately trying to solve the same problems.
          </p>

          <ul className="flex flex-wrap gap-2 pt-2">
            {FRAGMENTS.map((item) => (
              <li key={item} className="glass-pill text-text-secondary">
                {item}
              </li>
            ))}
          </ul>

          <p className="pt-6 text-h3 font-semibold text-text-primary">
            Together, the same resources become leverage.
          </p>
        </ScrollReveal>

        <ScrollReveal className="flex justify-center" delayMs={100} variant="fade-scale">
          <div className="glass-panel p-8">
            <FragmentedNodesVisual />
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}

/** Scattered independent nodes transitioning into a coordinated cluster. */
function FragmentedNodesVisual() {
  const pairs = [
    { from: { x: 30, y: 30 }, to: { x: 300, y: 100 } },
    { from: { x: 90, y: 70 }, to: { x: 330, y: 130 } },
    { from: { x: 20, y: 130 }, to: { x: 300, y: 160 } },
    { from: { x: 80, y: 180 }, to: { x: 340, y: 90 } },
    { from: { x: 40, y: 230 }, to: { x: 320, y: 175 } },
    { from: { x: 110, y: 20 }, to: { x: 350, y: 140 } },
  ];

  return (
    <svg
      viewBox="0 0 400 260"
      className="h-auto w-full max-w-md"
      role="img"
      aria-label="Many scattered, independent nodes transitioning into one coordinated network"
    >
      <g aria-hidden="true">
        {pairs.map((pair, i) => (
          <line
            key={`link-${i}`}
            x1={pair.from.x}
            y1={pair.from.y}
            x2={pair.to.x}
            y2={pair.to.y}
            className="stroke-border"
            strokeWidth="1"
            strokeDasharray="3 4"
          />
        ))}

        {pairs.map((pair, i) => (
          <circle
            key={`s-${i}`}
            cx={pair.from.x}
            cy={pair.from.y}
            r="5"
            className="fill-surface stroke-text-secondary"
            strokeWidth="1.5"
          />
        ))}

        {pairs.map((pair, i) => (
          <circle key={`c-${i}`} cx={pair.to.x} cy={pair.to.y} r="6" className="fill-primary" />
        ))}
      </g>
    </svg>
  );
}
