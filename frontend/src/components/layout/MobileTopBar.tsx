"use client";

import Link from "next/link";
import { Settings } from "lucide-react";
import { WalletButton } from "@/components/wallet/WalletButton";

export function MobileTopBar() {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-surface px-4 py-3 pt-[env(safe-area-inset-top,0px)] lg:hidden">
      <Link href="/overview" className="text-h4 font-bold tracking-[0.16em] text-text-primary">
        SAMOOH
      </Link>
      <div className="flex items-center gap-2">
        <WalletButton />
        <Link
          href="/settings"
          aria-label="Settings"
          className="rounded-md p-2 text-text-secondary hover:bg-surface-secondary"
        >
          <Settings className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </header>
  );
}
