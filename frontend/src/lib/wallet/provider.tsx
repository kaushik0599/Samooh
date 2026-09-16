"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { BrowserProvider, type JsonRpcSigner } from "ethers";
import { TARGET_CHAIN_ID, switchToAmoy } from "./network";
import "./types";

interface WalletContextValue {
  address: string | null;
  chainId: number | null;
  isConnecting: boolean;
  isCorrectNetwork: boolean;
  provider: BrowserProvider | null;
  /** Resolves once MetaMask has authorized a signer for the connected account. */
  getSigner: () => Promise<JsonRpcSigner>;
  connect: () => Promise<void>;
  disconnect: () => void;
  switchNetwork: () => Promise<void>;
  error: string | null;
}

const WalletContext = createContext<WalletContextValue | null>(null);

/**
 * Wallet connection is intentionally NOT persisted as "authenticated
 * identity" beyond this session's in-memory state — the backend does not
 * verify wallet signatures (see docs/BACKEND_ARCHITECTURE.md "Trust
 * Model"). This context only tracks what MetaMask itself reports.
 */
export function WalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const provider = useMemo(() => {
    if (typeof window === "undefined" || !window.ethereum) return null;
    return new BrowserProvider(window.ethereum);
  }, []);

  const refreshAccounts = useCallback(async () => {
    if (!provider) return;
    const accounts = await provider.send("eth_accounts", []);
    setAddress(accounts[0] ?? null);
    const network = await provider.getNetwork();
    setChainId(Number(network.chainId));
  }, [provider]);

  useEffect(() => {
    refreshAccounts();

    const ethereum = typeof window !== "undefined" ? window.ethereum : undefined;
    if (!ethereum) return;

    const handleAccountsChanged = (...args: unknown[]) => {
      const accounts = args[0] as string[];
      setAddress(accounts[0] ?? null);
    };
    const handleChainChanged = () => {
      // Per MetaMask's own guidance, a full reload is the safest way to
      // reset all chain-dependent state.
      window.location.reload();
    };

    ethereum.on("accountsChanged", handleAccountsChanged);
    ethereum.on("chainChanged", handleChainChanged);
    return () => {
      ethereum.removeListener("accountsChanged", handleAccountsChanged);
      ethereum.removeListener("chainChanged", handleChainChanged);
    };
  }, [refreshAccounts]);

  const connect = useCallback(async () => {
    setError(null);
    if (!window.ethereum) {
      setError("No wallet found. Install MetaMask to continue.");
      return;
    }
    setIsConnecting(true);
    try {
      const browserProvider = new BrowserProvider(window.ethereum);
      const accounts = await browserProvider.send("eth_requestAccounts", []);
      setAddress(accounts[0] ?? null);
      const network = await browserProvider.getNetwork();
      setChainId(Number(network.chainId));
    } catch {
      setError("Wallet connection was rejected or failed.");
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    // MetaMask has no programmatic "disconnect" — this only clears local state.
    setAddress(null);
  }, []);

  const switchNetwork = useCallback(async () => {
    if (!window.ethereum) return;
    setError(null);
    try {
      await switchToAmoy(window.ethereum);
    } catch {
      setError("Could not switch to the Polygon Amoy network.");
    }
  }, []);

  const getSigner = useCallback(async () => {
    if (!provider) throw new Error("No wallet provider available");
    return provider.getSigner();
  }, [provider]);

  const value: WalletContextValue = {
    address,
    chainId,
    isConnecting,
    isCorrectNetwork: chainId === TARGET_CHAIN_ID,
    provider,
    getSigner,
    connect,
    disconnect,
    switchNetwork,
    error,
  };

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet(): WalletContextValue {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used within a WalletProvider");
  return ctx;
}
