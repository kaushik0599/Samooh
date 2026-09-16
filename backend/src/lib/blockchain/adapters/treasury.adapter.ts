import { formatEther } from "ethers";
import { getProvider } from "../provider";
import { getBlockchainConfig } from "../config";
import { requireConfiguredAddress } from "@samooh/types/blockchain";
import type { TreasuryState } from "@samooh/types";

/**
 * `contractAddress` defaults to the env-configured contract but can be
 * overridden per-Samooh (see samoohs.treasury_contract).
 */
export async function getTreasuryBalance(contractAddress?: string): Promise<TreasuryState> {
  const { chainId } = getBlockchainConfig();
  const address = requireConfiguredAddress(
    contractAddress || getBlockchainConfig().treasuryContract,
    "Treasury contract address"
  );

  // Native MATIC balance works without any ABI; ERC-20 treasury balances
  // require the real Treasury ABI and are added once it's available.
  const provider = getProvider();
  const balanceWei = await provider.getBalance(address);

  return {
    balance: formatEther(balanceWei),
    network: `polygon-amoy:${chainId}`,
    treasuryContract: address,
  };
}
