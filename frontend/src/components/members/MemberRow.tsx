"use client";

import { Copy } from "lucide-react";
import type { Member } from "@samooh/types";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/components/ui/Toast";

function truncateAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function MemberRow({ member }: { member: Member }) {
  const { show } = useToast();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(member.wallet_address);
      show("Wallet address copied", "success");
    } catch {
      show("Couldn't copy address", "error");
    }
  };

  return (
    <div className="flex items-center justify-between gap-3 border-b border-border py-3 last:border-0">
      <div className="flex items-center gap-3">
        <Avatar seed={member.wallet_address} />
        <div>
          <div className="flex items-center gap-1.5">
            <p className="text-body-sm font-medium text-text-primary">
              {truncateAddress(member.wallet_address)}
            </p>
            <button
              type="button"
              onClick={handleCopy}
              aria-label="Copy wallet address"
              className="rounded-sm p-0.5 text-text-secondary transition-colors hover:text-primary"
            >
              <Copy className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
          <p className="text-caption text-text-secondary">
            Joined {new Date(member.joined_at).toLocaleDateString()}
          </p>
        </div>
      </div>
      {member.role === "admin" && <Badge tone="info">Admin</Badge>}
    </div>
  );
}
