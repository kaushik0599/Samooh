"use client";

import { useCallback } from "react";
import { AlertTriangle } from "lucide-react";
import { useAppState } from "@/lib/state/app-state";
import { getProposals } from "@/lib/api/endpoints";
import { useWorkspaceData } from "@/lib/demo/useWorkspaceData";
import { DEMO_PROPOSALS } from "@/lib/demo/data";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { ProposalPipeline } from "@/components/proposals/ProposalPipeline";
import { VotePanel } from "@/components/proposals/VotePanel";
import { LoadingState } from "@/components/ui/LoadingState";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import type { ProposalStatusSource, ReconciledProposal } from "@samooh/types";

const toneByStatus: Record<ReconciledProposal["status"], BadgeTone> = {
  DRAFT: "neutral",
  CREATED: "info",
  VOTING: "warning",
  APPROVED: "success",
  REJECTED: "error",
  EXECUTED: "success",
  EXPIRED: "neutral",
};

// Plain-language framing of `status_source` — users should understand
// SAMOOH without knowing Web3 jargon (LIVE_ONCHAIN / CACHE /
// BLOCKCHAIN_UNAVAILABLE are backend/API vocabulary, not product copy).
const statusSourceLabel: Record<ProposalStatusSource, string> = {
  LIVE_ONCHAIN: "Live from blockchain",
  CACHE: "Not yet submitted on-chain",
  BLOCKCHAIN_UNAVAILABLE: "Blockchain currently unavailable",
};

// Statuses whose meaningful next detail — vote counts and quorum — comes
// only from a live chain read. ReconciledProposal never carries that data
// (see BlockchainProposal / GovernanceState in src/types, which this route
// does not return), so this is shown as an honest gap, not fabricated.
const NEEDS_LIVE_CHAIN_DATA: ReconciledProposal["status"][] = ["VOTING", "APPROVED", "REJECTED"];

/**
 * There is no `GET /api/proposals/single/:id` route — only
 * `GET /api/proposals/[samoohId]` (a list). This finds the matching
 * proposal client-side rather than inventing a single-proposal endpoint.
 */
export function ProposalDetailClient({ proposalId }: { proposalId: string }) {
  const { activeSamoohId } = useAppState();
  const samoohId = activeSamoohId as string;

  const query = useWorkspaceData(
    useCallback(() => getProposals(samoohId), [samoohId]),
    DEMO_PROPOSALS,
    [samoohId]
  );

  if (query.status === "loading") return <LoadingState label="Loading proposal" />;
  if (query.status === "error") {
    return <ErrorState message={query.error.message} onRetry={query.refetch} />;
  }

  const proposal = query.data.find((p) => p.id === proposalId);
  if (!proposal) {
    return <EmptyState title="Proposal not found" description="It may have been part of a different Samooh." />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={proposal.title}
        actions={<Badge tone={toneByStatus[proposal.status]}>{proposal.status}</Badge>}
      />

      <div className="overflow-x-auto rounded-lg border border-border p-4">
        <ProposalPipeline status={proposal.status} />
      </div>

      {proposal.description && <p className="text-body text-text-secondary">{proposal.description}</p>}

      <dl className="grid grid-cols-2 gap-4 rounded-lg border border-border p-4 text-body-sm sm:grid-cols-4">
        <div>
          <dt className="text-caption text-text-secondary">Amount</dt>
          <dd className="text-text-primary">{proposal.amount ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-caption text-text-secondary">Recipient</dt>
          <dd className="truncate text-text-primary">{proposal.recipient ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-caption text-text-secondary">Created by</dt>
          <dd className="truncate text-text-primary">{proposal.created_by}</dd>
        </div>
        <div>
          <dt className="text-caption text-text-secondary">Status</dt>
          <dd className="text-text-primary">{statusSourceLabel[proposal.status_source]}</dd>
        </div>
      </dl>

      {NEEDS_LIVE_CHAIN_DATA.includes(proposal.status) && (
        <div className="flex items-start gap-2 rounded-lg border border-dashed border-border p-4 text-body-sm">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" aria-hidden="true" />
          <div>
            <p className="font-medium text-text-primary">Awaiting blockchain integration</p>
            <p className="text-text-secondary">
              Vote counts and quorum aren&apos;t available yet — they read directly from the
              Governance contract once that&apos;s wired up. Nothing is shown here rather than a
              guessed number.
            </p>
          </div>
        </div>
      )}

      <VotePanel proposal={proposal} />
    </div>
  );
}
