import { Check } from "lucide-react";

export function MatchReason({ reason }: { reason: string }) {
  return (
    <li className="flex items-center gap-1.5 text-caption text-text-secondary">
      <Check className="h-3 w-3 text-success" aria-hidden="true" />
      {reason}
    </li>
  );
}
