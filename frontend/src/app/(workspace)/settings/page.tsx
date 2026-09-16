"use client";

import { useCallback } from "react";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { useAppState } from "@/lib/state/app-state";
import { useWallet } from "@/lib/wallet/provider";
import { getSamooh } from "@/lib/api/endpoints";
import { TARGET_CHAIN_ID } from "@/lib/wallet/network";
import { PageHeader, SectionHeader } from "@/components/ui/PageHeader";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { LoadingState } from "@/components/ui/LoadingState";
import { ErrorState } from "@/components/ui/ErrorState";
import { useWorkspaceData } from "@/lib/demo/useWorkspaceData";
import { isDemoMode } from "@/lib/demo/config";
import { DEMO_SAMOOH } from "@/lib/demo/data";

const THEME_OPTIONS = [
  { value: "system", label: "System" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

/** Polygon Amoy testnet explorer — see src/lib/wallet/network.ts. */
const EXPLORER_ADDRESS_BASE = "https://amoy.polygonscan.com/address/";

function ContractRow({ label, address }: { label: string; address: string }) {
  return (
    <div>
      <p className="text-caption text-text-secondary">{label}</p>
      <div className="mt-0.5 flex items-center justify-between gap-2">
        <p className="break-all text-body-sm text-text-primary">{address}</p>
        <a
          href={`${EXPLORER_ADDRESS_BASE}${address}`}
          target="_blank"
          rel="noreferrer"
          aria-label={`View ${label.toLowerCase()} on block explorer`}
          className="shrink-0 text-text-secondary transition-colors hover:text-primary"
        >
          <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
        </a>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { address } = useWallet();
  const { activeSamoohId, setActiveSamoohId } = useAppState();
  const router = useRouter();
  const demo = isDemoMode();

  const samoohQuery = useWorkspaceData(
    useCallback(() => {
      if (!activeSamoohId) return Promise.reject(new Error("No active Samooh"));
      return getSamooh(activeSamoohId);
    }, [activeSamoohId]),
    DEMO_SAMOOH,
    [activeSamoohId]
  );

  return (
    <div className="max-w-md space-y-10">
      <PageHeader eyebrow="SAMOOH / Settings" title="Settings" />

      <section>
        <SectionHeader title="Appearance" />
        <Select
          label="Theme"
          options={THEME_OPTIONS}
          value={theme}
          onValueChange={setTheme}
        />
      </section>

      <section>
        <SectionHeader title="Wallet" />
        <Card>
          <p className="text-body-sm text-text-secondary">Connected address</p>
          <p className="mt-1 break-all text-body-sm text-text-primary">{address ?? "Not connected"}</p>
        </Card>
      </section>

      <section>
        <SectionHeader
          title="Samooh information"
          description="Details for the Samooh you're currently in."
        />
        {!activeSamoohId && !demo && (
          <Card>
            <p className="text-body-sm text-text-secondary">No active Samooh selected.</p>
          </Card>
        )}
        {(activeSamoohId || demo) && samoohQuery.status === "loading" && (
          <LoadingState label="Loading Samooh details" />
        )}
        {(activeSamoohId || demo) && samoohQuery.status === "error" && (
          <ErrorState message={samoohQuery.error.message} onRetry={samoohQuery.refetch} />
        )}
        {(activeSamoohId || demo) && samoohQuery.status === "success" && (
          <Card className="space-y-3">
            <div>
              <p className="text-caption text-text-secondary">Name</p>
              <p className="text-body-sm text-text-primary">{samoohQuery.data.name}</p>
            </div>
            <div>
              <p className="text-caption text-text-secondary">Category</p>
              <p className="text-body-sm text-text-primary">{samoohQuery.data.category ?? "Not set"}</p>
            </div>
            <div>
              <p className="text-caption text-text-secondary">Region</p>
              <p className="text-body-sm text-text-primary">{samoohQuery.data.region ?? "Not set"}</p>
            </div>
            <div>
              <p className="text-caption text-text-secondary">Purpose</p>
              <p className="text-body-sm text-text-primary">{samoohQuery.data.purpose ?? "Not set"}</p>
            </div>
          </Card>
        )}
      </section>

      <section>
        <SectionHeader title="Workspace" />
        {demo ? (
          <p className="text-body-sm text-text-secondary">
            Switching Samoohs isn&apos;t available in Demo Mode.
          </p>
        ) : (
          <Button
            variant="secondary"
            onClick={() => {
              setActiveSamoohId(null);
              router.push("/discover");
            }}
          >
            Switch Samooh
          </Button>
        )}
      </section>

      <section>
        <SectionHeader
          title="Blockchain"
          description="Technical detail for this Samooh's on-chain contracts. Sarthi recommends, members decide, smart contracts enforce — this is where that enforcement lives."
        />
        <Card className="space-y-3">
          <div>
            <p className="text-caption text-text-secondary">Network</p>
            <p className="text-body-sm text-text-primary">Polygon Amoy Testnet</p>
          </div>
          <div>
            <p className="text-caption text-text-secondary">Chain ID</p>
            <p className="text-body-sm text-text-primary">{TARGET_CHAIN_ID}</p>
          </div>
          <div>
            <p className="text-caption text-text-secondary">Connected wallet</p>
            <p className="break-all text-body-sm text-text-primary">{address ?? "Not connected"}</p>
          </div>
          {demo && (
            <p className="text-caption text-primary">
              Demo Mode — these are fixture addresses, not a deployed contract.
            </p>
          )}
          {(activeSamoohId || demo) && samoohQuery.status === "success" && (
            <>
              <ContractRow label="Governance contract" address={samoohQuery.data.governance_contract} />
              <ContractRow label="Treasury contract" address={samoohQuery.data.treasury_contract} />
            </>
          )}
          {(activeSamoohId || demo) && samoohQuery.status !== "success" && (
            <p className="text-caption text-text-secondary">
              Contract addresses load with Samooh information above.
            </p>
          )}
          {!activeSamoohId && !demo && (
            <p className="text-caption text-text-secondary">
              Select a Samooh to see its governance and treasury contracts.
            </p>
          )}
        </Card>
      </section>
    </div>
  );
}
