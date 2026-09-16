"use client";

import { useCallback, useState } from "react";
import { FileText, Plus } from "lucide-react";
import { useAppState } from "@/lib/state/app-state";
import { useWallet } from "@/lib/wallet/provider";
import { getProposals } from "@/lib/api/endpoints";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { ProposalCard } from "@/components/proposals/ProposalCard";
import { CreateProposalModal } from "@/components/proposals/CreateProposalModal";
import { LoadingState } from "@/components/ui/LoadingState";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import { useWorkspaceData } from "@/lib/demo/useWorkspaceData";
import { isDemoMode } from "@/lib/demo/config";
import { DEMO_PROPOSALS, DEMO_WALLET_ADDRESS } from "@/lib/demo/data";

export default function ProposalsPage() {
  const { activeSamoohId } = useAppState();
  const { address: realAddress } = useWallet();
  const demo = isDemoMode();
  const address = realAddress ?? (demo ? DEMO_WALLET_ADDRESS : null);
  const samoohId = activeSamoohId as string;
  const query = useWorkspaceData(
    useCallback(() => getProposals(samoohId), [samoohId]),
    DEMO_PROPOSALS,
    [samoohId]
  );
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  return (
    <div>
      <PageHeader
        eyebrow="SAMOOH / Governance"
        title="Proposals"
        description="Metadata drafts and their reconciled on-chain status."
        actions={
          <Button onClick={() => setIsCreateOpen(true)} disabled={!address}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            New proposal
          </Button>
        }
      />

      <div className="mt-8">
        {query.status === "loading" && <LoadingState label="Loading proposals" />}
        {query.status === "error" && <ErrorState message={query.error.message} onRetry={query.refetch} />}
        {query.status === "success" && query.data.length === 0 && (
          <EmptyState
            icon={<FileText className="h-6 w-6" aria-hidden="true" />}
            title="No proposals yet"
            description="Ask Sarthi for a recommendation, or draft one directly."
          />
        )}
        {query.status === "success" && query.data.length > 0 && (
          <div className="space-y-3">
            {query.data.map((proposal) => (
              <ProposalCard key={proposal.id} proposal={proposal} />
            ))}
          </div>
        )}
      </div>

      {address && (
        <CreateProposalModal
          open={isCreateOpen}
          onOpenChange={setIsCreateOpen}
          samoohId={samoohId}
          walletAddress={address}
          onCreated={() => query.refetch()}
        />
      )}
    </div>
  );
}
