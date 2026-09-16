"use client";

import { useCallback } from "react";
import { Activity as ActivityIcon } from "lucide-react";
import { useAppState } from "@/lib/state/app-state";
import { getActivity } from "@/lib/api/endpoints";
import { PageHeader } from "@/components/ui/PageHeader";
import { ActivityTimeline } from "@/components/activity/ActivityTimeline";
import { LoadingState } from "@/components/ui/LoadingState";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import { useWorkspaceData } from "@/lib/demo/useWorkspaceData";
import { DEMO_ACTIVITY } from "@/lib/demo/data";

export default function ActivityPage() {
  const { activeSamoohId } = useAppState();
  const samoohId = activeSamoohId as string;
  const query = useWorkspaceData(
    useCallback(() => getActivity(samoohId), [samoohId]),
    DEMO_ACTIVITY,
    [samoohId]
  );

  return (
    <div>
      <PageHeader
        eyebrow="SAMOOH / Activity"
        title="Activity"
        description="Indexed on-chain events for this Samooh."
      />
      <div className="mt-8">
        {query.status === "loading" && <LoadingState label="Loading activity" />}
        {query.status === "error" && <ErrorState message={query.error.message} onRetry={query.refetch} />}
        {query.status === "success" && query.data.length === 0 && (
          <EmptyState icon={<ActivityIcon className="h-6 w-6" aria-hidden="true" />} title="No activity yet" />
        )}
        {query.status === "success" && query.data.length > 0 && <ActivityTimeline items={query.data} />}
      </div>
    </div>
  );
}
