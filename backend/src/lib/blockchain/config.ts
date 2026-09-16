export function getBlockchainConfig() {
  return {
    rpcUrl: process.env.POLYGON_AMOY_RPC_URL || "",
    chainId: process.env.NEXT_PUBLIC_CHAIN_ID || "80002",
    governanceContract: process.env.NEXT_PUBLIC_GOVERNANCE_CONTRACT || "",
    treasuryContract: process.env.NEXT_PUBLIC_TREASURY_CONTRACT || "",
  };
}

export function isBlockchainConfigured(): boolean {
  const c = getBlockchainConfig();
  return Boolean(c.rpcUrl && c.governanceContract && c.treasuryContract);
}
