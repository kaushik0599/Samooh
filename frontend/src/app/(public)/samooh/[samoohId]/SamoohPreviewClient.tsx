"use client";

import { useCallback, useState } from "react";
import { useWallet } from "@/lib/wallet/provider";
import { useApiQuery } from "@/lib/api/useApiQuery";
import { getSamooh, getMembers } from "@/lib/api/endpoints";
import { SamoohPreview } from "@/components/samooh/SamoohPreview";
import { JoinRequestModal } from "@/components/samooh/JoinRequestModal";
import { LoadingState } from "@/components/ui/LoadingState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { WalletButton } from "@/components/wallet/WalletButton";

export function SamoohPreviewClient({ samoohId }: { samoohId: string }) {
  const { address } = useWallet();
  const [joinModalOpen, setJoinModalOpen] = useState(false);
  const [hasRequested, setHasRequested] = useState(false);

  const fetchSamooh = useCallback(() => getSamooh(samoohId), [samoohId]);
  const fetchMembers = useCallback(() => getMembers(samoohId), [samoohId]);
  const samoohQuery = useApiQuery(fetchSamooh, [samoohId]);
  const membersQuery = useApiQuery(fetchMembers, [samoohId]);

  if (samoohQuery.status === "loading") return <LoadingState label="Loading Samooh" />;
  if (samoohQuery.status === "error") {
    return (
      <main className="mx-auto max-w-2xl px-6 py-10">
        <ErrorState message={samoohQuery.error.message} onRetry={samoohQuery.refetch} />
      </main>
    );
  }

  const samooh = samoohQuery.data;
  const memberCount = membersQuery.status === "success" ? membersQuery.data.length : undefined;

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <Card>
        <SamoohPreview samooh={samooh} memberCount={memberCount} />

        <div className="mt-6 flex items-center gap-3 border-t border-border pt-6">
          {!address ? (
            <WalletButton />
          ) : hasRequested ? (
            <p className="text-body-sm text-text-secondary">Join request sent — pending review.</p>
          ) : (
            <Button onClick={() => setJoinModalOpen(true)} disabled={!samooh.membership_open}>
              {samooh.membership_open ? "Request to join" : "Membership closed"}
            </Button>
          )}
        </div>
      </Card>

      {address && (
        <JoinRequestModal
          open={joinModalOpen}
          onOpenChange={setJoinModalOpen}
          samoohId={samooh.id}
          samoohName={samooh.name}
          walletAddress={address}
          onRequested={() => setHasRequested(true)}
        />
      )}
    </main>
  );
}
