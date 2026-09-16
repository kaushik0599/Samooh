/**
 * Temporary, development-only Demo Mode. Bypasses wallet/onboarding/Samooh
 * gates in the workspace so the dashboard can be explored without a real
 * wallet, real Supabase data, or a real backend connection. Never enabled
 * by default, never touches real auth/wallet/blockchain code paths — it
 * only changes what data workspace pages render and skips the redirect
 * guard in app/(workspace)/layout.tsx. See docs in this folder's data.ts
 * for what's fabricated (fixtures only, never a fake transaction).
 */
export function isDemoMode(): boolean {
  return process.env.NEXT_PUBLIC_DEMO_MODE === "true";
}
