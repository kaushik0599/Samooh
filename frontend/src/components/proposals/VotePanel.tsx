"use client";

import { ThumbsUp, ThumbsDown, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { ReconciledProposal } from "@samooh/types";

export interface VotePanelProps {
  proposal: ReconciledProposal;
}

/**
 * BLOCKED (see Sprint 0 report): voting is a real on-chain write against
 * the Governance contract. The real ABI is compiled and wired
 * (packages/types/src/blockchain.ts, contracts/), but no Governance
 * contract is deployed to Polygon Amoy in this environment yet — this
 * component establishes the UI boundary (buttons, proposal context,
 * wallet requirement) and clearly surfaces that instead of sending a
 * fabricated transaction.
 */
export function VotePanel({ proposal }: VotePanelProps) {
  if (proposal.status !== "VOTING") {
    return null;
  }

  return (
    <div className="space-y-3 rounded-lg border border-border bg-surface p-4">
      <div className="flex items-center gap-2 text-body-sm text-text-secondary">
        <AlertTriangle className="h-4 w-4 text-warning" aria-hidden="true" />
        Voting isn&apos;t available yet in this environment. These buttons are wired to the wallet
        flow but cannot submit a transaction until a Samooh contract is deployed.
      </div>
      <div className="flex gap-2">
        <Button variant="secondary" disabled className="flex-1">
          <ThumbsUp className="h-4 w-4" aria-hidden="true" />
          Vote to approve
        </Button>
        <Button variant="secondary" disabled className="flex-1">
          <ThumbsDown className="h-4 w-4" aria-hidden="true" />
          Vote to reject
        </Button>
      </div>
    </div>
  );
}
