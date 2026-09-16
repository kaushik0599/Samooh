/** Lifecycle of a single wallet-signed transaction. */
export type TxState =
  | { status: "idle" }
  | { status: "waiting_for_wallet" }
  | { status: "processing"; hash: string }
  | { status: "success"; hash: string }
  | { status: "failure"; error: string };

export interface EthereumProvider {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on: (event: string, handler: (...args: unknown[]) => void) => void;
  removeListener: (event: string, handler: (...args: unknown[]) => void) => void;
  isMetaMask?: boolean;
}

declare global {
  interface Window {
    ethereum?: EthereumProvider;
  }
}
