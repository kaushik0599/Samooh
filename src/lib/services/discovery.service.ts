import { ValidationError } from "@/lib/api/response";
import { scoreMatch } from "@/lib/discovery/matcher";
import { suggestSamoohFormation } from "@/lib/sarthi/formation";
import { getUserByWallet } from "@/lib/services/users.service";
import { getOnboardingProfileByUserId } from "@/lib/services/onboarding.service";
import { listAllSamoohs } from "@/lib/services/samooh.service";
import { countMembersBySamooh } from "@/lib/services/members.service";
import type { SamoohDiscoveryResult, SamoohFormationSuggestion } from "@/types";

const MIN_RELEVANT_SCORE = 20;
const MAX_RESULTS = 10;

export interface DiscoverSamoohsResult {
  matches: SamoohDiscoveryResult[];
  recommendation: "JOIN_SAMOOH" | "START_SAMOOH";
  suggestion: SamoohFormationSuggestion | null;
}

/**
 * Deterministic discovery: no external AI, no geospatial DB — see
 * src/lib/discovery/matcher.ts for the scoring rules.
 */
export async function discoverSamoohsForWallet(
  walletAddress: string
): Promise<DiscoverSamoohsResult> {
  const user = await getUserByWallet(walletAddress);
  if (!user) {
    throw new ValidationError("Complete onboarding before discovering Samoohs");
  }

  const profile = await getOnboardingProfileByUserId(user.id);
  if (!profile) {
    throw new ValidationError("Complete onboarding before discovering Samoohs");
  }

  const [samoohs, memberCounts] = await Promise.all([
    listAllSamoohs(),
    countMembersBySamooh(),
  ]);

  const matches: SamoohDiscoveryResult[] = samoohs
    .map((samooh) => {
      const { score, reasons } = scoreMatch(profile, samooh);
      const result: SamoohDiscoveryResult = {
        samooh: {
          id: samooh.id,
          name: samooh.name,
          description: samooh.description,
          category: samooh.category,
          purpose: samooh.purpose,
          region: samooh.region,
          network: samooh.network,
        },
        memberCount: memberCounts[samooh.id] ?? 0,
        membershipOpen: samooh.membership_open,
        matchScore: score,
        reasons,
      };
      return result;
    })
    .filter((m) => m.matchScore >= MIN_RELEVANT_SCORE)
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, MAX_RESULTS);

  return {
    matches,
    recommendation: matches.length > 0 ? "JOIN_SAMOOH" : "START_SAMOOH",
    suggestion: matches.length > 0 ? null : suggestSamoohFormation(profile),
  };
}
