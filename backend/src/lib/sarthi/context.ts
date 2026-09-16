import { listMembers } from "@/lib/services/members.service";
import { listProposals } from "@/lib/services/proposals.service";
import { listActivity } from "@/lib/services/activity.service";
import { getSamoohById } from "@/lib/services/samooh.service";
import { getTreasuryBalance } from "@/lib/blockchain";
import type { Activity, Member, Proposal, Samooh } from "@samooh/types";

export interface SarthiContext {
  samooh: Samooh;
  members: Member[];
  proposals: Proposal[];
  activity: Activity[];
  treasuryBalance: string | null;
}

export async function buildSarthiContext(samoohId: string): Promise<SarthiContext> {
  const [samooh, members, proposals, activity] = await Promise.all([
    getSamoohById(samoohId),
    listMembers(samoohId),
    listProposals(samoohId),
    listActivity(samoohId),
  ]);

  let treasuryBalance: string | null = null;
  try {
    treasuryBalance = (await getTreasuryBalance(samooh.treasury_contract)).balance;
  } catch {
    // Blockchain not configured or unreachable — treasury-based rules are
    // skipped rather than failing the whole analysis.
    treasuryBalance = null;
  }

  return { samooh, members, proposals, activity, treasuryBalance };
}
