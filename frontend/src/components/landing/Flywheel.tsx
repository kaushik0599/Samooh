import { ScrollReveal } from "./ScrollReveal";

const CENTER = { x: 340, y: 200 };
const RADIUS = 130;

const STAGES = [
  { label: "More Participants", x: CENTER.x, y: CENTER.y - RADIUS, anchor: "middle", dy: -16 },
  {
    label: "More Collective Resources",
    x: CENTER.x + RADIUS,
    y: CENTER.y,
    anchor: "start",
    dx: 14,
  },
  { label: "Better Opportunities", x: CENTER.x, y: CENTER.y + RADIUS, anchor: "middle", dy: 26 },
  { label: "Better Outcomes", x: CENTER.x - RADIUS, y: CENTER.y, anchor: "end", dx: -14 },
] as const;

export function Flywheel() {
  return (
    <section className="relative border-t border-border/60 px-6 py-16 sm:py-20 md:py-28">
      <ScrollReveal as="div" className="mx-auto flex max-w-6xl flex-col items-center gap-10 text-center">
        <span className="landing-kicker w-fit">
          <span className="landing-kicker-dot" aria-hidden="true" />
          The loop
        </span>
        <h2 className="text-display text-text-primary">The economic flywheel</h2>

        <div className="glass-panel w-full max-w-2xl p-8">
        <svg
          viewBox="0 0 700 400"
          className="h-auto w-full max-w-2xl"
          role="img"
          aria-label="A loop: more participants lead to more collective resources, leading to better opportunities, leading to better outcomes, which brings more participants"
        >
          <g aria-hidden="true">
            <circle
              cx={CENTER.x}
              cy={CENTER.y}
              r={RADIUS}
              fill="none"
              className="stroke-border"
              strokeWidth="1.5"
              strokeDasharray="2 6"
            />
            <circle cx={CENTER.x} cy={CENTER.y} r="46" className="fill-primary" />
          </g>

          <text
            x={CENTER.x}
            y={CENTER.y + 5}
            textAnchor="middle"
            className="fill-white text-[13px] font-semibold tracking-tight"
          >
            SAMOOH
          </text>

          {STAGES.map((stage) => (
            <g key={stage.label}>
              <circle
                cx={stage.x}
                cy={stage.y}
                r="6"
                className="fill-accent-bg stroke-primary"
                strokeWidth="1.5"
                aria-hidden="true"
              />
              <text
                x={stage.x + ("dx" in stage ? stage.dx : 0)}
                y={stage.y + ("dy" in stage ? stage.dy : 4)}
                textAnchor={stage.anchor}
                className="fill-current text-[12px] font-medium text-text-primary"
              >
                {stage.label}
              </text>
            </g>
          ))}
        </svg>
        </div>

        <p className="max-w-xl text-body-lg text-text-secondary">
          Every new participant can increase the economic surface area of the collective.
        </p>
      </ScrollReveal>
    </section>
  );
}
