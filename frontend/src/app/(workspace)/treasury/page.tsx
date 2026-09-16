import { PageHeader } from "@/components/ui/PageHeader";
import { TreasuryCard } from "@/components/treasury/TreasuryCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { Landmark } from "lucide-react";
import { isDemoMode } from "@/lib/demo/config";
import { DEMO_TREASURY } from "@/lib/demo/data";

/**
 * KNOWN GAP (see Sprint 0 report): no API route exposes treasury balance
 * or history to the frontend yet. This page is deliberately framed in
 * business terms — "on-chain treasury" — never as if POL/MATIC were this
 * Samooh's operating currency, and never with a fabricated business-currency
 * (e.g. INR) valuation, since none is modeled anywhere in this codebase.
 * It states plainly that the live connection isn't wired up rather than
 * showing a bare "Unavailable". Chain id / contract-address detail lives in
 * Settings → Blockchain, kept out of this business-facing page.
 *
 * In Demo Mode the balance shown is fixture data (see lib/demo/data.ts),
 * never a real chain read — TreasuryCard's own copy always makes that clear.
 */
export default function TreasuryPage() {
  const demo = isDemoMode();

  return (
    <div>
      <PageHeader
        eyebrow="SAMOOH / Treasury"
        title="Treasury"
        description="Funds held and executed on behalf of this Samooh."
      />
      <div className="mt-8 max-w-sm">
        <TreasuryCard treasury={demo ? DEMO_TREASURY : null} isDemo={demo} />
      </div>
      {!demo && (
        <div className="mt-8">
          <EmptyState
            icon={<Landmark className="h-6 w-6" aria-hidden="true" />}
            title="Live balance and history aren't connected yet"
            description="Balance is meant to be read directly from the blockchain treasury contract, not entered manually — that connection is awaiting blockchain integration. Contract and network details are in Settings → Blockchain."
          />
        </div>
      )}
    </div>
  );
}
