/* eslint-disable @typescript-eslint/no-unused-vars */
import { createConfig, http, WagmiProvider } from "wagmi";
import { celo, base } from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { farcasterFrame } from "@farcaster/frame-wagmi-connector";
import { coinbaseWallet, metaMask, walletConnect } from "wagmi/connectors";
import { APP_NAME, APP_ICON_URL, APP_URL } from "~/lib/constants";
import { useEffect, useState, useMemo } from "react";
import { useConnect, useAccount } from "wagmi";
import React from "react";
import { useChainMode } from "~/app/chain-mode/context";

// Custom hook for Coinbase Wallet detection and auto-connection
function useCoinbaseWalletAutoConnect() {
  const [isCoinbaseWallet, setIsCoinbaseWallet] = useState(false);
  const { connect, connectors } = useConnect();
  const { isConnected } = useAccount();

  useEffect(() => {
    // Check if we're running in Coinbase Wallet
    const checkCoinbaseWallet = () => {
      const isInCoinbaseWallet =
        window.ethereum?.isCoinbaseWallet ||
        window.ethereum?.isCoinbaseWalletExtension ||
        window.ethereum?.isCoinbaseWalletBrowser;
      setIsCoinbaseWallet(!!isInCoinbaseWallet);
    };

    checkCoinbaseWallet();
    window.addEventListener("ethereum#initialized", checkCoinbaseWallet);

    return () => {
      window.removeEventListener("ethereum#initialized", checkCoinbaseWallet);
    };
  }, []);

  useEffect(() => {
    // Auto-connect if in Coinbase Wallet and not already connected
    if (isCoinbaseWallet && !isConnected) {
      connect({ connector: connectors[1] }); // Coinbase Wallet connector
    }
  }, [isCoinbaseWallet, isConnected, connect, connectors]);

  return isCoinbaseWallet;
}

const queryClient = new QueryClient();

function ConfiguredWagmiProvider({ children }: { children: React.ReactNode }) {
  const { mode } = useChainMode();

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const config = useMemo(() => {
    const chains = [celo, base] as const;
    return createConfig({
      chains,
      transports: {
        [celo.id]: http(),
        [base.id]: http("https://base-mainnet.g.alchemy.com/v2/ImPte7otRAJ_4gDny9NLO_Ao9GT4_CiQ"),
      },
      connectors: [
        farcasterFrame(),
        // coinbaseWallet({
        //   appName: APP_NAME,
        //   appLogoUrl: APP_ICON_URL,
        //   preference: "all",
        // }),
        // metaMask({
        //   dappMetadata: {
        //     name: APP_NAME,
        //     url: APP_URL,
        //   },
        // }),
        walletConnect({
          projectId: "12ed680dece83c5e9afbcb9ea589bda9",
        }),
      ],
    });
  }, []);

  return <WagmiProvider config={config}>{children}</WagmiProvider>;
}

// Wrapper component that provides Coinbase Wallet auto-connection
function CoinbaseWalletAutoConnect({
  children,
}: {
  children: React.ReactNode;
}) {
  useCoinbaseWalletAutoConnect();
  return <>{children}</>;
}

export default function Provider({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ConfiguredWagmiProvider>
        {children}
      </ConfiguredWagmiProvider>
    </QueryClientProvider>
  );
}
