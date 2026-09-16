import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";

dotenv.config();

const PRIVATE_KEY = process.env.PRIVATE_KEY;
const POLYGON_AMOY_RPC_URL = process.env.POLYGON_AMOY_RPC_URL || "";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    hardhat: {},
    amoy: {
      url: POLYGON_AMOY_RPC_URL,
      chainId: 80002,
      // Never hardcoded, never committed — only present if the repo owner
      // supplies a real funded key via .env (see .env.example). Config
      // must still load cleanly with no key present, for local testing.
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
    },
  },
};

export default config;
