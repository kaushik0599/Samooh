import { getSupabaseServerClient } from "@/lib/supabase/client";
import type { User } from "@samooh/types";

/**
 * Wallet address is the identity key. Onboarding a brand-new wallet creates
 * its `users` row here rather than requiring a separate signup step.
 */
export async function upsertUserByWallet(
  walletAddress: string,
  name?: string | null
): Promise<User> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("users")
    .upsert(
      { wallet_address: walletAddress, ...(name ? { name } : {}) },
      { onConflict: "wallet_address" }
    )
    .select()
    .single();

  if (error) throw new Error(`Failed to upsert user: ${error.message}`);
  return data as User;
}

export async function getUserByWallet(walletAddress: string): Promise<User | null> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("users")
    .select()
    .eq("wallet_address", walletAddress)
    .maybeSingle();

  if (error) throw new Error(`Failed to fetch user: ${error.message}`);
  return (data as User) ?? null;
}
