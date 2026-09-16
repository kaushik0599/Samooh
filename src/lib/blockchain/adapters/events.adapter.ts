import { Contract } from "ethers";
import { getProvider } from "../provider";
import { getBlockchainConfig } from "../config";
import { GOVERNANCE_ABI } from "../abi/governance.abi";
import { TREASURY_ABI } from "../abi/treasury.abi";
import { BlockchainNotConfiguredError } from "../errors";
import { GOVERNANCE_EVENTS, TREASURY_EVENTS, type RawChainEvent } from "../events";
import type { ActivityType } from "@/types";

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
  const address = contractAddress || getBlockchainConfig().governanceContract;
  if (!address) throw new BlockchainNotConfiguredError("Governance contract address");
  if (GOVERNANCE_ABI.length === 0) throw new BlockchainNotConfiguredError("Governance contract ABI");

  const contract = new Contract(address, GOVERNANCE_ABI, getProvider());
  return queryEvents(contract, GOVERNANCE_EVENTS, fromBlock, toBlock);
}

export async function getTreasuryEvents(
  fromBlock: number,
  toBlock: number | "latest" = "latest",
  contractAddress?: string
): Promise<RawChainEvent[]> {
  const address = contractAddress || getBlockchainConfig().treasuryContract;
  if (!address) throw new BlockchainNotConfiguredError("Treasury contract address");
  if (TREASURY_ABI.length === 0) throw new BlockchainNotConfiguredError("Treasury contract ABI");

  const contract = new Contract(address, TREASURY_ABI, getProvider());
  return queryEvents(contract, TREASURY_EVENTS, fromBlock, toBlock);
}
