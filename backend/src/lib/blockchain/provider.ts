import { JsonRpcProvider } from "ethers";
import { getBlockchainConfig } from "./config";

let provider: JsonRpcProvider | null = null;

/**
 * Read-only RPC provider. The backend never holds a signer/private key —
 * all state-changing transactions happen client-side via the user's wallet.
 */
export function getProvider(): JsonRpcProvider {
  const { rpcUrl } = getBlockchainConfig();
  if (!rpcUrl) {
    throw new Error("POLYGON_AMOY_RPC_URL is not configured");
  }
  if (!provider) {
    provider = new JsonRpcProvider(rpcUrl);
  }
  return provider;
}
