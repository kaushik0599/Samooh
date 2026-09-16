import { withErrorHandling, created } from "@/lib/api/response";
import {
  requireString,
  optionalString,
  optionalStringArray,
  requireEnum,
  requireWalletAddress,
} from "@/lib/validation";
import { upsertUserByWallet } from "@/lib/services/users.service";
import { upsertOnboardingProfile } from "@/lib/services/onboarding.service";
import type { OnboardingPreference } from "@samooh/types";

const PREFERENCES: OnboardingPreference[] = ["JOIN", "START", "EITHER"];

/**
 * Light onboarding (30-60s): category, activity type, region, needs,
 * objectives, an optional biggest challenge, and a join/start preference.
 * Creates the user by wallet if they don't exist yet — no separate signup
 * step required.
 */
export async function POST(req: Request) {
  return withErrorHandling(async () => {
    const body = await req.json();

    const walletAddress = requireWalletAddress(body.wallet_address, "wallet_address");
    const name = optionalString(body.name, "name", { max: 200 });

    const user = await upsertUserByWallet(walletAddress, name);

    const profile = await upsertOnboardingProfile({
      user_id: user.id,
      category: requireString(body.category, "category", { max: 100 }),
      activity_type: optionalString(body.activity_type, "activity_type", { max: 200 }),
      region: requireString(body.region, "region", { max: 100 }),
      needs: optionalStringArray(body.needs, "needs", { maxLength: 200 }),
      objectives: optionalStringArray(body.objectives, "objectives", { maxLength: 200 }),
      biggest_challenge: optionalString(body.biggest_challenge, "biggest_challenge", {
        max: 1000,
      }),
      preference: requireEnum(body.preference, "preference", PREFERENCES),
    });

    return created({ user, profile });
  });
}
