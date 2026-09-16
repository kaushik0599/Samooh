"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@/lib/wallet/provider";
import { useAppState } from "@/lib/state/app-state";
import { WorkspaceShell } from "@/components/layout/WorkspaceShell";
import { LoadingState } from "@/components/ui/LoadingState";
import { isDemoMode } from "@/lib/demo/config";

/**
 * Single reusable authenticated shell for every workspace page — no page
 * under this layout re-implements navigation (section 6).
 *
 * In Demo Mode (NEXT_PUBLIC_DEMO_MODE=true) the wallet/Samooh guard below
 * is skipped entirely so the dashboard is reachable without a real
 * wallet — this is the ONLY thing Demo Mode changes here. It never touches
 * useWallet/useAppState's real logic, so setting the flag back to false
 * restores the exact guard that existed before.
 */
export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const { address } = useWallet();
  const { activeSamoohId } = useAppState();
  const router = useRouter();
  const demo = isDemoMode();

  useEffect(() => {
    if (demo) return;
    if (!address) {
      router.replace("/wallet");
      return;
    }
    if (!activeSamoohId) {
      router.replace("/discover");
    }
  }, [demo, address, activeSamoohId, router]);

  if (!demo && (!address || !activeSamoohId)) {
    return <LoadingState label="Loading your workspace" />;
  }

  return <WorkspaceShell>{children}</WorkspaceShell>;
}
