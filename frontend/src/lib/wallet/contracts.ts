import { Contract, type JsonRpcSigner } from "ethers";
import { GOVERNANCE_ABI, TREASURY_ABI, BlockchainNotConfiguredError } from "@samooh/types/blockchain";

/**
 * Client-side contract instances, signed by the connected wallet — this is
 * the ONLY place in the app that may write to the blockchain (voting,
 * proposal execution, etc.). Reuses the shared, real, compiled ABI
 * (packages/types/src/blockchain.ts, sourced from contracts/artifacts/)
 * as the single source of truth so both frontend and backend update
 * together; it is pure data with no server-only code, so importing it
 * here is safe.
 *
 * The ABI itself is always present now — only a missing/unset per-network
 * contract address (NEXT_PUBLIC_GOVERNANCE_CONTRACT /
 * NEXT_PUBLIC_TREASURY_CONTRACT, populated once Amoy deployment happens)
 * still throws BlockchainNotConfiguredError rather than fabricating a
 * contract instance.
 */

function requireContractAddress(address: string | undefined, what: string): string {
  if (!address) throw new BlockchainNotConfiguredError(what);
  return address;
}

export function getGovernanceContract(signer: JsonRpcSigner): Contract {
  const address = requireContractAddress(
    process.env.NEXT_PUBLIC_GOVERNANCE_CONTRACT,
    "Governance contract address"
  );
  return new Contract(address, GOVERNANCE_ABI, signer);
}

export function getTreasuryContract(signer: JsonRpcSigner): Contract {
  const address = requireContractAddress(
    process.env.NEXT_PUBLIC_TREASURY_CONTRACT,
    "Treasury contract address"
  );
  return new Contract(address, TREASURY_ABI, signer);
}
