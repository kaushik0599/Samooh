import { Users } from "lucide-react";
import type { Samooh } from "@samooh/types";
import { Badge } from "@/components/ui/Badge";

/** Public preview of a Samooh, shown before joining (app/(public)/samooh/[samoohId]). */
export function SamoohPreview({ samooh, memberCount }: { samooh: Samooh; memberCount?: number }) {
  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-h2 text-text-primary">{samooh.name}</h1>
          {samooh.category && <p className="mt-1 text-body-sm text-text-secondary">{samooh.category}</p>}
        </div>
        <Badge tone={samooh.membership_open ? "success" : "neutral"}>
          {samooh.membership_open ? "Open to new members" : "Membership closed"}
        </Badge>
      </div>

      {samooh.description && <p className="text-body text-text-secondary">{samooh.description}</p>}

      {samooh.purpose && (
        <div>
          <p className="text-label text-text-secondary">Purpose</p>
          <p className="text-body-sm text-text-primary">{samooh.purpose}</p>
        </div>
      )}

      {samooh.objectives.length > 0 && (
        <div>
          <p className="text-label text-text-secondary">Objectives</p>
          <ul className="mt-1 list-inside list-disc text-body-sm text-text-primary">
            {samooh.objectives.map((objective) => (
              <li key={objective}>{objective}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex items-center gap-4 border-t border-border pt-4 text-body-sm text-text-secondary">
        {typeof memberCount === "number" && (
          <span className="flex items-center gap-1.5">
            <Users className="h-4 w-4" aria-hidden="true" />
            {memberCount} member{memberCount === 1 ? "" : "s"}
          </span>
        )}
        {samooh.region && <span>{samooh.region}</span>}
      </div>
    </div>
  );
}
