import Link from "next/link";
import type { ProposalStatusSource, ReconciledProposal } from "@samooh/types";
import { Card } from "@/components/ui/Card";
import { Badge, type BadgeTone } from "@/components/ui/Badge";

const toneByStatus: Record<ReconciledProposal["status"], BadgeTone> = {
  DRAFT: "neutral",
  CREATED: "info",
  VOTING: "warning",
  APPROVED: "success",
  REJECTED: "error",
  EXECUTED: "success",
  EXPIRED: "neutral",
};

const sourceLabel: Record<ProposalStatusSource, string> = {
  LIVE_ONCHAIN: "Live on-chain",
  CACHE: "Not yet on-chain",
  BLOCKCHAIN_UNAVAILABLE: "Chain unavailable — showing last known status",
};

export function ProposalCard({ proposal }: { proposal: ReconciledProposal }) {
  return (
    <Link href={`/proposals/${proposal.id}`}>
      <Card className="space-y-2 transition-colors duration-fast hover:border-primary">
        <div className="flex items-start justify-between gap-3">
          <p className="text-body font-medium text-text-primary">{proposal.title}</p>
          <Badge tone={toneByStatus[proposal.status]}>{proposal.status}</Badge>
        </div>
        {proposal.description && (
          <p className="line-clamp-2 text-body-sm text-text-secondary">{proposal.description}</p>
        )}
        <div className="flex items-center justify-between text-caption text-text-secondary">
          <span>{proposal.amount ? `${proposal.amount} POL` : "No amount"}</span>
          <span>{sourceLabel[proposal.status_source]}</span>
        </div>
      </Card>
    </Link>
  );
}
