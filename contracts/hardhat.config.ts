import type { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox-viem";
import { config as dotEnvConfig } from "dotenv";

dotEnvConfig();
const config: HardhatUserConfig = {
  networks: {
    alfajores: {
      accounts: [process.env.PRIVATE_KEY ?? "0x0"],
      url: "https://alfajores-forno.celo-testnet.org",
    },
    celo: {
      accounts: [process.env.PRIVATE_KEY ?? "0x0"],
      url: "https://celo-mainnet.g.alchemy.com/v2/ImPte7otRAJ_4gDny9NLO_Ao9GT4_CiQ",
    },
    base: {
      accounts: [process.env.PRIVATE_KEY ?? "0x0"],
      url: "https://mainnet.base.org",
      chainId: 8453,
    },
    baseSepolia: {
      accounts: [process.env.PRIVATE_KEY ?? "0x0"],
      url: "https://sepolia.base.org",
      chainId: 84532,
    },
  },
  etherscan: {
    apiKey: {
      alfajores: process.env.CELOSCAN_API_KEY ?? "",
      celo: process.env.CELOSCAN_API_KEY ?? "",
      base: process.env.BASESCAN_API_KEY ?? "", // Add your BaseScan API key to .env
      baseSepolia: process.env.BASESCAN_API_KEY ?? "", // Can use same API key for both
    },
    customChains: [
      {
        chainId: 44_787,
        network: "alfajores",
        urls: {
          apiURL: "https://api-alfajores.celoscan.io/api",
          browserURL: "https://alfajores.celoscan.io",
        },
      },
      {
        chainId: 42_220,
        network: "celo",
        urls: {
          apiURL: "https://api.celoscan.io/api",
          browserURL: "https://celoscan.io/",
        },
      },
      {
        chainId: 8453,
        network: "base",
        urls: {
          apiURL: "https://api.basescan.org/api",
          browserURL: "https://basescan.org",
        },
      },
      {
        chainId: 84532,
        network: "baseSepolia",
        urls: {
          apiURL: "https://api-sepolia.basescan.org/api",
          browserURL: "https://sepolia.basescan.org",
        },
      },
    ],
  },
  sourcify: {
    enabled: false,
  },
  solidity: "0.8.24",
};

export default config;
