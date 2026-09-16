"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { useAppState } from "@/lib/state/app-state";
import { useWallet } from "@/lib/wallet/provider";
import { runSarthiAnalysis } from "@/lib/api/endpoints";
import { describeApiError } from "@/lib/api/client";
import { useToast } from "@/components/ui/Toast";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { SarthiRecommendation } from "@/components/sarthi/SarthiRecommendation";
import { CreateProposalModal } from "@/components/proposals/CreateProposalModal";
import { isDemoMode } from "@/lib/demo/config";
import { DEMO_SARTHI_INSIGHTS, DEMO_WALLET_ADDRESS } from "@/lib/demo/data";
import type { SarthiInsight } from "@samooh/types";

/**
 * KNOWN GAP (see Sprint 0 report): there is no `GET` route to read
 * previously-saved SarthiInsight rows for a Samooh — only
 * `POST /api/sarthi/analyze`, which runs analysis and returns/saves new
 * ones. This page can therefore only show insights from the current
 * session's analysis run, not history from a prior visit.
 */
export default function SarthiPage() {
  const { activeSamoohId } = useAppState();
  const samoohId = activeSamoohId as string;
  const { address: realAddress } = useWallet();
  const demo = isDemoMode();
  const address = realAddress ?? (demo ? DEMO_WALLET_ADDRESS : null);
  const { show } = useToast();
  const [insights, setInsights] = useState<SarthiInsight[] | null>(demo ? DEMO_SARTHI_INSIGHTS : null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [draftInsight, setDraftInsight] = useState<SarthiInsight | null>(null);

  const runAnalysis = async () => {
    if (demo) {
      // Fixture data, not a live analysis call — see data.ts.
      setInsights(DEMO_SARTHI_INSIGHTS);
      return;
    }
    if (!activeSamoohId) return;
    setIsAnalyzing(true);
    try {
      const result = await runSarthiAnalysis(activeSamoohId);
      setInsights(result);
    } catch (err) {
      show(describeApiError("Sarthi could not analyze this Samooh right now.", err), "error");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div>
      <PageHeader
        eyebrow="SAMOOH / Sarthi"
        title="Sarthi"
        description="Sarthi recommends. Your Samooh decides."
        actions={
          <Button onClick={runAnalysis} isLoading={isAnalyzing}>
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            Analyze collective
          </Button>
        }
      />

      <div className="mt-8 space-y-4">
        {insights === null && (
          <EmptyState
            icon={<Sparkles className="h-6 w-6" aria-hidden="true" />}
            title="No analysis yet"
            description="Run an analysis to see what Sarthi notices about this collective."
          />
        )}

        {insights?.length === 0 && (
          <EmptyState title="Nothing to flag right now" description="Sarthi found no opportunities or risks worth surfacing." />
        )}

        {insights?.map((insight) => (
          <SarthiRecommendation
            key={insight.id}
            insight={insight}
            action={
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setDraftInsight(insight)}
                disabled={!address}
              >
                Draft a proposal
              </Button>
            }
          />
        ))}
      </div>

      {address && (
        <CreateProposalModal
          open={draftInsight !== null}
          onOpenChange={(open) => {
            if (!open) setDraftInsight(null);
          }}
          samoohId={samoohId}
          walletAddress={address}
          origin="sarthi"
          initialTitle={draftInsight?.title ?? ""}
          initialDescription={draftInsight?.recommendation ?? ""}
        />
      )}
    </div>
  );
}
