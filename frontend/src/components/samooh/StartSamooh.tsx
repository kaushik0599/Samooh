"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { createSamooh } from "@/lib/api/endpoints";
import { describeApiError } from "@/lib/api/client";
import { useToast } from "@/components/ui/Toast";
import { useAppState } from "@/lib/state/app-state";

export interface StartSamoohProps {
  creatorWallet: string;
}

/**
 * Governance/treasury contract addresses come from deployment
 * configuration (NEXT_PUBLIC_GOVERNANCE_CONTRACT / NEXT_PUBLIC_TREASURY_CONTRACT
 * — the same pair frontend/src/lib/wallet/contracts.ts uses for signed
 * writes), never from a form field. A judge/demo user creating a Samooh
 * should never see or paste a contract address — see
 * docs/BLOCKCHAIN_INTEGRATION.md for how that pair gets deployed.
 */
const GOVERNANCE_CONTRACT = process.env.NEXT_PUBLIC_GOVERNANCE_CONTRACT || "";
const TREASURY_CONTRACT = process.env.NEXT_PUBLIC_TREASURY_CONTRACT || "";

export function StartSamooh({ creatorWallet }: StartSamoohProps) {
  const router = useRouter();
  const { show } = useToast();
  const { setActiveSamoohId } = useAppState();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    category: "",
    purpose: "",
    region: "",
    objectives: "",
  });

  const update = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const contractsConfigured = Boolean(GOVERNANCE_CONTRACT && TREASURY_CONTRACT);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const samooh = await createSamooh({
        name: form.name,
        description: form.description || undefined,
        category: form.category || undefined,
        purpose: form.purpose || undefined,
        region: form.region || undefined,
        objectives: form.objectives
          ? form.objectives.split("\n").map((o) => o.trim()).filter(Boolean)
          : undefined,
        creator_wallet: creatorWallet,
        governance_contract: GOVERNANCE_CONTRACT,
        treasury_contract: TREASURY_CONTRACT,
      });
      setActiveSamoohId(samooh.id);
      show(`${samooh.name} created.`, "success");
      router.push("/overview");
    } catch (err) {
      show(describeApiError("Could not create the Samooh. Check the details and try again.", err), "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!contractsConfigured) {
    return (
      <div className="space-y-2 rounded-md border border-border bg-surface-secondary p-4">
        <p className="text-label text-text-secondary">Samooh creation isn&apos;t available yet</p>
        <p className="text-body-sm text-text-tertiary">
          Creating a Samooh requires a deployed Governance/Treasury contract pair, which isn&apos;t
          configured in this environment yet. This is a deployment step, not something to
          configure here.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input label="Name" required value={form.name} onChange={update("name")} />
      <Textarea label="Description" value={form.description} onChange={update("description")} />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input label="Category" value={form.category} onChange={update("category")} />
        <Input label="Region" value={form.region} onChange={update("region")} />
      </div>
      <Textarea
        label="Purpose"
        hint="What is this collective organized to do?"
        value={form.purpose}
        onChange={update("purpose")}
      />
      <Textarea
        label="Objectives"
        hint="One per line."
        value={form.objectives}
        onChange={update("objectives")}
      />
      <Button type="submit" isLoading={isSubmitting} className="w-full">
        Create Samooh
      </Button>
    </form>
  );
}
