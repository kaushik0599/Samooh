import type {
  Activity,
  Member,
  ReconciledProposal,
  Samooh,
  SarthiInsight,
  TreasuryState,
} from "@samooh/types";

/**
 * Realistic-but-fictional fixture data for Demo Mode. Every field matches
 * the real shared types exactly (@samooh/types) — nothing invented beyond
 * plausible sample content. Two rules enforced throughout this file:
 *  - No `transaction_hash` on any demo activity item, ever. A fake hash
 *    would render as a clickable block-explorer link (see
 *    ActivityTimeline) that either 404s or points at an unrelated real
 *    transaction — actively misleading, not just fictional.
 *  - Contract/wallet addresses use recognizable placeholder hex patterns
 *    (0xdead.../0xbeef...) rather than plausible-looking real addresses.
 */

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;
const now = () => Date.now();
const isoAgo = (ms: number) => new Date(now() - ms).toISOString();

export const DEMO_SAMOOH_ID = "demo-samooh-vellore";
export const DEMO_WALLET_ADDRESS = "0x1111111111111111111111111111111111d3d0";

export const DEMO_SAMOOH: Samooh = {
  id: DEMO_SAMOOH_ID,
  name: "Vellore Manufacturing Collective",
  description:
    "A collective of small precision-parts manufacturers in Vellore coordinating raw-material procurement and shared logistics.",
  creator_wallet: "0x1111111111111111111111111111111111d3d0",
  governance_contract: "0xdeaddeaddeaddeaddeaddeaddeaddeaddeaddead",
  treasury_contract: "0xbeefbeefbeefbeefbeefbeefbeefbeefbeefbeef",
  network: "polygon-amoy",
  category: "Precision Manufacturing",
  purpose:
    "Pool procurement volume, share logistics costs, and make collective decisions on shared equipment.",
  region: "Vellore, Tamil Nadu",
  objectives: [
    "Collective raw-material procurement",
    "Shared logistics coordination",
    "Joint equipment investment",
  ],
  membership_open: true,
  created_at: isoAgo(46 * DAY),
};

export const DEMO_MEMBERS: Member[] = [
  {
    id: "demo-member-1",
    samooh_id: DEMO_SAMOOH_ID,
    wallet_address: "0x1111111111111111111111111111111111d3d0",
    role: "admin",
    joined_at: isoAgo(46 * DAY),
  },
  {
    id: "demo-member-2",
    samooh_id: DEMO_SAMOOH_ID,
    wallet_address: "0x2222222222222222222222222222222222d3d0",
    role: "member",
    joined_at: isoAgo(41 * DAY),
  },
  {
    id: "demo-member-3",
    samooh_id: DEMO_SAMOOH_ID,
    wallet_address: "0x3333333333333333333333333333333333d3d0",
    role: "member",
    joined_at: isoAgo(38 * DAY),
  },
  {
    id: "demo-member-4",
    samooh_id: DEMO_SAMOOH_ID,
    wallet_address: "0x4444444444444444444444444444444444d3d0",
    role: "member",
    joined_at: isoAgo(25 * DAY),
  },
  {
    id: "demo-member-5",
    samooh_id: DEMO_SAMOOH_ID,
    wallet_address: "0x5555555555555555555555555555555555d3d0",
    role: "member",
    joined_at: isoAgo(12 * DAY),
  },
];

export const DEMO_PROPOSALS: ReconciledProposal[] = [
  {
    id: "demo-proposal-1",
    samooh_id: DEMO_SAMOOH_ID,
    onchain_proposal_id: null,
    title: "Collective Raw Material Procurement",
    description:
      "Pool Q2 aluminium and steel purchases across all members to negotiate bulk pricing with regional suppliers.",
    amount: "185000",
    recipient: "0x6666666666666666666666666666666666d3d0",
    status: "VOTING",
    created_by: "0x1111111111111111111111111111111111d3d0",
    created_at: isoAgo(3 * DAY),
    status_source: "CACHE",
  },
  {
    id: "demo-proposal-2",
    samooh_id: DEMO_SAMOOH_ID,
    onchain_proposal_id: null,
    title: "Shared Logistics Contract Renewal",
    description:
      "Renew the shared freight contract for another 6 months at the negotiated collective rate.",
    amount: "42000",
    recipient: "0x7777777777777777777777777777777777d3d0",
    status: "APPROVED",
    created_by: "0x2222222222222222222222222222222222d3d0",
    created_at: isoAgo(9 * DAY),
    status_source: "CACHE",
  },
  {
    id: "demo-proposal-3",
    samooh_id: DEMO_SAMOOH_ID,
    onchain_proposal_id: null,
    title: "Shared CNC Maintenance Fund",
    description: "Set aside collective funds for preventive maintenance on shared CNC equipment.",
    amount: "15000",
    recipient: null,
    status: "EXECUTED",
    created_by: "0x1111111111111111111111111111111111d3d0",
    created_at: isoAgo(20 * DAY),
    status_source: "CACHE",
  },
  {
    id: "demo-proposal-4",
    samooh_id: DEMO_SAMOOH_ID,
    onchain_proposal_id: null,
    title: "Onboard a Regional Quality Auditor",
    description: "Engage a third-party auditor to certify batch quality across member workshops.",
    amount: "8000",
    recipient: null,
    status: "DRAFT",
    created_by: "0x3333333333333333333333333333333333d3d0",
    created_at: isoAgo(6 * HOUR),
    status_source: "CACHE",
  },
];

export const DEMO_ACTIVITY: Activity[] = [
  {
    id: "demo-activity-1",
    samooh_id: DEMO_SAMOOH_ID,
    type: "ProposalCreated",
    actor: "0x1111111111111111111111111111111111d3d0",
    description: "Proposal \"Collective Raw Material Procurement\" was created.",
    transaction_hash: null,
    created_at: isoAgo(3 * DAY),
  },
  {
    id: "demo-activity-2",
    samooh_id: DEMO_SAMOOH_ID,
    type: "VoteCast",
    actor: "0x2222222222222222222222222222222222d3d0",
    description: "A member voted on \"Collective Raw Material Procurement\".",
    transaction_hash: null,
    created_at: isoAgo(2 * DAY + 6 * HOUR),
  },
  {
    id: "demo-activity-3",
    samooh_id: DEMO_SAMOOH_ID,
    type: "VoteCast",
    actor: "0x4444444444444444444444444444444444d3d0",
    description: "A member voted on \"Collective Raw Material Procurement\".",
    transaction_hash: null,
    created_at: isoAgo(1 * DAY + 4 * HOUR),
  },
  {
    id: "demo-activity-4",
    samooh_id: DEMO_SAMOOH_ID,
    type: "ProposalApproved",
    actor: null,
    description: "Proposal \"Shared Logistics Contract Renewal\" was approved.",
    transaction_hash: null,
    created_at: isoAgo(8 * DAY),
  },
  {
    id: "demo-activity-5",
    samooh_id: DEMO_SAMOOH_ID,
    type: "ProposalExecuted",
    actor: null,
    description: "Proposal \"Shared CNC Maintenance Fund\" was executed by the treasury.",
    transaction_hash: null,
    created_at: isoAgo(18 * DAY),
  },
  {
    id: "demo-activity-6",
    samooh_id: DEMO_SAMOOH_ID,
    type: "MemberAdded",
    actor: "0x5555555555555555555555555555555555d3d0",
    description: "A new member joined the collective.",
    transaction_hash: null,
    created_at: isoAgo(12 * DAY),
  },
];

export const DEMO_FEATURED_INSIGHT: SarthiInsight = {
  id: "demo-insight-1",
  samooh_id: DEMO_SAMOOH_ID,
  type: "procurement",
  title: "Overlapping raw-material requirements",
  description:
    "Several members have overlapping raw-material requirements for the next production cycle.",
  recommendation:
    "A coordinated procurement proposal could reduce fragmented purchasing and improve bulk pricing.",
  priority: "high",
  created_at: isoAgo(4 * HOUR),
};

export const DEMO_SARTHI_INSIGHTS: SarthiInsight[] = [
  DEMO_FEATURED_INSIGHT,
  {
    id: "demo-insight-2",
    samooh_id: DEMO_SAMOOH_ID,
    type: "participation",
    title: "Steady voting participation",
    description: "Recent proposals have reached quorum within 48 hours of being opened for voting.",
    recommendation: "Participation is healthy — no action needed this cycle.",
    priority: "low",
    created_at: isoAgo(4 * HOUR),
  },
  {
    id: "demo-insight-3",
    samooh_id: DEMO_SAMOOH_ID,
    type: "growth",
    title: "New members joining steadily",
    description: "Three new members have joined the collective in the past six weeks.",
    recommendation: "Consider a welcome proposal or onboarding session for recent joiners.",
    priority: "medium",
    created_at: isoAgo(4 * HOUR),
  },
];

export const DEMO_TREASURY: TreasuryState = {
  balance: "12.4",
  network: "polygon-amoy:80002",
  treasuryContract: DEMO_SAMOOH.treasury_contract,
};
