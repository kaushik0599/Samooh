import { Vote, Landmark, Users } from "lucide-react";
import { ScrollReveal } from "./ScrollReveal";

const CARDS = [
  {
    icon: Vote,
    title: "GOVERNANCE",
    lead: "Decisions belong to the collective.",
    body: "Voting, quorum and approval rules are enforced through smart contracts.",
  },
  {
    icon: Landmark,
    title: "TREASURY",
    lead: "Collective resources, collectively controlled.",
    body: "Treasury actions require authorized governance execution.",
  },
  {
    icon: Users,
    title: "OWNERSHIP",
    lead: "Participation becomes economic coordination.",
    body: "Ownership here means a real say and a real stake in outcomes — not a security or a tradeable token.",
  },
];

export function GovernanceCards() {
  return (
    <section className="relative border-t border-border/60">
      <div className="mx-auto max-w-6xl px-6 py-16 sm:py-20 md:py-28">
        <ScrollReveal className="mb-10 flex flex-col gap-4 text-center">
          <span className="landing-kicker mx-auto w-fit">
            <span className="landing-kicker-dot" aria-hidden="true" />
            The decision loop
          </span>
          <h2 className="text-display text-text-primary">Intelligence recommends. People decide.</h2>
        </ScrollReveal>

        <div className="grid gap-4 md:grid-cols-3">
          {CARDS.map(({ icon: Icon, title, lead, body }, i) => (
            <ScrollReveal key={title} delayMs={i * 60}>
              <div className="glass-panel glass-panel-hover flex h-full flex-col gap-3 p-7">
                <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
                <p className="text-label tracking-widest text-text-secondary">{title}</p>
                <h3 className="text-body font-medium text-text-primary">{lead}</h3>
                <p className="text-body-sm text-text-secondary">{body}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
