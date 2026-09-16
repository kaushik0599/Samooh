"use client";

import { useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useWallet } from "@/lib/wallet/provider";
import { useApiQuery } from "@/lib/api/useApiQuery";
import { discoverSamoohs } from "@/lib/api/endpoints";
import { PageHeader } from "@/components/ui/PageHeader";
import { SamoohMatchCard } from "@/components/discovery/SamoohMatchCard";
import { LoadingState } from "@/components/ui/LoadingState";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import { buttonVariants } from "@/components/ui/Button";
import { Compass } from "lucide-react";

export default function DiscoverPage() {
  const { address } = useWallet();
  const router = useRouter();

  const fetcher = useCallback(() => {
    if (!address) return Promise.reject(new Error("No wallet connected"));
    return discoverSamoohs(address);
  }, [address]);

  const query = useApiQuery(fetcher, [address]);

  useEffect(() => {
    if (!address) router.replace("/wallet");
  }, [address, router]);

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <PageHeader
        title="Discover Samoohs"
        description="Collectives matched to what you do and what you're looking for."
      />

      <div className="mt-8">
        {query.status === "loading" && <LoadingState label="Finding relevant Samoohs" />}

        {query.status === "error" && (
          <ErrorState message={query.error.message} onRetry={query.refetch} />
        )}

        {query.status === "success" && query.data.matches.length === 0 && (
          <EmptyState
            icon={<Compass className="h-6 w-6" aria-hidden="true" />}
            title="No suitable Samooh found nearby"
            description={query.data.suggestion?.reason}
            action={
              <Link href="/samooh/create" className={buttonVariants("primary", "md")}>
                Start a Samooh
              </Link>
            }
          />
        )}

        {query.status === "success" && query.data.matches.length > 0 && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {query.data.matches.map((result) => (
              <SamoohMatchCard key={result.samooh.id} result={result} />
            ))}
          </div>
        )}
      </div>

      {query.status === "success" && query.data.matches.length > 0 && (
        <div className="mt-8 flex justify-center">
          <Link href="/samooh/create" className={buttonVariants("ghost", "md")}>
            Don&apos;t see the right fit? Start a Samooh instead
          </Link>
        </div>
      )}
    </main>
  );
}
