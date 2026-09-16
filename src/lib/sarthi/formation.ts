import type { UserOnboardingProfile } from "@/types";

export interface SamoohFormationSuggestion {
  title: string;
  purpose: string;
  objectives: string[];
  reason: string;
}

/**
 * Advisory only — purely computed from the user's onboarding answers, no DB
 * writes, no Samooh created. Surfaced by the discovery API when no existing
 * Samooh is a good match, so the frontend can prefill "Start a Samooh."
 * Sarthi cannot create the Samooh itself; a human still submits it.
 */
export function suggestSamoohFormation(
  profile: Pick<UserOnboardingProfile, "category" | "region" | "needs" | "objectives">
): SamoohFormationSuggestion {
  const focus = profile.needs[0] ?? profile.objectives[0] ?? profile.category;

  return {
    title: `${profile.category} Collective`,
    purpose: `A collective for ${profile.category} participants in ${profile.region} to jointly address: ${focus}.`,
    objectives: profile.objectives.length > 0 ? profile.objectives : profile.needs.slice(0, 3),
    reason: `No suitable ${profile.category} Samooh found near ${profile.region}. Participants with similar needs could form one.`,
  };
}
