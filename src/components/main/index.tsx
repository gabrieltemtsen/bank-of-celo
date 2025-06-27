/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useState, useEffect, useCallback } from "react";
import {
  useAccount,
  useDisconnect,
  useConnect,
  useSwitchChain,
  useChainId,
  useSendTransaction,
  useWriteContract,
} from "wagmi";
import { useSession } from "next-auth/react";
import { signOut } from "next-auth/react";
import sdk from "@farcaster/frame-sdk";
import { encodeFunctionData, parseEther, parseUnits } from "viem";
import { useFrame } from "~/components/providers/FrameProvider";
import { toast } from "sonner";
import type { Abi } from "viem";
import {
  BANK_OF_CELO_CONTRACT_ABI,
  BANK_OF_CELO_CONTRACT_ADDRESS,
  BANK_OF_DEGEN_ADDRESS,
  BANK_OF_DEGEN_ABI,
} from "~/lib/constants";

import { useChain } from "~/components/providers/ChainContext";
import { getDataSuffix, submitReferral } from "@divvi/referral-sdk";
import { cubesImage } from "~/constants/images";
import { useContractData } from "./hook/useMain";
import { useWelcomeModal } from "./hook/use-welcome-modal";
import LoadingSpinner from "./LoadingSpinner";
import WelcomeModal from "./Welcome-Modal";
import Header from "./Header";
import TabContent from "./TabContent";
import BottomNavigation from "./BottomNavigation";
import { useSearchParams } from "next/navigation";

export default function Main({ title = "Bank of Celo" }: { title?: string }) {
  const { address, isConnected, chain } = useAccount();
  const { disconnect } = useDisconnect();
  const { connect, connectors } = useConnect();
  const { switchChain, isPending: isSwitchChainPending } = useSwitchChain();
  const { data: session, status } = useSession();
  const { sendTransactionAsync } = useSendTransaction();
  const { writeContract, isPending } = useWriteContract();
  const { isSDKLoaded, context } = useFrame();
  const searchParams = useSearchParams();
  const { chain: targetChain, mode, toggleMode } = useChain();

  const [customSearchParams, setCustomSearchParams] =
    useState<URLSearchParams | null>(null);
  const effectiveSearchParams = searchParams || customSearchParams;

  const [activeTab, setActiveTab] = useState("home");

  const chainId = useChainId();
  const isCorrectChain = chain?.id === targetChain.id;
  const showSwitchNetworkBanner = isConnected && !isCorrectChain;

  // Use our custom hooks
  const bankAddress =
    mode === "celo" ? BANK_OF_CELO_CONTRACT_ADDRESS : BANK_OF_DEGEN_ADDRESS;
  const bankAbi = (mode === "celo"
    ? BANK_OF_CELO_CONTRACT_ABI
    : BANK_OF_DEGEN_ABI) as Abi;

  const {
    vaultBalance,
    vaultStatus,
    claimCooldown,
    lastClaimAt,
    maxClaim,
    isLoading,
    fetchContractData,
  } = useContractData(address, isCorrectChain, bankAddress, bankAbi);

  const { showWelcome, setShowWelcome, handleCloseWelcome } = useWelcomeModal();

  console.log("Current chain ID:", chainId);
  console.log("Is correct chain:", isCorrectChain);

  // Handle URL redirect logic
  useEffect(() => {
    if (!effectiveSearchParams) return;

    const shouldRedirect = effectiveSearchParams.get("redirect") === "true";
    const url = effectiveSearchParams.get("url");

    if (shouldRedirect && url) {
      // Validate URL first
      try {
        new URL(url);
        sdk.actions.openUrl(url);
      } catch (error: unknown) {
        console.error("Invalid URL provided:", url, error);
      }
    }
  }, [effectiveSearchParams]);

  // URL parameter handling for rewards tab
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tabParam = urlParams.get("tab");

    if (tabParam === "rewards") {
      setShowWelcome(false);
      setActiveTab("rewards");
      if (typeof window !== "undefined") {
        localStorage.setItem("hasSeenWelcome", "true");
      }
    }
  }, [setShowWelcome]);

  // SDK initialization
  useEffect(() => {
    const load = async () => {
      if (!sdk || !sdk?.actions?.addFrame) return;
      sdk.actions.ready({});
      await sdk.actions.addFrame();
    };
    load();
  }, []);

  // Handler functions
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

  const handleConnect = useCallback(() => {
    const connector =
      connectors.find((c) => c.id === "injected") || connectors[0];
    connect({
      connector,
      chainId: targetChain.id,
    });
  }, [connectors, connect, targetChain]);

  const handleSignOut = useCallback(async () => {
    await signOut({ redirect: false });
    toast.success("Signed out successfully!");
  }, []);

  const handleWelcomeClose = useCallback(() => {
    const redirectTab = handleCloseWelcome();
    if (redirectTab) {
      setActiveTab(redirectTab);
      if (typeof window !== "undefined") {
        window.history.replaceState({}, "", window.location.pathname);
      }
    }
  }, [handleCloseWelcome]);

  const handleDonate = useCallback(
    async (amount: string) => {
      if (!isCorrectChain) {
        toast.error("Please switch to Celo Network");
        return;
      }

      if (Number(amount) <= 0) {
        toast.error("Please enter a valid amount");
        return;
      }

      try {
        // 1. Encode the donate function call
        const donateData = encodeFunctionData({
          abi: BANK_OF_CELO_CONTRACT_ABI,
          functionName: "donate",
        });

        // 2. Get the referral data suffix
        const dataSuffix = getDataSuffix({
          consumer: "0xC5337CeE97fF5B190F26C4A12341dd210f26e17c",
          providers: [
            "0x0423189886d7966f0dd7e7d256898daeee625dca",
            "0xc95876688026be9d6fa7a7c33328bd013effa2bb",
            "0x5f0a55fad9424ac99429f635dfb9bf20c3360ab8",
          ],
        });

        // 3. Properly combine the data
        const combinedData = dataSuffix
          ? donateData +
            (dataSuffix.startsWith("0x") ? dataSuffix.slice(2) : dataSuffix)
          : donateData;

        // 4. Send the transaction
        const hash = await sendTransactionAsync({
          to: bankAddress as `0x${string}`,
          data: combinedData as `0x${string}`,
          value: parseEther(amount),
          chainId: targetChain.id,
          maxFeePerGas: parseUnits("100", 9),
          maxPriorityFeePerGas: parseUnits("100", 9),
        });

        // 5. Show success toast and update contract data immediately
        toast.success(
          `Donation successful! Transaction hash: ${hash.slice(0, 6)}...`,
        );
        fetchContractData();

        // 6. Report to Divi in a separate try-catch
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
      } catch (error) {
        console.error("Donation error:", error);
        toast.error(
          `Donation failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
      }
    },
    [isCorrectChain, sendTransactionAsync, targetChain.id, fetchContractData],
  );

  // Show loading spinner if SDK is not loaded
  if (!isSDKLoaded) {
    return <LoadingSpinner isSDKLoading={true} />;
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
      }}
    >
      <div className="min-h-[100vh] fixed inset-0 bg-emerald-800 opacity-50"></div>

      {/* Welcome Modal */}
      <WelcomeModal
        showWelcome={showWelcome}
        maxClaim={maxClaim}
        onClose={handleWelcomeClose}
      />

      {/* Header */}
      <Header
        title={title}
        isConnected={isConnected}
        address={address}
        status={status}
        showSwitchNetworkBanner={showSwitchNetworkBanner}
        isCorrectChain={isCorrectChain}
        isSwitchChainPending={isSwitchChainPending}
        onConnect={handleConnect}
        onDisconnect={() => disconnect()}
        onSignOut={handleSignOut}
        onSwitchChain={handleSwitchChain}
        mode={mode}
        onToggleMode={toggleMode}
      />

      {/* Content */}
      <div className="flex-1 p-4 overflow-y-auto max-w-md mx-auto w-full relative">
        {isLoading && <LoadingSpinner />}

        <TabContent
          activeTab={activeTab}
          vaultBalance={vaultBalance}
          vaultStatus={vaultStatus}
          isLoading={isLoading}
          maxClaim={maxClaim}
          claimCooldown={claimCooldown}
          lastClaimAt={lastClaimAt}
          isCorrectChain={isCorrectChain}
          isPending={isPending}
          onNavigate={setActiveTab}
          onDonate={handleDonate}
        />
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}
