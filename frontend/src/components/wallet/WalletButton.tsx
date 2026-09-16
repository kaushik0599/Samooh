"use client";

import { Wallet, AlertTriangle } from "lucide-react";
import { useWallet } from "@/lib/wallet/provider";
import { Button } from "@/components/ui/Button";

function truncateAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function WalletButton() {
  const { address, isConnecting, isCorrectNetwork, connect, switchNetwork } = useWallet();

  if (!address) {
    return (
      <Button onClick={connect} isLoading={isConnecting} size="sm">
        <Wallet className="h-4 w-4" aria-hidden="true" />
        Connect wallet
      </Button>
    );
  }

  if (!isCorrectNetwork) {
    return (
      <Button onClick={switchNetwork} variant="danger" size="sm">
        <AlertTriangle className="h-4 w-4" aria-hidden="true" />
        Switch to Polygon Amoy
      </Button>
    );
  }

  return (
    <span className="flex items-center gap-2 rounded-md border border-border bg-surface px-3 py-1.5 text-body-sm text-text-primary">
      <span className="h-2 w-2 rounded-full bg-success" aria-hidden="true" />
      {truncateAddress(address)}
    </span>
  );
}
