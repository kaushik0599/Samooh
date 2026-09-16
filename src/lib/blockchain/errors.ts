import { isAddress } from "ethers";

export class BlockchainNotConfiguredError extends Error {
  constructor(what: string) {
    super(`${what} is not configured`);
  }
}

/**
 * Throws BlockchainNotConfiguredError if `address` is missing or malformed,
 * so a bad NEXT_PUBLIC_GOVERNANCE_CONTRACT/TREASURY_CONTRACT env var (or a
 * bad per-Samooh override) fails with a clear message instead of a
 * cryptic ethers error once it reaches `new Contract(...)`.
 */
export function requireConfiguredAddress(address: string, what: string): string {
  if (!address) {
    throw new BlockchainNotConfiguredError(what);
  }
  if (!isAddress(address)) {
    throw new BlockchainNotConfiguredError(`${what} (malformed address)`);
  }
  return address;
}
