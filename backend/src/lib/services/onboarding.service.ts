import { getSupabaseServerClient } from "@/lib/supabase/client";
import type { OnboardingPreference, UserOnboardingProfile } from "@samooh/types";

export interface UpsertOnboardingProfileInput {
  user_id: string;
  category: string;
  activity_type: string | null;
  region: string;
  needs: string[];
  objectives: string[];
  biggest_challenge: string | null;
  preference: OnboardingPreference;
}

export async function upsertOnboardingProfile(
  input: UpsertOnboardingProfileInput
): Promise<UserOnboardingProfile> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("user_onboarding_profiles")
    .upsert(
      { ...input, updated_at: new Date().toISOString() },
      { onConflict: "user_id" }
    )
    .select()
    .single();

  if (error) throw new Error(`Failed to save onboarding profile: ${error.message}`);
  return data as UserOnboardingProfile;
}

export async function getOnboardingProfileByUserId(
  userId: string
): Promise<UserOnboardingProfile | null> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("user_onboarding_profiles")
    .select()
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw new Error(`Failed to fetch onboarding profile: ${error.message}`);
  return (data as UserOnboardingProfile) ?? null;
}
