"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useWallet } from "@/lib/wallet/provider";
import { discoverSamoohs } from "@/lib/api/endpoints";
import { ApiClientError } from "@/lib/api/client";
import { deriveAccountFlowState, type SamoohFlowState } from "./flow";

const ACTIVE_SAMOOH_STORAGE_KEY = "samooh:activeSamoohId";

interface AppStateContextValue {
  flowState: SamoohFlowState;
  /**
   * Whether this wallet has completed onboarding. `null` = not yet known
   * (see the KNOWN GAP note below), not "false".
   */
  hasOnboardingProfile: boolean | null;
  activeSamoohId: string | null;
  setActiveSamoohId: (id: string | null) => void;
  refreshOnboardingStatus: () => void;
}

const AppStateContext = createContext<AppStateContextValue | null>(null);

/**
 * Account-level state, composed from the wallet context plus onboarding
 * status. Deliberately thin: page-local data (a specific Samooh's members,
 * proposals, etc.) is fetched per-page via useApiQuery, not hoisted here.
 *
 * KNOWN GAP (see Sprint 0 report): there is no `GET /api/onboarding/:wallet`
 * or `GET /api/users/:wallet` endpoint in docs/API_SPEC.md to directly ask
 * "has this wallet onboarded?". As a pragmatic, clearly-marked workaround,
 * this calls `GET /api/discover/samoohs`, which happens to 400 when no
 * onboarding profile exists for the wallet — that response is repurposed
 * as the "not onboarded" signal. This is a real gap, not a designed
 * contract; replace with a direct endpoint when one exists.
 */
export function AppStateProvider({ children }: { children: ReactNode }) {
  const { address } = useWallet();
  const [hasOnboardingProfile, setHasOnboardingProfile] = useState<boolean | null>(null);
  const [activeSamoohId, setActiveSamoohIdState] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setActiveSamoohIdState(window.localStorage.getItem(ACTIVE_SAMOOH_STORAGE_KEY));
  }, []);

  const setActiveSamoohId = useCallback((id: string | null) => {
    setActiveSamoohIdState(id);
    if (typeof window === "undefined") return;
    if (id) window.localStorage.setItem(ACTIVE_SAMOOH_STORAGE_KEY, id);
    else window.localStorage.removeItem(ACTIVE_SAMOOH_STORAGE_KEY);
  }, []);

  const checkOnboardingStatus = useCallback(() => {
    if (!address) {
      setHasOnboardingProfile(null);
      return;
    }
    discoverSamoohs(address)
      .then(() => setHasOnboardingProfile(true))
      .catch((err: unknown) => {
        if (err instanceof ApiClientError && err.status === 400) {
          setHasOnboardingProfile(false);
        } else {
          // Network/server error — status genuinely unknown, don't guess.
          setHasOnboardingProfile(null);
        }
      });
  }, [address]);

  useEffect(() => checkOnboardingStatus(), [checkOnboardingStatus]);

  const flowState = deriveAccountFlowState({
    walletConnected: Boolean(address),
    hasOnboardingProfile: hasOnboardingProfile === true,
    hasActiveSamooh: Boolean(activeSamoohId),
  });

  const value = useMemo<AppStateContextValue>(
    () => ({
      flowState,
      hasOnboardingProfile,
      activeSamoohId,
      setActiveSamoohId,
      refreshOnboardingStatus: checkOnboardingStatus,
    }),
    [flowState, hasOnboardingProfile, activeSamoohId, setActiveSamoohId, checkOnboardingStatus]
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState(): AppStateContextValue {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error("useAppState must be used within an AppStateProvider");
  return ctx;
}
