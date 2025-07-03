/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useState, useEffect, useCallback } from "react";
import {
  useAccount,
  useDisconnect,
  useConnect,
  usePublicClient,
  useWriteContract,
  useSwitchChain,
  useChainId,
  useSendTransaction,
} from "wagmi";
import { useSession } from "next-auth/react";
import { signOut } from "next-auth/react";
import sdk from "@farcaster/frame-sdk";
import { encodeFunctionData, formatEther, parseEther, parseUnits } from "viem";
import { useFrame } from "~/components/providers/FrameProvider";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  Wallet,
  Home,
  Send,
  ArrowLeftRight,
  Trophy,
  LogOut,
  ChevronRight,
  Clock,
  AlertCircle,
} from "lucide-react";
import { Button } from "~/components/ui/Button";
import HomeTab from "~/components/tabs/HomeTab";
import TransactTab from "~/components/tabs/TransactTab";
import SwapBridgeTab from "~/components/tabs/SwapBridgeTab";
import { truncateAddress } from "~/lib/truncateAddress";
import { ERC20_ABI, useBankContract } from "~/hooks/contracts";
import { useChainMode } from "~/app/chain-mode/context";
import { celo, base } from "viem/chains";
import { getDataSuffix, submitReferral } from "@divvi/referral-sdk";
import { cubesImage } from "~/constants/images";
import { cn } from "~/lib/utils";
import Rewards from "./tabs/rewards";
import WelcomeModal from "./main/Welcome-Modal";
import Header from "./main/Header";

export default function Main({ title = "Bank of Celo" }: { title?: string }) {
  const { address, isConnected, chain } = useAccount();
  const { disconnect } = useDisconnect();
  const { connect, connectors } = useConnect();
  const { switchChain, isPending: isSwitchChainPending } = useSwitchChain();
  const { data: session, status } = useSession();
  const { sendTransactionAsync } = useSendTransaction();
  const publicClient = usePublicClient();
  const { writeContractAsync, isPending } = useWriteContract();
  const { isSDKLoaded, context } = useFrame();

  const [activeTab, setActiveTab] = useState("home");
  const [vaultBalance, setVaultBalance] = useState<string>("0");
  const [showWelcome, setShowWelcome] = useState(() => {
    if (typeof window !== "undefined") {
      return !localStorage.getItem("hasSeenWelcome");
    }
    return true;
  });
  const [isLoading, setIsLoading] = useState(false);
  const [claimCooldown, setClaimCooldown] = useState<number>(0);
  const [lastClaimAt, setLastClaimAt] = useState<number>(0);
  const [maxClaim, setMaxClaim] = useState<string>("0");
  const [vaultStatus, setVaultStatus] = useState({
    currentBalance: "0",
    minReserve: "0",
    availableForClaims: "0",
  });

  const { mode } = useChainMode();
  const { address: bankAddress, abi: bankAbi } = useBankContract();
  const chainId = useChainId();
  const targetChain = mode === "degen" ? base : celo;
  const isCorrectChain = chain?.id === targetChain.id;
  const showSwitchNetworkBanner = isConnected && !isCorrectChain;

  console.log("Current chain ID:", chainId);
  console.log("Is correct chain:", isCorrectChain);

  const handleSwitchChain = useCallback(() => {
    try {
      switchChain({ chainId: targetChain.id });
    } catch (error) {
      console.error("Chain switch failed:", error, {
        targetChainId: targetChain.id,
      });
      toast.error(`Failed to switch to ${targetChain.name}. Please try again.`);
    }
  }, [switchChain, targetChain]);

  const fetchContractData = useCallback(async () => {
    if (!publicClient || !address || !isCorrectChain) return;
    try {
      const data = await Promise.all([
        publicClient.readContract({
          address: bankAddress as `0x${string}`,
          abi: bankAbi,
          functionName: "getVaultStatus",
        }),
        publicClient.readContract({
          address: bankAddress as `0x${string}`,
          abi: bankAbi,
          functionName: "claimCooldown",
        }),
        publicClient.readContract({
          address: bankAddress as `0x${string}`,
          abi: bankAbi,
          functionName: "lastClaimAt",
          args: [address],
        }),
        publicClient.readContract({
          address: bankAddress as `0x${string}`,
          abi: bankAbi,
          functionName: "MAX_CLAIM",
        }),
      ]);

      const [status, cooldown, lastClaim, maxClaimAmount] = data;
      const [currentBalance, minReserve, availableForClaims] = status as [
        bigint,
        bigint,
        bigint,
      ];

      const newVaultStatus = {
        currentBalance: formatEther(currentBalance),
        minReserve: formatEther(minReserve),
        availableForClaims: formatEther(availableForClaims),
      };

      // Only update state if values have changed
      setVaultStatus((prev) => {
        if (
          prev.currentBalance === newVaultStatus.currentBalance &&
          prev.minReserve === newVaultStatus.minReserve &&
          prev.availableForClaims === newVaultStatus.availableForClaims
        ) {
          return prev;
        }
        return newVaultStatus;
      });
      setVaultBalance((prev) =>
        prev === formatEther(currentBalance)
          ? prev
          : formatEther(currentBalance),
      );
      setClaimCooldown((prev) =>
        prev === Number(cooldown) ? prev : Number(cooldown),
      );
      setLastClaimAt((prev) =>
        prev === Number(lastClaim) ? prev : Number(lastClaim),
      );
      setMaxClaim((prev) =>
        prev === formatEther(maxClaimAmount as bigint)
          ? prev
          : formatEther(maxClaimAmount as bigint),
      );
    } catch (error) {
      console.error("Failed to fetch contract data:", error);
      toast.error("Failed to fetch contract data. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [publicClient, address, isCorrectChain]);

  useEffect(() => {
    fetchContractData();
    const interval = setInterval(fetchContractData, 3000);
    return () => clearInterval(interval);
  }, [fetchContractData]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tabParam = urlParams.get("tab");

    if (tabParam === "rewards") {
      // Close welcome modal and navigate to rewards tab
      setShowWelcome(false);
      setActiveTab("rewards");
      // Also set the welcome localStorage to prevent it from showing
      localStorage.setItem("hasSeenWelcome", "true");
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      if (!sdk || !sdk?.actions?.addFrame) return;
      sdk.actions.ready({});
      await sdk.actions.addFrame();
    };

    load();
  }, []);


const handleDonate = async (amount: string) => {
  if (!isCorrectChain) {
    toast.error(`Please switch to ${targetChain.name} Network`);
    return;
  }

  if (!address) {
    toast.error("Please connect your wallet");
    return;
  }

  if (!publicClient) {
    toast.error("Public client is not available. Please try again.");
    return;
  }

  if (Number(amount) <= 0) {
    toast.error("Please enter a valid amount");
    return;
  }

  try {
    let donateData: `0x${string}`;
    let transactionParams: Parameters<typeof sendTransactionAsync>[0];

    if (mode === "degen") {
      // Base chain: DEGEN token donation
      const degenAmount = parseUnits(amount, 18); // DEGEN has 18 decimals
      const degenTokenAddress = "0x4ed4E862860beD51a9570b96d89aF5E1B0Efefed"; // DEGEN on Base mainnet
      const bankContractAddress = bankAddress as `0x${string}`;

      // 1. Check DEGEN token balance (debugging)
      const balance = await publicClient.readContract({
        address: degenTokenAddress as `0x${string}`,
        abi: ERC20_ABI,
        functionName: "balanceOf",
        args: [address],
      }) as bigint;
      console.log(`DEGEN Balance: ${formatEther(balance)} DEGEN`);
      if (balance < degenAmount) {
        toast.error(`Insufficient DEGEN balance. Available: ${formatEther(balance)} DEGEN`);
        return;
      }

      // 2. Check DEGEN token allowance
      const allowance = await publicClient.readContract({
        address: degenTokenAddress as `0x${string}`,
        abi: ERC20_ABI,
        functionName: "allowance",
        args: [address, bankContractAddress],
      }) as bigint;
      console.log(`Current Allowance: ${formatEther(allowance)} DEGEN`);

      // 3. Approve DEGEN tokens if allowance is insufficient
      if (allowance < degenAmount) {
        toast.info("Approving DEGEN tokens for donation...");
        const approveHash = await writeContractAsync({
          address: degenTokenAddress as `0x${string}`,
          abi: ERC20_ABI,
          functionName: "approve",
          args: [bankContractAddress, degenAmount], // Exact amount approval
          chainId: targetChain.id,
        });
        await publicClient.waitForTransactionReceipt({ hash: approveHash });
        toast.success("DEGEN token approval successful!");
      }

      // 4. Verify allowance after approval
      const updatedAllowance = await publicClient.readContract({
        address: degenTokenAddress as `0x${string}`,
        abi: ERC20_ABI,
        functionName: "allowance",
        args: [address, bankContractAddress],
      }) as bigint;
      console.log(`Updated Allowance: ${formatEther(updatedAllowance)} DEGEN`);
      if (updatedAllowance < degenAmount) {
        throw new Error("Approval amount insufficient after update");
      }

      // 5. Encode donate function call with amount
      donateData = encodeFunctionData({
        abi: bankAbi,
        functionName: "donate",
        args: [degenAmount],
      });

      // 6. Set transaction params (no value for ERC-20, confirming DEGEN donation)
      transactionParams = {
        to: bankContractAddress,
        data: donateData,
        chainId: targetChain.id, // 8453 for Base mainnet
        maxFeePerGas: parseUnits("100", 9), // Fixed gas for now
        maxPriorityFeePerGas: parseUnits("100", 9), // Fixed gas for now
      };
      console.log("Transaction Params:", transactionParams);
    } else {
      // Celo chain: CELO native currency donation
      const celoAmount = parseEther(amount); // CELO has 18 decimals
      donateData = encodeFunctionData({
        abi: bankAbi,
        functionName: "donate",
        args: [],
      });
      transactionParams = {
        to: bankAddress as `0x${string}`,
        data: donateData,
        value: celoAmount,
        chainId: targetChain.id, // 42220 for Celo mainnet
        maxFeePerGas: parseUnits("100", 9),
        maxPriorityFeePerGas: parseUnits("100", 9),
      };
    }

    // 5. Get the referral data suffix
    const dataSuffix = getDataSuffix({
      consumer: "0xC5337CeE97fF5B190F26C4A12341dd210f26e17c",
      providers: [
        "0x0423189886d7966f0dd7e7d256898daeee625dca",
        "0xc95876688026be9d6fa7a7c33328bd013effa2bb",
        "0x5f0a55fad9424ac99429f635dfb9bf20c3360ab8",
      ],
    });

    // 6. Combine the data
    const combinedData = dataSuffix
      ? donateData + (dataSuffix.startsWith("0x") ? dataSuffix.slice(2) : dataSuffix)
      : donateData;

    // 7. Update transaction params with combined data
    transactionParams.data = combinedData as `0x${string}`;

    // 8. Send the transaction
    const hash = await sendTransactionAsync(transactionParams);

    // 9. Show success toast and update contract data
    toast.success(`Donation successful! Transaction hash: ${hash.slice(0, 6)}...`);
    fetchContractData();

    // 10. Report to Divi in a separate try-catch
    try {
      console.log("Submitting referral to Divi:", {
        txHash: hash,
        chainId: targetChain.id,
      });
      await submitReferral({
        txHash: hash,
        chainId: targetChain.id,
      });
      console.log("Referral submitted successfully");
    } catch (diviError) {
      console.error("Divi submitReferral error:", diviError);
      toast.warning(
        "Donation succeeded, but referral tracking failed. We're looking into it.",
      );
    }
  } catch (error: any) {
    console.error("Donation error:", error);
    toast.error(
      `Donation failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
    // Log detailed error for debugging
    if (error.cause) console.error("Detailed error cause:", error.cause);
  }
};
  const handleConnect = () => {
    const connector =
      connectors.find((c) => c.id === "injected") || connectors[0]; // Prefer injected (MetaMask) or fallback
    connect({
      connector,
      chainId: targetChain.id,
    });
  };

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    toast.success("Signed out successfully!");
  };

  const handleCloseWelcome = () => {
    setShowWelcome(false);
    localStorage.setItem("hasSeenWelcome", "true");

    // Check if we should navigate to rewards tab after closing welcome
    const urlParams = new URLSearchParams(window.location.search);
    const tabParam = urlParams.get("tab");

    if (tabParam === "rewards") {
      setActiveTab("rewards");
      // Optionally clean up the URL
      window.history.replaceState({}, "", window.location.pathname);
    }
  };

  if (!isSDKLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-emerald-100 to-amber-100 dark:from-emerald-950 dark:to-amber-950">
        <motion.div
          animate={{ rotate: 360, scale: [1, 1.2, 1] }}
          transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
        >
          <Home className="w-12 h-12 text-emerald-500 dark:text-emerald-300" />
        </motion.div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-emerald-100 via-amber-50 to-emerald-100 dark:from-emerald-950 dark:via-gray-900 dark:to-emerald-950 flex flex-col"
      style={{
        paddingTop: context?.client.safeAreaInsets?.top ?? 0,
        paddingBottom: context?.client.safeAreaInsets?.bottom ?? 60,
        paddingLeft: context?.client.safeAreaInsets?.left ?? 0,
        paddingRight: context?.client.safeAreaInsets?.right ?? 0,
        backgroundImage: `url(${cubesImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
        backgroundRepeat: "no-repeat",
        minHeight: "100vh",
        // padding: '20px',
      }}
    >
      <div className=" min-h-[100vh] fixed inset-0 bg-emerald-800 opacity-50"></div>

      {/* Welcome Modal */}
      <WelcomeModal
        showWelcome={showWelcome}
        maxClaim={maxClaim}
        onClose={handleCloseWelcome}
      />

      <Header
        title={title}
        isConnected={isConnected}
        address={address}
        status={status}
        showSwitchNetworkBanner={isConnected && !isCorrectChain}
        isCorrectChain={isCorrectChain}
        isSwitchChainPending={isSwitchChainPending}
        onConnect={handleConnect}
        onDisconnect={disconnect}
        onSignOut={handleSignOut}
        onSwitchChain={handleSwitchChain}
      />

      {/* Content */}
      <div className="flex-1 p-4 overflow-y-auto max-w-md mx-auto w-full relative">
        {isLoading && (
          <div className="absolute inset-0 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-20 rounded-xl">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
              className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full"
            />
          </div>
        )}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === "home" && (
              <HomeTab
                vaultBalance={vaultBalance}
                vaultStatus={vaultStatus}
                isLoading={isLoading}
                onNavigate={(tab) => setActiveTab(tab)}
                maxClaim={maxClaim}
                claimCooldown={claimCooldown}
                lastClaimAt={lastClaimAt}
                isCorrectChain={isCorrectChain}
              />
            )}
            {activeTab === "transact" && (
              <TransactTab
                vaultBalance={vaultBalance}
                onDonate={handleDonate}
                maxClaim={maxClaim}
                availableForClaim={vaultStatus.availableForClaims}
                claimCooldown={claimCooldown}
                lastClaimAt={lastClaimAt}
                isCorrectChain={isCorrectChain}
                isPending={isPending}
              />
            )}
            {/* {activeTab === "swap" && <SwapBridgeTab isCorrectChain={isCorrectChain} />} */}
            {activeTab === "rewards" && <Rewards />}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom Navigation */}
      <motion.nav
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
        className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-lg shadow-t-lg border-t border-gray-200 dark:border-gray-700 flex justify-around py-2 px-4"
      >
        {[
          { id: "home", icon: <Home className="w-5 h-5" />, label: "Home" },
          {
            id: "transact",
            icon: <Send className="w-5 h-5" />,
            label: "Transact",
          },
          // { id: "swap", icon: <ArrowLeftRight className="w-5 h-5" />, label: "Swap" },
          {
            id: "rewards",
            icon: <Trophy className="w-5 h-5" />,
            label: "Rewards",
          },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`relative flex flex-col items-center p-2 rounded-xl transition-all ${
              activeTab === tab.id
                ? "text-white bg-gradient-to-r from-emerald-500 to-emerald-600 shadow-md"
                : "text-gray-600 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400"
            }`}
            aria-label={tab.label}
          >
            {tab.icon}
            <span className="text-xs mt-1">{tab.label}</span>
            {activeTab === tab.id && (
              <motion.div
                layoutId="activeTabIndicator"
                className="absolute bottom-0 w-1/2 h-1 bg-emerald-300 rounded-full"
              />
            )}
          </button>
        ))}
      </motion.nav>
    </div>
  );
}