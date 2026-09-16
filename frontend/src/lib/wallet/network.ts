/**
 * Polygon Amoy testnet — the only network this app targets (see
 * docs/BLOCKCHAIN_INTEGRATION.md). Chain id comes from
 * NEXT_PUBLIC_CHAIN_ID so a future network change doesn't require a code
 * change, but the RPC/explorer URLs below are Amoy-specific public
 * endpoints, not invented values.
 */
export const TARGET_CHAIN_ID = Number(process.env.NEXT_PUBLIC_CHAIN_ID ?? 80002);
export const TARGET_CHAIN_ID_HEX = `0x${TARGET_CHAIN_ID.toString(16)}`;

export const AMOY_NETWORK_PARAMS = {
  chainId: TARGET_CHAIN_ID_HEX,
  chainName: "Polygon Amoy Testnet",
  nativeCurrency: { name: "POL", symbol: "POL", decimals: 18 },
  rpcUrls: ["https://rpc-amoy.polygon.technology"],
  blockExplorerUrls: ["https://amoy.polygonscan.com"],
};

/** Prompts MetaMask to switch to Amoy, adding it first if the wallet doesn't know it yet. */
export async function switchToAmoy(ethereum: NonNullable<Window["ethereum"]>): Promise<void> {
  try {
    await ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: TARGET_CHAIN_ID_HEX }],
    });
  } catch (err) {
    const code = (err as { code?: number })?.code;
    // 4902: chain not added to the wallet yet.
    if (code === 4902) {
      await ethereum.request({
        method: "wallet_addEthereumChain",
        params: [AMOY_NETWORK_PARAMS],
      });
    } else {
      throw err;
    }
  }
}
