import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { ProposalStatus } from "@samooh/types";

const STEPS: { key: "DRAFT" | "CREATED" | "VOTING" | "APPROVED" | "EXECUTED"; label: string }[] = [
  { key: "DRAFT", label: "Draft" },
  { key: "CREATED", label: "Created" },
  { key: "VOTING", label: "Voting" },
  { key: "APPROVED", label: "Approved" },
  { key: "EXECUTED", label: "Executed" },
];

// REJECTED shares the "decision" slot with APPROVED; EXECUTED is only
// reachable past an APPROVED decision. EXPIRED can happen at any point
// after CREATED (see ProposalStatus doc comment) so it isn't a slot in this
// linear pipeline — it's rendered as its own banner instead.
const STEP_INDEX: Record<ProposalStatus, number> = {
  DRAFT: 0,
  CREATED: 1,
  VOTING: 2,
  APPROVED: 3,
  REJECTED: 3,
  EXECUTED: 4,
  EXPIRED: -1,
};

/**
 * Visual DRAFT -> CREATED -> VOTING -> APPROVED/REJECTED -> EXECUTED
 * pipeline, highlighting the proposal's current step. Uses only
 * `ProposalStatus` from src/types — no invented statuses, no fabricated
 * chain data.
 */
export function ProposalPipeline({ status }: { status: ProposalStatus }) {
  if (status === "EXPIRED") {
    return (
      <div className="rounded-lg border border-dashed border-border bg-surface-secondary px-4 py-3 text-body-sm text-text-secondary">
        This proposal expired before reaching its next step.
      </div>
    );
  }

  const currentIndex = STEP_INDEX[status];
  const isRejected = status === "REJECTED";

  return (
    <ol className="flex flex-wrap items-center gap-y-3">
      {STEPS.map((step, i) => {
        const isDecisionSlot = step.key === "APPROVED";
        const label = isDecisionSlot && isRejected ? "Rejected" : step.label;
        const isCurrent = i === currentIndex;
        const isPast = i < currentIndex;
        const isUnreachable = isRejected && i === 4; // no execution after rejection

        return (
          <li key={step.key} className="flex items-center">
            <div
              className={cn(
                "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-caption font-medium whitespace-nowrap",
                isCurrent && isRejected && "border-error bg-error/10 text-error",
                isCurrent && !isRejected && "border-primary bg-accent-bg text-primary",
                isPast && "border-success/40 bg-success/10 text-success",
                !isCurrent && !isPast && "border-border text-text-secondary",
                isUnreachable && "opacity-50"
              )}
            >
              {isPast && <Check className="h-3 w-3" aria-hidden="true" />}
              {isCurrent && isRejected && <X className="h-3 w-3" aria-hidden="true" />}
              {label}
            </div>
            {i < STEPS.length - 1 && (
              <span aria-hidden="true" className="mx-2 h-px w-4 bg-border sm:w-8" />
            )}
          </li>
        );
      })}
    </ol>
  );
}
