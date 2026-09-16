"use client";

import { useCallback, useState } from "react";
import type { TxState } from "./types";

/**
 * Generic transaction-lifecycle runner: WAITING_FOR_WALLET -> PROCESSING ->
 * SUCCESS | FAILURE. `send` must return a real ethers `ContractTransactionResponse`
 * (or anything with a `.hash` and `.wait()`) — this hook never fabricates a
 * transaction hash or a success state.
 */
export function useTransaction() {
  const [state, setState] = useState<TxState>({ status: "idle" });

  const run = useCallback(
    async (send: () => Promise<{ hash: string; wait: () => Promise<unknown> }>) => {
      setState({ status: "waiting_for_wallet" });
      try {
        const tx = await send();
        setState({ status: "processing", hash: tx.hash });
        await tx.wait();
        setState({ status: "success", hash: tx.hash });
      } catch (err) {
        setState({
          status: "failure",
          error: err instanceof Error ? err.message : "Transaction failed",
        });
      }
    },
    []
  );

  const reset = useCallback(() => setState({ status: "idle" }), []);

  return { state, run, reset };
}
