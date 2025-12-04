/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  Flame,
  Gift,
  Loader2,
  AlertCircle,
  ChevronRight,
} from "lucide-react";
import { BottomSheet } from "../../components/bottomSheet";
import { Button } from "~/components/ui/Button";
import { toast } from "sonner";
import {
  useAccount,
  usePublicClient,
  useWriteContract,
  useSwitchChain,
  useSendTransaction,
  useBalance,
} from "wagmi";
import {
  CELO_CHECK_IN_CONTRACT_ADDRESS,
  CELO_CHECK_IN_ABI,
  DEGEN_DAILY_CHECKIN_ADDRESS,
  DEGEN_DAILY_CHECKIN_ABI,
} from "~/lib/constants";
import { encodeFunctionData, formatEther, parseEther, parseUnits } from "viem";
import { getDataSuffix, submitReferral } from "@divvi/referral-sdk";
import sdk from "@farcaster/frame-sdk";
import { base, celo } from "wagmi/chains";
import { useChainMode } from "~/app/chain-mode/context";
import { ERC20_ABI } from "~/hooks/contracts";

interface DailyCheckinSheetProps {
  isOpen: boolean;
  onClose: () => void;
}
interface SignatureResponse {
  signature: string;
  error?: string;
}

interface DashboardData {
  currentRoundNumber: bigint;
  userCheckIns: bigint;
  canClaim: boolean;
  checkedInToday: boolean;
  contractBalance: bigint;
  currentReward: bigint;
  currentFee: bigint;
  roundActive: boolean;
  roundStart: bigint;
  roundEnd: bigint;
  currentDay: bigint;
}

export const DailyCheckinSheet: React.FC<DailyCheckinSheetProps> = ({
  isOpen,
  onClose,
}) => {
  const { address, chainId } = useAccount();
  const publicClient = usePublicClient();
  const { writeContractAsync, isPending: isTxPending } = useWriteContract();
  const { switchChainAsync } = useSwitchChain();
  const { sendTransactionAsync } = useSendTransaction();
  const { mode } = useChainMode();
  const targetChain = mode === "degen" ? base : celo;
  const isCorrectChain = chainId === targetChain.id;
  const currency = mode === "degen" ? "DEGEN" : "CELO";
  const CHECK_IN_FEE = mode === "degen" ? parseUnits("1", 18) : parseEther("0.001"); // Adjust DEGEN fee as needed
  const { address: checkInAddress, abi: checkInAbi } = mode === "degen"
    ? { address: DEGEN_DAILY_CHECKIN_ADDRESS, abi: DEGEN_DAILY_CHECKIN_ABI }
    : { address: CELO_CHECK_IN_CONTRACT_ADDRESS, abi: CELO_CHECK_IN_ABI };
  const { data: tokenBalance } = useBalance({
    address,
    token: mode === "degen" ? "0x4ed4E862860beD51a9570b96d89aF5E1B0Efefed" : undefined,
    chainId: mode === "degen" ? base.id : undefined,
  });

  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [checkInStatus, setCheckInStatus] = useState<boolean[]>([]);
  const [fid, setFid] = useState<number | null>(null);

  const currentDay = dashboardData?.currentDay ? Number(dashboardData.currentDay) : 1;
  const currentRoundNumber = dashboardData?.currentRoundNumber ? Number(dashboardData.currentRoundNumber) : 0;
  const canClaimReward = dashboardData?.canClaim || false;
  const isRoundActive = dashboardData?.roundActive ?? false;
  const userCheckIns = dashboardData?.userCheckIns ? Number(dashboardData.userCheckIns) : 0;
  const currentReward = dashboardData?.currentReward ? formatEther(dashboardData.currentReward) : "0";

  // Dynamic theme classes
  const isDegen = mode === "degen";
  const progressBarClasses = isDegen
    ? "bg-gradient-to-r from-purple-500 to-purple-600 h-2.5 rounded-full"
    : "bg-[var(--accent-primary)] h-2.5 rounded-full";

  const successBgClasses = "p-3 rounded-lg flex items-center gap-2 bg-[var(--bg-tertiary)] text-[var(--text-primary)] border border-[var(--border-primary)]";

  const successStatusClasses = "p-3 rounded-lg border border-[var(--border-primary)] text-center text-[var(--accent-primary)] flex items-center justify-center gap-2 bg-[var(--bg-tertiary)]";

  const claimTimeBgClasses = "p-3 rounded-lg border border-[var(--border-primary)] text-center bg-[var(--accent-primary)] text-[var(--accent-text)]";

  const roundNumberClasses = "text-sm text-[var(--text-primary)]";

  const chevronIconClasses = "w-4 h-4 mt-0.5 text-[var(--text-secondary)] flex-shrink-0";

  const panelClasses = "rounded-xl p-4 border border-[var(--border-primary)] bg-[var(--bg-secondary)]";

  function mapDashboardData(data: any[]): DashboardData {
    return {
      currentRoundNumber: data[0],
      userCheckIns: data[1],
      canClaim: data[2],
      checkedInToday: data[3],
      contractBalance: data[4],
      currentReward: data[5],
      currentFee: data[6],
      roundActive: data[7],
      roundStart: data[8],
      roundEnd: data[9],
      currentDay: data[10],
    };
  }

  const fetchUserStatus = useCallback(async () => {
    if (!address || !publicClient || !isCorrectChain) return;
    setIsLoading(true);
    setError(null);

    try {
      const data: any = await publicClient.readContract({
        address: checkInAddress,
        abi: checkInAbi,
        functionName: "getUserDashboard",
        args: [address],
      });
      const _dashboardData = mapDashboardData(data);

      setDashboardData(_dashboardData);

      const status = await publicClient.readContract({
        address: checkInAddress,
        abi: checkInAbi,
        functionName: "getUserCheckInStatus",
        args: [address],
      }) as boolean[];

      setCheckInStatus(status);

      if (_dashboardData.canClaim && !fid) {
        const response = await fetch(`/api/farcaster?address=${address}`);
        const fidData = await response.json();
        if (fidData.fid) setFid(fidData.fid);
      }
    } catch (err) {
      console.error("Error fetching user status:", err);
      setError("Failed to load check-in status");
      toast.error("Failed to load check-in status");
    } finally {
      setIsLoading(false);
    }
  }, [address, publicClient, isCorrectChain, checkInAddress, checkInAbi, fid]);

  useEffect(() => {
    const initSdkContext = async () => {
      await sdk.isInMiniApp();
      await sdk.actions.ready();
      const context = await sdk.context;
      console.log("SDK context:", context.user?.fid);

      if (!context.user) {
        setError("Please link your Farcaster account to view your profile.");
        return;
      }
      if (context.user) {
        setFid(context.user.fid);
      }
    };
    initSdkContext();
  }, []);

  useEffect(() => {
    fetchUserStatus();
  }, [fetchUserStatus, targetChain.id]);

  const fetchSignature = async (
    type: "checkIn" | "claimReward",
    params: any,
  ): Promise<string> => {
    try {
      const response = await fetch("/api/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, ...params }),
      });
      const data: SignatureResponse = await response.json();
      if (!response.ok || data.error) {
        throw new Error(data.error || "Failed to fetch signature");
      }
      return data.signature;
    } catch (err) {
      throw new Error(
        err instanceof Error ? err.message : "Signature generation failed",
      );
    }
  };

  const handleCheckin = async () => {
    if (!address || !publicClient || !dashboardData) {
      toast.error(`Please connect wallet and switch to ${mode === "degen" ? "Base" : "Celo"} Network`);
      return;
    }

    if (!isRoundActive) {
      toast.error("Current round is not active");
      return;
    }

    setIsLoading(true);
    setTxHash(null);
    setError(null);

    try {
      if (!isCorrectChain) {
        await switchChainAsync({ chainId: targetChain.id });
      }

      const signature = await fetchSignature("checkIn", {
        userAddress: address,
        day: currentDay,
        round: currentRoundNumber,
      });

      let balanceCheck;
      if (mode === "degen") {
        balanceCheck = tokenBalance?.value || 0n;
        if (balanceCheck < CHECK_IN_FEE) {
          throw new Error(`Insufficient ${currency} balance. Available: ${formatEther(balanceCheck)} ${currency}, Required: ${formatEther(CHECK_IN_FEE)} ${currency}`);
        }
        const degenTokenAddress = "0x4ed4E862860beD51a9570b96d89aF5E1B0Efefed";
        const allowance = await publicClient.readContract({
          address: degenTokenAddress,
          abi: ERC20_ABI,
          functionName: "allowance",
          args: [address, checkInAddress],
        }) as bigint;
        if (allowance < CHECK_IN_FEE) {
          toast.info(`Approving ${formatEther(CHECK_IN_FEE)} ${currency}...`);
          const approveHash = await writeContractAsync({
            address: degenTokenAddress,
            abi: ERC20_ABI,
            functionName: "approve",
            args: [checkInAddress, CHECK_IN_FEE],
            chainId: targetChain.id,
          });
          await publicClient.waitForTransactionReceipt({ hash: approveHash });
          toast.success(`${currency} approval successful!`);
        }
      } else {
        balanceCheck = await publicClient.getBalance({ address });
        if (balanceCheck < CHECK_IN_FEE) {
          throw new Error(`Insufficient ${currency} balance. Available: ${formatEther(balanceCheck)} ${currency}, Required: ${formatEther(CHECK_IN_FEE)} ${currency}`);
        }
      }

      const checkInData = encodeFunctionData({
        abi: checkInAbi,
        functionName: "checkIn",
        args: [BigInt(currentDay), signature],
      });

      const dataSuffix = getDataSuffix({
        consumer: "0xC5337CeE97fF5B190F26C4A12341dd210f26e17c",
        providers: [
          "0x0423189886d7966f0dd7e7d256898daeee625dca",
          "0xc95876688026be9d6fa7a7c33328bd013effa2bb",
          "0x5f0a55fad9424ac99429f635dfb9bf20c3360ab8",
        ],
      });

      const processedSuffix = dataSuffix?.startsWith("0x") ? dataSuffix.slice(2) : dataSuffix || "";
      const combinedData = (checkInData + processedSuffix) as `0x${string}`;

      // Try to estimate gas for better wallet compatibility
      let gasEstimate;
      try {
        gasEstimate = await publicClient.estimateGas({
          account: address,
          to: checkInAddress,
          data: combinedData,
          value: mode === "degen" ? 0n : CHECK_IN_FEE,
        });
      } catch (gasError) {
        console.warn("Gas estimation failed, using defaults:", gasError);
      }

      const hash = await sendTransactionAsync({
        to: checkInAddress,
        data: combinedData,
        value: mode === "degen" ? 0n : CHECK_IN_FEE,
        chainId: targetChain.id,
      });

      // Wait for transaction confirmation before showing success message
      await publicClient.waitForTransactionReceipt({ hash });

      try {
        await submitReferral({
          txHash: hash,
          chainId: targetChain.id,
        });
      } catch (diviError) {
        console.error("Divi submitReferral error:", diviError);
      }

      setTxHash(hash);
      toast.success("Checked in successfully!");
      await fetchUserStatus();
    } catch (err) {
      console.error("Check-in error:", err);
      setError(err instanceof Error ? err.message : "Failed to check in");
      toast.error("Failed to check in");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClaimReward = async () => {
    if (!address || !publicClient || !dashboardData || !fid) {
      toast.error(`Connect wallet to claim reward, FID: ${fid}`);
      return;
    }

    setIsLoading(true);
    setTxHash(null);
    setError(null);

    try {
      const signature = await fetchSignature("claimReward", {
        userAddress: address,
        fid: fid,
        round: currentRoundNumber,
      });

      const claimData = encodeFunctionData({
        abi: checkInAbi,
        functionName: "claimReward",
        args: [BigInt(fid), signature],
      });

      let dataSuffix = "";
      try {
        const suffix = await getDataSuffix({
          consumer: "0xC5337CeE97fF5B190F26C4A12341dd210f26e17c",
          providers: [
            "0x0423189886d7966f0dd7e7d256898daeee625dca",
            "0xc95876688026be9d6fa7a7c33328bd013effa2bb",
            "0x5f0a55fad9424ac99429f635dfb9bf20c3360ab8",
          ],
        });
        dataSuffix = suffix.startsWith("0x") ? suffix.slice(2) : suffix;
      } catch (diviError) {
        console.warn("Divi referral tracking failed:", diviError);
      }

      const combinedData = (claimData + dataSuffix) as `0x${string}`;

      const hash = await sendTransactionAsync({
        to: checkInAddress,
        data: combinedData,
        chainId: targetChain.id,
      });

      setTxHash(hash);
      toast.success(`Reward claimed successfully! (${currentReward} ${currency})`);
      await fetchUserStatus();
    } catch (err) {
      console.error("Claim reward error:", err);
      setError(err instanceof Error ? err.message : "Failed to claim reward");
      toast.error("Failed to claim reward");
    } finally {
      setIsLoading(false);
    }
  };

  const progressPercentage = (userCheckIns / 7) * 100;
  const hasCheckedInToday = dashboardData?.checkedInToday || false;

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Daily Check-in"
      className="max-h-[90vh] overflow-y-auto"
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="space-y-4 p-1"
      >
        {error && (
          <div className="p-3 bg-red-500/10 rounded-lg flex items-center gap-2 text-red-500">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        )}

        {txHash && (
          <div className={successBgClasses}>
            <CheckCircle2 className="w-5 h-5" />
            <span>
              Transaction successful!{" "}
              <a
                href={`https://${mode === "degen" ? "basescan.org" : "celoscan.io"}/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                View on {mode === "degen" ? "BaseScan" : "CeloScan"}
              </a>
            </span>
          </div>
        )}

        <div className={panelClasses}>
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-medium text-[var(--text-secondary)]">Round Progress</h3>
            <span className="text-sm text-[var(--text-tertiary)]">Day {currentDay} of 7</span>
          </div>

          <div className="w-full bg-[var(--bg-tertiary)] rounded-full h-2.5 mb-2">
            <div
              className={progressBarClasses}
              style={{ width: `${progressPercentage}%` }}
            />
          </div>

          <div className="flex justify-between text-sm text-[var(--text-tertiary)]">
            <span>{userCheckIns}/7 days checked in</span>
            <span>{currentReward} {currency} reward</span>
          </div>
        </div>

        {!isCorrectChain ? (
          <Button
            onClick={() => switchChainAsync({ chainId: targetChain.id })}
            className="boc-btn w-full py-3"
          >
            Switch to {mode === "degen" ? "Base" : "Celo"} Network
          </Button>
        ) : isLoading ? (
          <Button disabled className="boc-btn w-full py-3 opacity-70">
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
            Processing...
          </Button>
        ) : !dashboardData?.roundActive ? (
          <div className={claimTimeBgClasses}>
            Round is inactive. Check back soon!
          </div>
        ) : !hasCheckedInToday ? (
          <Button
            onClick={handleCheckin}
            className="boc-btn w-full py-3"
          >
            <CheckCircle2 className="w-5 h-5 mr-2" />
            Check In for Day {currentDay}
          </Button>
        ) : (
          <div className={successStatusClasses}>
            <CheckCircle2 className="w-5 h-5" />
            Already checked in today
          </div>
        )}

        {canClaimReward && (
          <Button
            onClick={handleClaimReward}
            className="boc-btn w-full py-3 animate-pulse"
          >
            <Gift className="w-5 h-5 mr-2" />
            Claim {currentReward} {currency} Reward
          </Button>
        )}

        {currentDay === 7 && userCheckIns < 7 && (
          <div className={claimTimeBgClasses}>
            You missed some check-ins so this round has ended for you.
          </div>
        )}
        {currentDay === 7 && userCheckIns === 7 && canClaimReward && (
          <div className={claimTimeBgClasses}>
            Claim time! You have 24 hours to claim your reward.
          </div>
        )}

        <div className={panelClasses}>
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-medium text-[var(--text-secondary)]">Current Round</h3>
            <span className={roundNumberClasses}>#{currentRoundNumber}</span>
          </div>

          <div className="flex items-center justify-between text-sm text-[var(--text-tertiary)] mb-1">
            <span>Status</span>
            <span className={isRoundActive ? "text-green-500" : "text-red-500"}>
              {isRoundActive ? "Active" : "Ended"}
            </span>
          </div>

          <div className="flex items-center justify-between text-sm text-[var(--text-tertiary)]">
            <span>Fee</span>
            <span>{formatEther(CHECK_IN_FEE)} {currency}/day</span>
          </div>
        </div>

        <div className={panelClasses}>
          <h3 className="font-medium text-[var(--text-secondary)] mb-2">How It Works</h3>
          <ul className="space-y-2 text-sm text-[var(--text-tertiary)]">
            <li className="flex items-start gap-2">
              <ChevronRight className={chevronIconClasses} />
              <span>Check in daily ({formatEther(CHECK_IN_FEE)} {currency} fee per check-in)</span>
            </li>
            <li className="flex items-start gap-2">
              <ChevronRight className={chevronIconClasses} />
              <span>Complete all 7 days to claim your {currency} reward</span>
            </li>
            <li className="flex items-start gap-2">
              <ChevronRight className={chevronIconClasses} />
              <span>Rewards are distributed at the end of each round</span>
            </li>
            <li className="flex items-start gap-2">
              <ChevronRight className={chevronIconClasses} />
              <span>Connect your Farcaster account to claim rewards</span>
            </li>
          </ul>
        </div>
      </motion.div>
    </BottomSheet>
  );
}
