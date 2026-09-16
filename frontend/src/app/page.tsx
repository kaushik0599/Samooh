import { LandingNav } from "@/components/landing/LandingNav";
import { Hero } from "@/components/landing/Hero";
import { ProblemSection } from "@/components/landing/ProblemSection";
import { ConceptSection } from "@/components/landing/ConceptSection";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { SarthiSection } from "@/components/landing/SarthiSection";
import { GovernanceCards } from "@/components/landing/GovernanceCards";
import { ProductPreview } from "@/components/landing/ProductPreview";
import { Flywheel } from "@/components/landing/Flywheel";
import { UseCases } from "@/components/landing/UseCases";
import { WhyBlockchain } from "@/components/landing/WhyBlockchain";
import { FinalCta } from "@/components/landing/FinalCta";
import { LandingFooter } from "@/components/landing/LandingFooter";

/**
 * SAMOOH public marketing landing page. Structure + content pass only —
 * scroll-reveal / hover-motion polish is a later specialist pass (see
 * per-section components in src/components/landing/ for notes).
 */
export default function LandingPage() {
  return (
    <div className="relative isolate min-h-screen">
      <div className="landing-field" aria-hidden="true" />
      <LandingNav />
      <main>
        <Hero />
        <ProblemSection />
        <ConceptSection />
        <HowItWorks />
        <SarthiSection />
        <GovernanceCards />
        <ProductPreview />
        <Flywheel />
        <UseCases />
        <WhyBlockchain />
        <FinalCta />
      </main>
      <LandingFooter />
    </div>
  );
}
