import { Card } from "@/components/ui/Card";
import { ProposalCard } from "@/components/proposals/ProposalCard";
import { MemberRow } from "@/components/members/MemberRow";
import { TreasuryCard } from "@/components/treasury/TreasuryCard";
import { SarthiRecommendation } from "@/components/sarthi/SarthiRecommendation";
import {
  DEMO_FEATURED_INSIGHT,
  DEMO_MEMBERS,
  DEMO_PROPOSALS,
  DEMO_TREASURY,
} from "@/lib/demo/data";
import { ScrollReveal } from "./ScrollReveal";

/**
 * Reuses the real dashboard components with the same fixture data Demo
 * Mode itself uses (frontend/src/lib/demo/data.ts) — never hand-rolled
 * mockup markup, so this preview can't drift from what the product
 * actually looks like or imply a real transaction occurred.
 */
export function ProductPreview() {
  return (
    <section id="product" className="relative border-t border-border/60 scroll-mt-14">
      <div className="mx-auto max-w-6xl px-6 py-16 sm:py-20 md:py-28">
        <ScrollReveal className="flex flex-col gap-4 lg:max-w-2xl">
          <span className="landing-kicker w-fit">
            <span className="landing-kicker-dot" aria-hidden="true" />
            The workspace
          </span>
          <h2 className="text-display text-text-primary">From coordination to execution.</h2>
          <p className="text-body-lg text-text-secondary">
            Everything your collective needs to make decisions and act on them.
          </p>
        </ScrollReveal>

        <ScrollReveal
          variant="fade-scale"
          delayMs={80}
          className="glass-panel mt-12 overflow-hidden"
        >
          <div
            className="flex items-center gap-3 border-b border-[color:var(--glass-border)] px-4 py-3"
            aria-hidden="true"
          >
            <span className="flex gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-border" />
              <span className="h-2.5 w-2.5 rounded-full bg-border" />
              <span className="h-2.5 w-2.5 rounded-full bg-border" />
            </span>
            <span className="text-caption text-text-primary">app.samooh.io/overview</span>
          </div>

          {/*
            Decorative preview, not a real navigation surface — ProposalCard
            normally links to /proposals/[id], which would either need a
            connected wallet (Demo Mode off) or coincidentally resolve inside
            Demo Mode. Rather than depend on that, this block is inert:
            pointer-events-none stops clicks, aria-hidden removes it from the
            accessibility tree (the heading/copy above already describes the
            section in words, so nothing is lost for screen-reader users).
          */}
          <div
            className="pointer-events-none grid select-none gap-4 p-4 md:grid-cols-3 md:p-6"
            aria-hidden="true"
          >
            <div className="flex flex-col gap-4 md:col-span-2">
              <SarthiRecommendation insight={DEMO_FEATURED_INSIGHT} />
              <div className="grid gap-4 sm:grid-cols-2">
                {DEMO_PROPOSALS.slice(0, 2).map((proposal) => (
                  <ProposalCard key={proposal.id} proposal={proposal} />
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <TreasuryCard treasury={DEMO_TREASURY} isDemo />
              <Card className="p-0">
                <p className="border-b border-border px-4 py-3 text-label text-text-secondary">
                  Members
                </p>
                <div className="px-4">
                  {DEMO_MEMBERS.slice(0, 2).map((member) => (
                    <MemberRow key={member.id} member={member} />
                  ))}
                </div>
              </Card>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
