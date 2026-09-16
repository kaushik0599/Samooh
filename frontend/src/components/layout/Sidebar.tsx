"use client";

import Link from "next/link";
import { useWallet } from "@/lib/wallet/provider";
import { WORKSPACE_NAV_ITEMS, SETTINGS_NAV_ITEM } from "./nav-items";
import { NavLink } from "./NavLink";
import { WalletButton } from "@/components/wallet/WalletButton";

/**
 * Desktop sidebar for the authenticated workspace. No official logo asset
 * exists in this repository (see Sprint 0 report) — this uses a plain
 * typographic wordmark rather than recreating a mark that doesn't exist
 * here yet.
 */
export function Sidebar() {
  const { isCorrectNetwork } = useWallet();

  return (
    <aside className="hidden h-screen w-[238px] shrink-0 flex-col border-r border-border bg-surface lg:flex">
      <div className="flex items-center gap-2.5 px-5 py-6">
        <Link href="/overview" className="flex flex-col gap-1">
          <span className="text-h4 font-bold tracking-[0.16em] text-text-primary">SAMOOH</span>
          <span className="text-[7px] font-semibold tracking-[0.12em] text-text-secondary">
            EK SAMOOH, EK SOCH
          </span>
        </Link>
      </div>

      <nav aria-label="Workspace" className="flex-1 space-y-1 px-3">
        {WORKSPACE_NAV_ITEMS.map((item) => (
          <NavLink key={item.href} {...item} />
        ))}
      </nav>

      <div className="space-y-1 border-t border-border px-3 py-3">
        <NavLink {...SETTINGS_NAV_ITEM} />
      </div>

      <div className="m-3 mt-0 rounded-xl border border-border bg-surface-secondary p-3.5">
        <p className="text-caption font-semibold uppercase tracking-[0.1em] text-text-secondary">
          Connected wallet
        </p>
        <div className="mt-2">
          <WalletButton />
        </div>
        <div className="mt-2.5 flex items-center gap-1.5 text-caption text-text-secondary">
          <span
            className={`h-1.5 w-1.5 rounded-full ${isCorrectNetwork ? "bg-success" : "bg-error"}`}
            aria-hidden="true"
          />
          Polygon Amoy · Testnet
        </div>
      </div>
    </aside>
  );
}
