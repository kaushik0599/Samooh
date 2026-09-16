import { Contract } from "ethers";
import { getProvider } from "../provider";
import { getBlockchainConfig } from "../config";
import { GOVERNANCE_ABI, TREASURY_ABI, requireConfiguredAddress } from "@samooh/types/blockchain";
import { GOVERNANCE_EVENTS, TREASURY_EVENTS, type RawChainEvent } from "../events";
import type { ActivityType } from "@samooh/types";

async function queryEvents(
  contract: Contract,
  eventNames: readonly ActivityType[],
  fromBlock: number,
  toBlock: number | "latest"
): Promise<RawChainEvent[]> {
  const results: RawChainEvent[] = [];

  for (const eventName of eventNames) {
    const logs = await contract.queryFilter(eventName, fromBlock, toBlock);
    for (const log of logs) {
      const args =
        "args" in log && log.args
          ? (Object.fromEntries(
              Object.entries(log.args).filter(([key]) => Number.isNaN(Number(key)))
            ) as Record<string, unknown>)
          : {};
      results.push({ eventName, transactionHash: log.transactionHash, args });
    }
  }

  return results;
}

export async function getGovernanceEvents(
  fromBlock: number,
  toBlock: number | "latest" = "latest",
  contractAddress?: string
): Promise<RawChainEvent[]> {
  const address = requireConfiguredAddress(
    contractAddress || getBlockchainConfig().governanceContract,
    "Governance contract address"
  );
  const contract = new Contract(address, GOVERNANCE_ABI, getProvider());
  return queryEvents(contract, GOVERNANCE_EVENTS, fromBlock, toBlock);
}

export async function getTreasuryEvents(
  fromBlock: number,
  toBlock: number | "latest" = "latest",
  contractAddress?: string
): Promise<RawChainEvent[]> {
  const address = requireConfiguredAddress(
    contractAddress || getBlockchainConfig().treasuryContract,
    "Treasury contract address"
  );
  const contract = new Contract(address, TREASURY_ABI, getProvider());
  return queryEvents(contract, TREASURY_EVENTS, fromBlock, toBlock);
}
