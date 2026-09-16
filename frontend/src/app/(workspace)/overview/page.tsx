"use client";

import { useCallback } from "react";
import Link from "next/link";
import { Users, FileText, Activity as ActivityIcon, Sparkles } from "lucide-react";
import { useAppState } from "@/lib/state/app-state";
import { getSamooh, getMembers, getProposals } from "@/lib/api/endpoints";
import { PageHeader, SectionHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { TreasuryCard } from "@/components/treasury/TreasuryCard";
import { LoadingState } from "@/components/ui/LoadingState";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import { buttonVariants } from "@/components/ui/Button";
import { ProposalCard } from "@/components/proposals/ProposalCard";
import { SarthiRecommendation } from "@/components/sarthi/SarthiRecommendation";
import { useWorkspaceData } from "@/lib/demo/useWorkspaceData";
import { isDemoMode } from "@/lib/demo/config";
import {
  DEMO_SAMOOH,
  DEMO_MEMBERS,
  DEMO_PROPOSALS,
  DEMO_TREASURY,
  DEMO_FEATURED_INSIGHT,
} from "@/lib/demo/data";

const ACTIVE_PROPOSALS_LIMIT = 3;

export default function OverviewPage() {
  const { activeSamoohId } = useAppState();
  const samoohId = activeSamoohId as string;
  const demo = isDemoMode();

  const samoohQuery = useWorkspaceData(
    useCallback(() => getSamooh(samoohId), [samoohId]),
    DEMO_SAMOOH,
    [samoohId]
  );
  const membersQuery = useWorkspaceData(
    useCallback(() => getMembers(samoohId), [samoohId]),
    DEMO_MEMBERS,
    [samoohId]
  );
  const proposalsQuery = useWorkspaceData(
    useCallback(() => getProposals(samoohId), [samoohId]),
    DEMO_PROPOSALS,
    [samoohId]
  );

  if (samoohQuery.status === "loading") return <LoadingState label="Loading overview" />;
  if (samoohQuery.status === "error") {
    return <ErrorState message={samoohQuery.error.message} onRetry={samoohQuery.refetch} />;
  }

  return (
    <div>
      <PageHeader
        eyebrow="SAMOOH / Overview"
        title={samoohQuery.data.name}
        description={samoohQuery.data.purpose ?? undefined}
      />

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Members"
          value={membersQuery.status === "success" ? String(membersQuery.data.length) : "—"}
          icon={<Users className="h-4 w-4" aria-hidden="true" />}
        />
        <StatCard
          label="Proposals"
          value={proposalsQuery.status === "success" ? String(proposalsQuery.data.length) : "—"}
          icon={<FileText className="h-4 w-4" aria-hidden="true" />}
        />
        <TreasuryCard treasury={demo ? DEMO_TREASURY : null} isDemo={demo} />
      </div>

      <div className="mt-10">
        <div className="flex items-center justify-between">
          <SectionHeader title="Active proposals" description="What's currently moving through governance." />
          <Link href="/proposals" className="text-body-sm text-primary hover:underline">
            View all
          </Link>
        </div>

        {proposalsQuery.status === "loading" && <LoadingState label="Loading proposals" />}
        {proposalsQuery.status === "error" && (
          <ErrorState message={proposalsQuery.error.message} onRetry={proposalsQuery.refetch} />
        )}
        {proposalsQuery.status === "success" && proposalsQuery.data.length === 0 && (
          <EmptyState
            icon={<FileText className="h-6 w-6" aria-hidden="true" />}
            title="No proposals yet"
            description="Ask Sarthi for a recommendation, or draft one directly."
          />
        )}
        {proposalsQuery.status === "success" && proposalsQuery.data.length > 0 && (
          <div className="space-y-3">
            {proposalsQuery.data.slice(0, ACTIVE_PROPOSALS_LIMIT).map((proposal) => (
              <ProposalCard key={proposal.id} proposal={proposal} />
            ))}
          </div>
        )}
      </div>

      <div className="mt-10">
        <SectionHeader title="Latest Sarthi insight" description="What Sarthi notices about this collective." />
        {/*
          KNOWN GAP: there is no GET route to read previously-saved Sarthi
          insights — only POST /api/sarthi/analyze, which runs a real
          analysis. Silently calling it on every overview load would fire an
          unexpected backend job on page view, so this stays an honest
          prompt instead of a fabricated or surprising fetch. Demo Mode is
          the one exception: it's fixture data, not a live analysis call.
        */}
        {demo ? (
          <SarthiRecommendation
            insight={DEMO_FEATURED_INSIGHT}
            action={
              <Link href="/sarthi" className={buttonVariants("secondary", "sm")}>
                See all insights
              </Link>
            }
          />
        ) : (
          <EmptyState
            icon={<Sparkles className="h-6 w-6" aria-hidden="true" />}
            title="Ask Sarthi what it notices about this collective"
            description="Insights are generated on demand and aren't saved between visits yet."
            action={
              <Link href="/sarthi" className={buttonVariants("secondary", "sm")}>
                Open Sarthi
              </Link>
            }
          />
        )}
      </div>

      <div className="mt-8 flex items-center gap-2 text-body-sm text-text-secondary">
        <ActivityIcon className="h-4 w-4" aria-hidden="true" />
        See the Activity tab for the full on-chain history.
      </div>
    </div>
  );
}
