"use client";

import { ThemeProvider } from "next-themes";
import type { ReactNode } from "react";
import { WalletProvider } from "@/lib/wallet/provider";
import { AppStateProvider } from "@/lib/state/app-state";
import { ToastProvider } from "@/components/ui/Toast";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <WalletProvider>
        <AppStateProvider>
          <ToastProvider>{children}</ToastProvider>
        </AppStateProvider>
      </WalletProvider>
    </ThemeProvider>
  );
}
