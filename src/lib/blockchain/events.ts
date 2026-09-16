import type { ActivityType } from "@/types";

/** Canonical event names this backend expects to index. */
export const GOVERNANCE_EVENTS = [
  "ProposalCreated",
  "VoteCast",
  "ProposalApproved",
  "ProposalRejected",
  "ProposalExecuted",
  "MemberAdded",
  "MemberRemoved",
] as const satisfies readonly ActivityType[];

export const TREASURY_EVENTS = [
  "TreasuryDeposit",
  "TreasuryTransfer",
] as const satisfies readonly ActivityType[];

export interface RawChainEvent {
  eventName: ActivityType;
  transactionHash: string;
  args: Record<string, unknown>;
}

/**
 * Best-effort actor extraction. Real arg names are unknown until the
 * blockchain team's ABI/event spec is confirmed (docs/BLOCKCHAIN_INTEGRATION.md),
 * so this checks a handful of common conventions rather than assuming one.
 */
export function extractActor(event: RawChainEvent): string | null {
  const candidates = ["member", "voter", "proposer", "actor", "from", "by"];
  for (const key of candidates) {
    const value = event.args[key];
    if (typeof value === "string") return value;
  }
  return null;
}

export function describeEvent(event: RawChainEvent): string {
  return `${event.eventName} on-chain event indexed`;
}
