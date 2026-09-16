import Link from "next/link";
import { ScrollReveal } from "./ScrollReveal";

export function FinalCta() {
  return (
    <section className="relative overflow-hidden border-t border-border/60">
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 h-[420px] w-[min(720px,90vw)] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-3xl"
        aria-hidden="true"
      />
      <ScrollReveal
        as="div"
        className="relative mx-auto flex max-w-6xl flex-col items-center gap-8 px-6 py-20 text-center sm:py-24 md:py-32"
      >
        <span className="landing-kicker w-fit">
          <span className="landing-kicker-dot" aria-hidden="true" />
          Enter the collective
        </span>

        <h2 className="text-display text-text-primary">Build something bigger than yourself.</h2>

        <p className="text-body-lg text-text-secondary">
          Bring people together.
          <br />
          Pool what you have.
          <br />
          Decide together.
          <br />
          Build together.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link href="/samooh/create" className="btn-glass">
            Start a Samooh&nbsp;&nbsp;→
          </Link>
          <Link href="/discover" className="btn-glass-secondary">
            Explore SAMOOH
          </Link>
        </div>

        <p className="text-caption uppercase tracking-[0.08em] text-text-secondary/80">
          Sarthi recommends · Samooh decides · Smart contracts execute
        </p>
      </ScrollReveal>
    </section>
  );
}
