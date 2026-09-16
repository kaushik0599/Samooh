"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@/lib/wallet/provider";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { StartSamooh } from "@/components/samooh/StartSamooh";

export default function CreateSamoohPage() {
  const { address } = useWallet();
  const router = useRouter();

  useEffect(() => {
    if (!address) router.replace("/wallet");
  }, [address, router]);

  if (!address) return null;

  return (
    <main className="mx-auto max-w-lg px-6 py-12">
      <PageHeader title="Start a Samooh" description="Form a new collective." />
      <Card className="mt-8">
        <StartSamooh creatorWallet={address} />
      </Card>
    </main>
  );
}
