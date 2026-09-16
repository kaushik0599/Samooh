import type { SarthiContext } from "./context";
import type { CreateSarthiInsightInput } from "@/lib/services/sarthi.service";
import type { Proposal, SarthiConfidence } from "@samooh/types";

export type InsightDraft = Omit<CreateSarthiInsightInput, "samooh_id">;

// Only "recent" activity feeds the growth signal, so a mature Samooh doesn't
// stay flagged forever just because it once had >=3 MemberAdded events.
const RECENT_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;

function shortAddr(addr: string): string {
  return addr.length > 10 ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : addr;
}

function isRecent(iso: string, now: number): boolean {
  const t = Date.parse(iso);
  return Number.isFinite(t) && now - t <= RECENT_WINDOW_MS && now - t >= 0;
}

function countBy<T>(items: T[], keyFn: (item: T) => string): Map<string, number> {
  const counts = new Map<string, number>();
  for (const item of items) {
    const key = keyFn(item);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
}

/** Highest-count entry, or ["", 0] for an empty map. Ties keep first-seen. */
function topEntry(counts: Map<string, number>): [string, number] {
  let bestKey = "";
  let bestCount = 0;
  for (const [key, count] of counts) {
    if (count > bestCount) {
      bestKey = key;
      bestCount = count;
    }
  }
  return [bestKey, bestCount];
}

/**
 * Confidence scales with the real sample size / magnitude behind a rule,
 * never a hardcoded per-rule-type constant. `mediumAt`/`highAt` are set per
 * call site relative to that rule's own evidentiary floor (e.g. a rule that
 * requires >=4 proposals to fire treats ~4 as "medium" confidence and ~8+,
 * double the floor, as "high" — a comfortably larger sample than the bare
 * minimum needed to trigger the rule at all).
 */
function confidenceFor(value: number, mediumAt: number, highAt: number): SarthiConfidence {
  if (value >= highAt) return "high";
  if (value >= mediumAt) return "medium";
  return "low";
}

/**
 * Deterministic, rule-based analysis over actual collective data — no
 * external AI API, no randomness, no machine learning. Each rule below is a
 * small, explicit heuristic with a concrete evidentiary threshold (never a
 * bare ">0" on a noisy/inferred metric — see the comment on each rule) and
 * an evidence-specific description built from the real counts it found.
 * Weak or ambiguous evidence produces no insight rather than a vague one.
 *
 * Every insight also carries a structured "idea" shape: `evidence` (the
 * concrete numbers behind the description, as discrete items rather than
 * only prose), `estimated_cost`/`cost_currency` (populated ONLY when a real
 * figure is actually derivable from real data — never an invented plausible
 * number), `timeline` (populated ONLY when the rule's own urgency logic
 * honestly justifies a horizon), `risk_level`, and `confidence` (which
 * varies with the real strength of the evidence, computed via
 * `confidenceFor`, not a fixed per-rule constant). Each rule's comment below
 * states which of these fields it can honestly populate and why — "Data
 * unavailable" / null is always preferred over a fabricated-looking number.
 *
 * None of this can vote, approve, reject, execute, or move funds — it only
 * returns advisory drafts for a human-reviewed write to `sarthi_insights`.
 *
 * Priority rationale (kept consistent across rules):
 *   - low:    informational / positive trend, nothing at risk.
 *   - medium: an actionable opportunity, or an early-stage risk signal that
 *             merits attention but has not yet caused observable harm.
 *   - high:   either a materialized governance/financial risk (e.g. half of
 *             proposals already rejected, severe power concentration) or a
 *             decision the collective already made that is sitting idle
 *             (e.g. an approved proposal with funds ready to act on it).
 */
export function analyzeCollective(ctx: SarthiContext): InsightDraft[] {
  const insights: InsightDraft[] = [];
  const { members, proposals, activity, treasuryBalance } = ctx;
  const now = Date.now();

  // --- governance: no proposals yet -----------------------------------
  // Threshold: >=3 members (a real collective, not a lone creator) and
  // zero proposals ever. Below 3 members there isn't enough of a group to
  // call the absence of proposals a notable pattern.
  if (members.length >= 3 && proposals.length === 0) {
    insights.push({
      type: "governance",
      title: "No proposals yet",
      description: `${members.length} members have joined but no proposal has been created.`,
      recommendation:
        "Draft an initial proposal to get the collective's governance flow moving.",
      priority: "medium",
      // Evidence: real counts of members/proposals — both directly queried.
      // No honest cost or timeline follows from "no proposals yet" — there
      // is no budget figure or deadline implied. Risk is "low": this is
      // informational, not a materialized problem — governance simply
      // hasn't started, it hasn't broken down.
      evidence: [`${members.length} members`, "0 proposals created"],
      estimated_cost: null,
      cost_currency: null,
      timeline: null,
      risk_level: "low",
      confidence: confidenceFor(members.length, 3, 6),
    });
  }

  // --- bottleneck: high rejection rate ---------------------------------
  // Threshold: at least 2 rejected proposals AND rejections are >=50% of
  // all proposals. Requiring both an absolute floor and a ratio avoids
  // flagging a single rejection (normal, not a pattern) or a high ratio
  // over a sample of one.
  const rejected = proposals.filter((p) => p.status === "REJECTED");
  if (rejected.length >= 2 && proposals.length > 0 && rejected.length / proposals.length >= 0.5) {
    const rejectionShare = rejected.length / proposals.length;
    insights.push({
      type: "bottleneck",
      title: "High proposal rejection rate",
      description: `${rejected.length} of ${proposals.length} proposals were rejected.`,
      recommendation:
        "Review proposal criteria with members before submission to improve approval odds.",
      priority: "high",
      // Evidence: exact rejected/total counts and the derived rate. No
      // honest cost/timeline figure follows from a rejection rate alone —
      // there's no real budget or deadline data here. Risk is a
      // materialized governance risk by construction (>=50% rejected),
      // escalating to "high" once it crosses 3-in-4.
      evidence: [
        `${rejected.length} rejected proposals`,
        `${proposals.length} total proposals`,
        `${Math.round(rejectionShare * 100)}% rejection rate`,
      ],
      estimated_cost: null,
      cost_currency: null,
      timeline: null,
      risk_level: rejectionShare >= 0.75 ? "high" : "medium",
      confidence: confidenceFor(proposals.length, 2, 5),
    });
  }

  // --- treasury: idle balance --------------------------------------------
  // Threshold: a nonzero on-chain balance with zero proposals of any kind.
  // Once even one proposal exists the treasury is already in active
  // consideration, so this only fires on genuine inactivity.
  if (treasuryBalance !== null && Number(treasuryBalance) > 0 && proposals.length === 0) {
    insights.push({
      type: "treasury",
      title: "Idle treasury balance",
      description: `Treasury holds ${treasuryBalance} MATIC with no active proposals.`,
      recommendation:
        "Consider proposing a collective initiative to put treasury funds to use.",
      priority: "medium",
      // Evidence: the live on-chain balance itself. Cost: honestly
      // derivable here — the treasury balance IS the real capital
      // available (not an invented cost estimate for some hypothetical
      // initiative), so it's fair to surface as estimated_cost in MATIC,
      // matching the on-chain read. Timeline: left null — there's no
      // concrete deadline evidence, only that the capital is currently
      // unused; "idle" isn't the same as "time-boxed."
      evidence: [`treasury balance: ${treasuryBalance} MATIC`, "0 active proposals"],
      estimated_cost: treasuryBalance,
      cost_currency: "MATIC",
      timeline: null,
      risk_level: "medium",
      confidence: confidenceFor(Number(treasuryBalance), 1, 10),
    });
  }

  // --- growth: recent member growth ---------------------------------------
  // Threshold: >=3 MemberAdded events within the last 30 days (not lifetime
  // total), so a long-established Samooh doesn't stay flagged forever.
  const recentMemberAdds = activity.filter(
    (a) => a.type === "MemberAdded" && isRecent(a.created_at, now)
  ).length;
  if (recentMemberAdds >= 3) {
    insights.push({
      type: "growth",
      title: "Growing membership",
      description: `${recentMemberAdds} members joined in the last 30 days.`,
      recommendation:
        "Onboard new members with a welcome proposal or shared-resource initiative.",
      priority: "low",
      // Evidence: the real recent-join count. No honest cost or deadline
      // follows from growth alone. This is a positive trend, not a risk —
      // risk_level is left null rather than forced into a low/medium/high
      // framing that doesn't actually apply here.
      evidence: [`${recentMemberAdds} members joined in the last 30 days`],
      estimated_cost: null,
      cost_currency: null,
      timeline: null,
      risk_level: null,
      confidence: confidenceFor(recentMemberAdds, 3, 6),
    });
  }

  // --- participation: low voting turnout ----------------------------------
  // Threshold: >=3 members, >=2 proposals (a single proposal's turnout is
  // too small a sample to call "low"), and cast votes fall under 30% of
  // membership per proposal on average.
  const voteCasts = activity.filter((a) => a.type === "VoteCast").length;
  if (
    members.length >= 3 &&
    proposals.length >= 2 &&
    voteCasts / proposals.length < members.length * 0.3
  ) {
    const avgTurnoutPct =
      members.length > 0 ? Math.round((voteCasts / proposals.length / members.length) * 100) : 0;
    insights.push({
      type: "participation",
      title: "Low voting participation",
      description: `Only ${voteCasts} votes recorded across ${proposals.length} proposals for ${members.length} members.`,
      recommendation:
        "Encourage members to weigh in on open proposals to reach quorum reliably.",
      priority: "medium",
      // Evidence: real vote/proposal/member counts and the derived average
      // turnout. No honest cost figure. Timeline left null — there's no
      // specific deadline evidence, just an ongoing pattern. Risk is
      // "medium": a governance-legitimacy / quorum concern, not yet a
      // materialized loss.
      evidence: [
        `${voteCasts} votes cast`,
        `${proposals.length} proposals`,
        `${members.length} members`,
        `~${avgTurnoutPct}% average turnout per proposal`,
      ],
      estimated_cost: null,
      cost_currency: null,
      timeline: null,
      risk_level: "medium",
      confidence: confidenceFor(proposals.length, 2, 5),
    });
  }

  // --- governance risk: proposal authorship concentration -----------------
  // Threshold: >=4 proposals (enough of a track record to talk about a
  // "pattern") where a single wallet authored >=60% of them.
  if (proposals.length >= 4) {
    const byCreator = countBy(proposals, (p) => p.created_by);
    const [topCreator, topCreatorCount] = topEntry(byCreator);
    const share = topCreatorCount / proposals.length;
    if (share >= 0.6) {
      insights.push({
        type: "governance",
        title: "Proposal authorship is concentrated",
        description: `${shortAddr(topCreator)} authored ${topCreatorCount} of ${proposals.length} proposals (${Math.round(share * 100)}%).`,
        recommendation:
          "Encourage more members to author and submit proposals so governance input doesn't concentrate in one wallet.",
        priority: share >= 0.8 ? "high" : "medium",
        // Evidence: exact authorship counts/share for the top wallet. No
        // honest cost/timeline follows from an authorship pattern. Risk
        // scales with the share itself, the same break point used for
        // priority (>=80% is a materially stronger concentration).
        evidence: [
          `${shortAddr(topCreator)} authored ${topCreatorCount} of ${proposals.length} proposals`,
          `${Math.round(share * 100)}% authorship share`,
        ],
        estimated_cost: null,
        cost_currency: null,
        timeline: null,
        risk_level: share >= 0.8 ? "high" : "medium",
        confidence: confidenceFor(proposals.length, 4, 8),
      });
    }
  }

  // --- governance risk: admin concentration --------------------------------
  // Threshold: >=5 members (large enough that admin/member should diverge)
  // and admins make up >=50% of the roster.
  if (members.length >= 5) {
    const adminCount = members.filter((m) => m.role === "admin").length;
    const adminRatio = adminCount / members.length;
    if (adminRatio >= 0.5) {
      insights.push({
        type: "governance",
        title: "Admin role is concentrated",
        description: `${adminCount} of ${members.length} members (${Math.round(adminRatio * 100)}%) hold admin permissions.`,
        recommendation:
          "Consider distributing admin permissions to more members as the collective grows, to reduce reliance on a small group.",
        priority: "medium",
        // Evidence: exact admin/member counts and the derived ratio. No
        // honest cost/timeline follows from a role-distribution pattern.
        // Risk scales with how concentrated admin power actually is.
        evidence: [
          `${adminCount} of ${members.length} members are admins`,
          `${Math.round(adminRatio * 100)}% admin ratio`,
        ],
        estimated_cost: null,
        cost_currency: null,
        timeline: null,
        risk_level: adminRatio >= 0.75 ? "high" : "medium",
        confidence: confidenceFor(members.length, 5, 10),
      });
    }
  }

  // --- bottleneck risk: voting power concentration -------------------------
  // Threshold: >=5 recorded VoteCast events with an identifiable actor,
  // from >=2 distinct wallets (so it isn't just one active member with no
  // one else voting yet — that's a participation gap, not concentration),
  // where the top voter cast >=50% of all recorded votes.
  const voteEvents = activity.filter((a) => a.type === "VoteCast" && a.actor);
  if (voteEvents.length >= 5) {
    const byVoter = countBy(voteEvents, (a) => a.actor as string);
    const [topVoter, topVoterCount] = topEntry(byVoter);
    const share = topVoterCount / voteEvents.length;
    if (byVoter.size >= 2 && share >= 0.5) {
      insights.push({
        type: "bottleneck",
        title: "Voting power is concentrated",
        description: `${shortAddr(topVoter)} cast ${topVoterCount} of ${voteEvents.length} recorded votes (${Math.round(share * 100)}%) across ${byVoter.size} distinct participants.`,
        recommendation:
          "Encourage wider participation in governance decisions so outcomes don't rest on a small number of wallets.",
        priority: "medium",
        // Evidence: exact vote counts/share for the top voter plus the
        // distinct-voter count. No honest cost/timeline follows from a
        // voting pattern. Risk scales with the top voter's share.
        evidence: [
          `${shortAddr(topVoter)} cast ${topVoterCount} of ${voteEvents.length} recorded votes`,
          `${byVoter.size} distinct participants`,
          `${Math.round(share * 100)}% vote share`,
        ],
        estimated_cost: null,
        cost_currency: null,
        timeline: null,
        risk_level: share >= 0.75 ? "high" : "medium",
        confidence: confidenceFor(voteEvents.length, 5, 10),
      });
    }
  }

  // --- procurement: recurring recipient across members --------------------
  // Real, structured evidence only: groups non-draft, non-rejected
  // proposals by their on-chain `recipient` address. This is NOT per-member
  // declared "procurement needs" — the schema has no such field (members
  // only have wallet_address/role/joined_at, and Samooh-level
  // category/region/objectives aren't per-member). What it *does* honestly
  // detect: the same external recipient recurring across proposals authored
  // by different members, which is real cross-member evidence of a shared
  // vendor/beneficiary relationship worth consolidating.
  // Threshold: the same recipient appears in >=3 proposals AND those
  // proposals were authored by >=2 distinct members (so one member
  // repeatedly proposing to the same address doesn't count as "shared").
  const recipientCandidates = proposals.filter(
    (p): p is Proposal & { recipient: string } =>
      p.recipient !== null && p.status !== "DRAFT" && p.status !== "REJECTED"
  );
  const byRecipient = new Map<string, Proposal[]>();
  for (const p of recipientCandidates) {
    const list = byRecipient.get(p.recipient) ?? [];
    list.push(p);
    byRecipient.set(p.recipient, list);
  }
  for (const [recipient, list] of byRecipient) {
    const distinctCreators = new Set(list.map((p) => p.created_by)).size;
    if (list.length >= 3 && distinctCreators >= 2) {
      const totalAmount = list.reduce((sum, p) => sum + (p.amount ? Number(p.amount) : 0), 0);
      const amountNote = totalAmount > 0 ? ` totaling ${totalAmount} MATIC` : "";
      insights.push({
        type: "procurement",
        title: "Recurring shared recipient across proposals",
        description: `${shortAddr(recipient)} appears as the recipient in ${list.length} proposals from ${distinctCreators} different members${amountNote}.`,
        recommendation:
          "The collective could explore a shared or bulk arrangement with this recipient instead of separate one-off proposals.",
        priority: "medium",
        // Evidence: real recipient/creator counts. Cost: the sum of actual
        // historical proposal amounts to this recipient is a real, already
        // observed figure (not an invented forward-looking cost) and gives
        // an honest scale for what a consolidated arrangement is worth —
        // populated only when at least one proposal in the group actually
        // carried an amount. Timeline/risk: there's no honest urgency or
        // risk-of-harm basis for a procurement consolidation opportunity,
        // so both are left null rather than forced.
        evidence: [
          `${list.length} proposals to ${shortAddr(recipient)}`,
          `${distinctCreators} distinct members`,
          totalAmount > 0
            ? `${totalAmount} MATIC total historical amount`
            : "no amount data recorded",
        ],
        estimated_cost: totalAmount > 0 ? String(totalAmount) : null,
        cost_currency: totalAmount > 0 ? "MATIC" : null,
        timeline: null,
        risk_level: null,
        confidence: confidenceFor(list.length, 3, 6),
      });
    }
  }

  // --- opportunity: approved proposals awaiting execution ------------------
  // Threshold is an exact count (>=1), not a ratio, because this reports a
  // directly observed fact — a proposal the collective already approved
  // that hasn't reached EXECUTED — rather than an inferred statistical
  // pattern. There is no meaningful "noise" for a single already-decided
  // proposal sitting idle, so a ratio-based threshold would only hide real
  // signal. Priority escalates when a backlog is building or funds are
  // already available to act on it.
  const approved = proposals.filter((p) => p.status === "APPROVED");
  if (approved.length >= 1) {
    const totalAmount = approved.reduce((sum, p) => sum + (p.amount ? Number(p.amount) : 0), 0);
    const fundsReady =
      treasuryBalance !== null && totalAmount > 0 && Number(treasuryBalance) >= totalAmount;
    const example = approved[0]?.title ?? "an approved proposal";
    const priority = approved.length >= 3 || fundsReady ? "high" : "medium";
    insights.push({
      type: "opportunity",
      title: "Approved proposals awaiting execution",
      description: `${approved.length} proposal(s) have already been approved by members but not yet finalized on-chain, including "${example}".`,
      recommendation:
        "These already-approved proposals could be finalized on-chain to put the decision into effect.",
      priority,
      // Evidence: the exact count of approved-but-not-executed proposals
      // plus a concrete example. Cost: the real sum of their requested
      // amounts, when any carry one — a directly observed figure, not a
      // forecast. Timeline: "Immediate" is honestly justified here (unlike
      // most other rules above) because this reports a decision the
      // collective already made that is sitting idle with real money
      // behind it, not a speculative future opportunity. Confidence is
      // tied to whether we actually know the financial stakes (an amount
      // was recorded), not just the count.
      evidence: [
        `${approved.length} approved proposal(s) not yet executed`,
        `example: "${example}"`,
        fundsReady
          ? `treasury balance ${treasuryBalance} MATIC covers the ${totalAmount} MATIC total`
          : totalAmount > 0
            ? `${totalAmount} MATIC total requested across approved proposals`
            : "no amount data recorded",
      ],
      estimated_cost: totalAmount > 0 ? String(totalAmount) : null,
      cost_currency: totalAmount > 0 ? "MATIC" : null,
      timeline: "Immediate",
      risk_level: priority === "high" ? "high" : "medium",
      confidence: totalAmount > 0 ? "high" : "medium",
    });
  }

  return insights;
}
