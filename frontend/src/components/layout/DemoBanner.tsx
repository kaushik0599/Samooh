import { isDemoMode } from "@/lib/demo/config";

/**
 * Persistent, unmissable indicator that every workspace page is showing
 * fixture data, not a real Samooh — mirrors NetworkBanner's placement so
 * it can never be scrolled past. Server-renderable (no wallet/client state
 * needed): Demo Mode is a build-time env flag, not a runtime toggle.
 */
export function DemoBanner() {
  if (!isDemoMode()) return null;

  return (
    <div
      role="status"
      className="flex items-center justify-center gap-2 border-b border-primary/30 bg-primary/10 px-4 py-1.5 text-caption font-medium text-primary"
    >
      <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden="true" />
      DEMO MODE — showing sample data, not a real Samooh
    </div>
  );
}
