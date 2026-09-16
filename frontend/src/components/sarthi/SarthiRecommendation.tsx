import { Sparkles } from "lucide-react";
import type { SarthiInsight } from "@samooh/types";
import { Card } from "@/components/ui/Card";
import { Badge, type BadgeTone } from "@/components/ui/Badge";

const toneByPriority: Record<SarthiInsight["priority"], BadgeTone> = {
  high: "error",
  medium: "warning",
  low: "neutral",
};

/**
 * Renders one Sarthi insight. Advisory only — this component has no
 * action that votes, approves, or executes anything; "Create proposal"
 * is the only follow-on action, and it only opens a draft (see
 * app/(workspace)/sarthi/page.tsx).
 */
export function SarthiRecommendation({
  insight,
  action,
}: {
  insight: SarthiInsight;
  action?: React.ReactNode;
}) {
  return (
    <Card className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" aria-hidden="true" />
          <p className="text-body font-medium text-text-primary">{insight.title}</p>
        </div>
        <Badge tone={toneByPriority[insight.priority]}>{insight.priority}</Badge>
      </div>
      <p className="text-body-sm text-text-secondary">{insight.description}</p>
      <p className="rounded-md bg-accent-bg px-3 py-2 text-body-sm text-primary">
        {insight.recommendation}
      </p>
      {action}
    </Card>
  );
}
