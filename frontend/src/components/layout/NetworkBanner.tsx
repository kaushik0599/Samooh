"use client";

import { AlertTriangle } from "lucide-react";
import { useWallet } from "@/lib/wallet/provider";
import { Button } from "@/components/ui/Button";

/**
 * Persistent, unobtrusive banner shown on every workspace page when the
 * connected wallet is on the wrong network. Most of today's workspace is
 * read-only/metadata (see JoinRequestModal/StartSamooh — those only need a
 * connected wallet, not the right chain), so this is informational, not a
 * blocker: once real on-chain writes (voting, execution) land, being on
 * the wrong network will matter a lot, and this is the shared place to
 * surface that ahead of time. Renders nothing when there is no wallet
 * connected at all — WalletButton already covers that case.
 */
export function NetworkBanner() {
  const { address, isCorrectNetwork, switchNetwork } = useWallet();

  if (!address || isCorrectNetwork) return null;

  return (
    <div
      role="status"
      className="flex flex-wrap items-center justify-between gap-3 border-b border-warning/30 bg-warning/10 px-4 py-2 text-body-sm text-warning lg:px-10"
    >
      <span className="flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
        Your wallet is connected to the wrong network. Switch to Polygon Amoy before any
        on-chain action.
      </span>
      <Button onClick={switchNetwork} variant="secondary" size="sm">
        Switch to Polygon Amoy
      </Button>
    </div>
  );
}
