import Link from "next/link";
import { isDemoMode } from "@/lib/demo/config";
import { HeroVisual } from "./HeroVisual";

export function Hero() {
  const enterHref = isDemoMode() ? "/overview" : "/wallet";

  return (
    <section className="relative mx-auto flex max-w-6xl flex-col gap-12 px-6 py-16 sm:py-20 md:py-28 lg:flex-row lg:items-center">
      <div className="flex flex-col gap-6 lg:w-1/2">
        <span className="landing-kicker w-fit">
          <span className="landing-kicker-dot" aria-hidden="true" />
          Collective economic coordination
        </span>
        <h1 className="text-hero text-text-primary">
          One alone is small.
          <br />
          Together, we become an economy.
        </h1>
        <p className="max-w-lg text-body-lg text-text-secondary">
          Coordinate resources. Pool capital. Make decisions together. Execute transparently.
        </p>
        <div className="flex flex-wrap items-center gap-4 pt-2">
          <Link href={enterHref} className="btn-glass">
            Enter SAMOOH&nbsp;&nbsp;→
          </Link>
          <a href="#how-it-works" className="btn-glass-secondary">
            See How It Works
          </a>
        </div>
        <p className="pt-1 text-caption uppercase tracking-[0.08em] text-text-secondary/80">
          Sarthi recommends · Samooh decides · Smart contracts execute
        </p>
      </div>

      <div className="flex justify-center lg:w-1/2">
        <div className="glass-panel w-full max-w-2xl p-6">
          <HeroVisual />
        </div>
      </div>
    </section>
  );
}
