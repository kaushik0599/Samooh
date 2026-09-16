import type { SarthiContext } from "./context";
import type { CreateSarthiInsightInput } from "@/lib/services/sarthi.service";

/**
 * Deterministic, rule-based analysis over actual collective data — no
 * external AI API. Each rule is a small, explicit heuristic; nothing here
 * is machine-learned or probabilistic, and none of it can vote, approve,
 * reject, execute, or move funds. It only produces advisory drafts.
 */
export function analyzeCollective(
  ctx: SarthiContext
): Omit<CreateSarthiInsightInput, "samooh_id">[] {
  const insights: Omit<CreateSarthiInsightInput, "samooh_id">[] = [];
  const { members, proposals, activity, treasuryBalance } = ctx;

  if (members.length >= 3 && proposals.length === 0) {
    insights.push({
      type: "governance",
      title: "No proposals yet",
      description: `${members.length} members have joined but no proposal has been created.`,
      recommendation:
        "Draft an initial proposal to get the collective's governance flow moving.",
      priority: "medium",
    });
  }

  const rejected = proposals.filter((p) => p.status === "REJECTED");
  if (rejected.length >= 2 && proposals.length > 0 && rejected.length / proposals.length >= 0.5) {
    insights.push({
      type: "bottleneck",
      title: "High proposal rejection rate",
      description: `${rejected.length} of ${proposals.length} proposals were rejected.`,
      recommendation:
        "Review proposal criteria with members before submission to improve approval odds.",
      priority: "high",
    });
  }

  if (treasuryBalance !== null && Number(treasuryBalance) > 0 && proposals.length === 0) {
    insights.push({
      type: "treasury",
      title: "Idle treasury balance",
      description: `Treasury holds ${treasuryBalance} MATIC with no active proposals.`,
      recommendation:
        "Consider proposing a collective initiative to put treasury funds to use.",
      priority: "medium",
    });
  }

  const recentMemberAdds = activity.filter((a) => a.type === "MemberAdded").length;
  if (recentMemberAdds >= 3) {
    insights.push({
      type: "growth",
      title: "Growing membership",
      description: `${recentMemberAdds} members have joined recently.`,
      recommendation:
        "Onboard new members with a welcome proposal or shared-resource initiative.",
      priority: "low",
    });
  }

  const voteCasts = activity.filter((a) => a.type === "VoteCast").length;
  if (members.length > 0 && proposals.length > 0 && voteCasts / Math.max(proposals.length, 1) < members.length * 0.3) {
    insights.push({
      type: "participation",
      title: "Low voting participation",
      description: `Only ${voteCasts} votes recorded across ${proposals.length} proposal(s) for ${members.length} members.`,
      recommendation:
        "Encourage members to vote on open proposals to reach quorum reliably.",
      priority: "medium",
    });
  }

  return insights;
}
