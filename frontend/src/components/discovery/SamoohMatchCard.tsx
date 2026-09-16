import Link from "next/link";
import { Users } from "lucide-react";
import type { SamoohDiscoveryResult } from "@samooh/types";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { MatchReason } from "./MatchReason";

export function SamoohMatchCard({ result }: { result: SamoohDiscoveryResult }) {
  const { samooh, memberCount, membershipOpen, matchScore, reasons } = result;

  return (
    <Link href={`/discover/${samooh.id}`}>
      <Card className="flex h-full flex-col gap-3 transition-colors duration-fast hover:border-primary">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-body font-medium text-text-primary">{samooh.name}</p>
            {samooh.category && (
              <p className="text-caption text-text-secondary">{samooh.category}</p>
            )}
          </div>
          <Badge tone={membershipOpen ? "success" : "neutral"}>
            {membershipOpen ? "Open" : "Closed"}
          </Badge>
        </div>

        {samooh.description && (
          <p className="line-clamp-2 text-body-sm text-text-secondary">{samooh.description}</p>
        )}

        {reasons.length > 0 && (
          <ul className="flex flex-col gap-1">
            {reasons.slice(0, 3).map((reason) => (
              <MatchReason key={reason} reason={reason} />
            ))}
          </ul>
        )}

        <div className="mt-auto flex items-center justify-between border-t border-border pt-3 text-caption text-text-secondary">
          <span className="flex items-center gap-1">
            <Users className="h-3.5 w-3.5" aria-hidden="true" />
            {memberCount} member{memberCount === 1 ? "" : "s"}
          </span>
          <span>{matchScore}% match</span>
        </div>
      </Card>
    </Link>
  );
}
