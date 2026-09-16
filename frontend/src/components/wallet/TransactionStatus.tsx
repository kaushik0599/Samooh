import { CheckCircle2, XCircle, ExternalLink, Wallet } from "lucide-react";
import type { TxState } from "@/lib/wallet/types";
import { AMOY_NETWORK_PARAMS } from "@/lib/wallet/network";
import { Button } from "@/components/ui/Button";

const EXPLORER_BASE = AMOY_NETWORK_PARAMS.blockExplorerUrls[0];

function truncateHash(hash: string): string {
  return `${hash.slice(0, 10)}...${hash.slice(-8)}`;
}

function explorerUrl(hash: string): string {
  return `${EXPLORER_BASE}/tx/${hash}`;
}

export interface TransactionStatusProps {
  /** The live TxState from useTransaction() — never a default/fabricated value. */
  state: TxState;
  /** Optional retry callback, shown only alongside a real failure state. */
  onRetry?: () => void;
  className?: string;
}

/**
 * Renders the real lifecycle of a single wallet-signed transaction
 * (src/lib/wallet/useTransaction.ts). This component only ever displays
 * data passed to it via `state` — it has no default hash, no placeholder
 * success, and no timer-based fake progress. When the real Governance/
 * Treasury ABI lands and a write action (e.g. VotePanel's vote buttons)
 * can call a real contract method through useTransaction(), that call
 * site should render <TransactionStatus state={state} onRetry={...} />
 * using the `state` returned by its own useTransaction() call — this
 * component does not call useTransaction() itself, so it stays reusable
 * across every future write flow (voting, execution, etc.).
 */
export function TransactionStatus({ state, onRetry, className }: TransactionStatusProps) {
  if (state.status === "idle") return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex items-center gap-2 rounded-md border border-border bg-surface px-3 py-2 text-body-sm ${className ?? ""}`}
    >
      {state.status === "waiting_for_wallet" && (
        <>
          <Wallet className="h-4 w-4 shrink-0 text-text-secondary" aria-hidden="true" />
          <span className="text-text-secondary">Confirm in your wallet...</span>
        </>
      )}

      {state.status === "processing" && (
        <>
          <span
            aria-hidden="true"
            className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent text-primary"
          />
          <span className="text-text-secondary">
            Processing —{" "}
            <a
              href={explorerUrl(state.hash)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-primary underline underline-offset-2 hover:no-underline"
            >
              {truncateHash(state.hash)}
              <ExternalLink className="h-3 w-3" aria-hidden="true" />
              <span className="sr-only">(opens transaction on Polygon Amoy explorer in a new tab)</span>
            </a>
          </span>
        </>
      )}

      {state.status === "success" && (
        <>
          <CheckCircle2 className="h-4 w-4 shrink-0 text-success" aria-hidden="true" />
          <span className="text-text-primary">
            Confirmed —{" "}
            <a
              href={explorerUrl(state.hash)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-primary underline underline-offset-2 hover:no-underline"
            >
              {truncateHash(state.hash)}
              <ExternalLink className="h-3 w-3" aria-hidden="true" />
              <span className="sr-only">(opens transaction on Polygon Amoy explorer in a new tab)</span>
            </a>
          </span>
        </>
      )}

      {state.status === "failure" && (
        <>
          <XCircle className="h-4 w-4 shrink-0 text-error" aria-hidden="true" />
          <span className="flex-1 text-error">{state.error}</span>
          {onRetry && (
            <Button variant="secondary" size="sm" onClick={onRetry}>
              Retry
            </Button>
          )}
        </>
      )}
    </div>
  );
}
