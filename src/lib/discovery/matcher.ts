import type { Samooh, UserOnboardingProfile } from "@/types";

/**
 * Deterministic, transparent scoring — NOT AI/ML. Every point is traceable
 * to one rule below, and each rule that fires contributes a human-readable
 * reason. This is the single place to tune discovery matching.
 */
export const MATCH_WEIGHTS = {
  CATEGORY_MATCH: 35,
  REGION_MATCH: 20,
  NEEDS_OVERLAP_PER_ITEM: 8,
  NEEDS_OVERLAP_CAP: 24,
  OBJECTIVES_OVERLAP_PER_ITEM: 8,
  OBJECTIVES_OVERLAP_CAP: 24,
  MEMBERSHIP_OPEN_BONUS: 5,
} as const;

export interface MatchResult {
  score: number;
  reasons: string[];
}

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

/** Case-insensitive "shares a topic" check — substring match either way. */
function overlaps(a: string, b: string): boolean {
  const na = normalize(a);
  const nb = normalize(b);
  return na.length > 0 && nb.length > 0 && (na.includes(nb) || nb.includes(na));
}

function countOverlap(source: string[], target: string[]): number {
  let count = 0;
  for (const item of source) {
    if (target.some((t) => overlaps(item, t))) count += 1;
  }
  return count;
}

export function scoreMatch(
  profile: Pick<UserOnboardingProfile, "category" | "region" | "needs" | "objectives">,
  samooh: Pick<Samooh, "category" | "region" | "objectives" | "purpose" | "membership_open">
): MatchResult {
  let score = 0;
  const reasons: string[] = [];

  if (samooh.category && overlaps(profile.category, samooh.category)) {
    score += MATCH_WEIGHTS.CATEGORY_MATCH;
    reasons.push("Same category");
  }

  if (samooh.region && overlaps(profile.region, samooh.region)) {
    score += MATCH_WEIGHTS.REGION_MATCH;
    reasons.push("Nearby");
  }

  const samoohTopics = [...samooh.objectives, samooh.purpose ?? ""].filter(Boolean);

  const needsOverlap = countOverlap(profile.needs, samoohTopics);
  if (needsOverlap > 0) {
    score += Math.min(
      needsOverlap * MATCH_WEIGHTS.NEEDS_OVERLAP_PER_ITEM,
      MATCH_WEIGHTS.NEEDS_OVERLAP_CAP
    );
    reasons.push("Shared needs");
  }

  const objectivesOverlap = countOverlap(profile.objectives, samoohTopics);
  if (objectivesOverlap > 0) {
    score += Math.min(
      objectivesOverlap * MATCH_WEIGHTS.OBJECTIVES_OVERLAP_PER_ITEM,
      MATCH_WEIGHTS.OBJECTIVES_OVERLAP_CAP
    );
    reasons.push("Shared objectives");
  }

  if (samooh.membership_open) {
    score += MATCH_WEIGHTS.MEMBERSHIP_OPEN_BONUS;
    reasons.push("Open to new members");
  }

  return { score: Math.min(score, 100), reasons };
}
