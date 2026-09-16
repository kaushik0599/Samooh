"use client";

import { useCallback } from "react";
import { Users } from "lucide-react";
import { useAppState } from "@/lib/state/app-state";
import { getMembers } from "@/lib/api/endpoints";
import { PageHeader } from "@/components/ui/PageHeader";
import { MemberRow } from "@/components/members/MemberRow";
import { LoadingState } from "@/components/ui/LoadingState";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import { Card } from "@/components/ui/Card";
import { useWorkspaceData } from "@/lib/demo/useWorkspaceData";
import { DEMO_MEMBERS } from "@/lib/demo/data";

export default function MembersPage() {
  const { activeSamoohId } = useAppState();
  const samoohId = activeSamoohId as string;
  const query = useWorkspaceData(
    useCallback(() => getMembers(samoohId), [samoohId]),
    DEMO_MEMBERS,
    [samoohId]
  );

  return (
    <div>
      <PageHeader eyebrow="SAMOOH / Members" title="Members" />
      <div className="mt-8">
        {query.status === "loading" && <LoadingState label="Loading members" />}
        {query.status === "error" && <ErrorState message={query.error.message} onRetry={query.refetch} />}
        {query.status === "success" && query.data.length === 0 && (
          <EmptyState icon={<Users className="h-6 w-6" aria-hidden="true" />} title="No members yet" />
        )}
        {query.status === "success" && query.data.length > 0 && (
          <Card>
            {query.data.map((member) => (
              <MemberRow key={member.id} member={member} />
            ))}
          </Card>
        )}
      </div>
    </div>
  );
}
