import { Landmark } from "lucide-react";
import { Card } from "@/components/ui/Card";
import type { TreasuryState } from "@samooh/types";

/**
 * KNOWN GAP (see Sprint 0 report): there is no `GET` API route exposing
 * `TreasuryState` to the frontend today — the backend's
 * `getTreasuryBalance()` (src/lib/blockchain) is only used internally by
 * Sarthi. This component is a presentational boundary only; wire it to a
 * real fetch once such a route exists.
 *
 * Deliberately framed as "on-chain treasury" rather than a bare balance —
 * POL is the chain's native unit, not this Samooh's business currency, so
 * it only ever appears labeled as an on-chain reading, never implied to be
 * a business-facing value. No business-currency (e.g. INR) conversion is
 * shown because none is modeled anywhere in this codebase.
 *
 * `isDemo` swaps the caption to make clear a Demo Mode balance is fixture
 * data, never a live chain read — callers pass their own demo fixture as
 * `treasury`, this component just avoids claiming it came from the chain.
 */
export function TreasuryCard({
  treasury,
  isDemo = false,
}: {
  treasury: TreasuryState | null;
  isDemo?: boolean;
}) {
  return (
    <Card className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <p className="text-label text-text-secondary">On-chain treasury</p>
        <Landmark className="h-4 w-4 text-text-secondary" aria-hidden="true" />
      </div>
      <p className="text-h3 text-text-primary">
        {treasury ? `${treasury.balance} POL` : "Not yet connected"}
      </p>
      <p className="text-caption text-text-secondary">
        {isDemo && treasury
          ? "Demo data — not a live blockchain read."
          : treasury
            ? "Read directly from the blockchain treasury contract."
            : "Balance will be read directly from the blockchain treasury contract once connected."}
      </p>
    </Card>
  );
}
