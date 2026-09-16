import type { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { MobileTopBar } from "./MobileTopBar";
import { MobileBottomNav } from "./MobileNav";
import { NetworkBanner } from "./NetworkBanner";
import { DemoBanner } from "./DemoBanner";

/**
 * Reusable authenticated shell: desktop sidebar + content, or mobile top
 * bar + content + bottom tab bar. Used once by app/(workspace)/layout.tsx
 * — no page under it re-implements navigation.
 */
export function WorkspaceShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <MobileTopBar />
        <DemoBanner />
        <NetworkBanner />
        <main className="flex-1 px-4 py-6 pb-24 lg:px-10 lg:py-10 lg:pb-10">
          <div className="mx-auto w-full max-w-5xl">{children}</div>
        </main>
        <MobileBottomNav />
      </div>
    </div>
  );
}
