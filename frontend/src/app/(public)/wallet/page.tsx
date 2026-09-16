"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Wallet } from "lucide-react";
import { useWallet } from "@/lib/wallet/provider";
import { Button } from "@/components/ui/Button";

export default function WalletPage() {
  const { address, isConnecting, error, connect, isCorrectNetwork, switchNetwork } = useWallet();
  const router = useRouter();

  useEffect(() => {
    if (address && isCorrectNetwork) {
      router.replace("/onboarding");
    }
  }, [address, isCorrectNetwork, router]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center">
      <Wallet className="h-8 w-8 text-primary" aria-hidden="true" />
      <div>
        <h1 className="text-h2 text-text-primary">Connect your wallet</h1>
        <p className="mt-2 max-w-sm text-body text-text-secondary">
          SAMOOH uses your wallet as your identity. Connect MetaMask on Polygon Amoy to continue.
        </p>
      </div>

      {!address && (
        <Button size="lg" onClick={connect} isLoading={isConnecting}>
          Connect MetaMask
        </Button>
      )}

      {address && !isCorrectNetwork && (
        <Button size="lg" variant="danger" onClick={switchNetwork}>
          Switch to Polygon Amoy
        </Button>
      )}

      {error && (
        <p role="alert" className="text-body-sm text-error">
          {error}
        </p>
      )}
    </main>
  );
}
