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
} from "wagmi";
import {
  CELO_CHECK_IN_CONTRACT_ADDRESS,
  CELO_CHECK_IN_ABI,
} from "~/lib/constants";
import { encodeFunctionData, formatEther, parseEther, parseUnits } from "viem";
import { getDataSuffix, submitReferral } from "@divvi/referral-sdk";
import sdk from "@farcaster/frame-sdk";
import { useChainMode } from "~/app/chain-mode/context";

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

const CELO_CHAIN_ID = 42220;

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

  const [dashboardData, setDashboardData] = useState<DashboardData | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [checkInStatus, setCheckInStatus] = useState<boolean[]>([]);
  const [fid, setFid] = useState<number | null>(null);

  const isDegen = mode === "degen";
  const isCorrectChain = chainId === CELO_CHAIN_ID;
  const CHECK_IN_FEE = dashboardData?.currentFee || parseEther("0.001");
  const currentDay = dashboardData?.currentDay
    ? Number(dashboardData.currentDay)
    : 1;
  const currentRoundNumber = dashboardData?.currentRoundNumber
    ? Number(dashboardData.currentRoundNumber)
    : 0;
  const canClaimReward = dashboardData?.canClaim || false;
  const isRoundActive = dashboardData?.roundActive ?? false;
  const userCheckIns = dashboardData?.userCheckIns
    ? Number(dashboardData.userCheckIns)
    : 0;
  const currentReward = dashboardData?.currentReward
    ? formatEther(dashboardData.currentReward)
    : 0;

  // Dynamic theme classes
  const progressBarClasses = isDegen
    ? "bg-gradient-to-r from-purple-500 to-purple-600 h-2.5 rounded-full"
    : "bg-gradient-to-r from-emerald-500 to-emerald-600 h-2.5 rounded-full";

  const checkedInBorderClasses = isDegen
    ? "bg-purple-500/20 border border-purple-500/30"
    : "bg-emerald-500/20 border border-emerald-500/30";

  const checkedInIconClasses = isDegen
    ? "text-purple-400"
    : "text-emerald-400";

  const primaryButtonClasses = isDegen
    ? "w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white py-3 rounded-lg font-medium flex items-center justify-center gap-2"
    : "w-full bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white py-3 rounded-lg font-medium flex items-center justify-center gap-2";

  const rewardButtonClasses = isDegen
    ? "w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white py-3 rounded-lg font-medium flex items-center justify-center gap-2 animate-pulse"
    : "w-full bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white py-3 rounded-lg font-medium flex items-center justify-center gap-2 animate-pulse";

  const switchNetworkButtonClasses = isDegen
    ? "w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg font-medium"
    : "w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-lg font-medium";

  const successBgClasses = isDegen
    ? "p-3 bg-purple-500/10 rounded-lg flex items-center gap-2 text-purple-500"
    : "p-3 bg-emerald-500/10 rounded-lg flex items-center gap-2 text-emerald-500";

  const successStatusClasses = isDegen
    ? "p-3 bg-purple-500/10 rounded-lg border border-purple-500/20 text-center text-purple-400 flex items-center justify-center gap-2"
    : "p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/20 text-center text-emerald-400 flex items-center justify-center gap-2";

  const claimTimeBgClasses = isDegen
    ? "p-3 bg-purple-500/10 rounded-lg border border-purple-500/20 text-center text-purple-400"
    : "p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/20 text-center text-emerald-400";

  const roundNumberClasses = isDegen
    ? "text-sm text-purple-400"
    : "text-sm text-emerald-400";

  const chevronIconClasses = isDegen
    ? "w-4 h-4 mt-0.5 text-purple-400 flex-shrink-0"
    : "w-4 h-4 mt-0.5 text-emerald-400 flex-shrink-0";

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

  // Fetch all user data in one call using the new dashboard function
  const fetchUserStatus = useCallback(async () => {
    if (!address || !publicClient || !isCorrectChain) return;
    setIsLoading(true);
    setError(null);

    try {
      const data: any = (await publicClient.readContract({
        address: CELO_CHECK_IN_CONTRACT_ADDRESS,
        abi: CELO_CHECK_IN_ABI,
        functionName: "getUserDashboard",
        args: [address],
      })) as DashboardData;
      const _dashboardData = mapDashboardData(data);

      setDashboardData(_dashboardData);

      // Get check-in status for all days
      const status = (await publicClient.readContract({
        address: CELO_CHECK_IN_CONTRACT_ADDRESS,
        abi: CELO_CHECK_IN_ABI,
        functionName: "getUserCheckInStatus",
        args: [address],
      })) as boolean[];

      setCheckInStatus(status);

      // Fetch FID if needed for claiming
      if (data.canClaim && !fid) {
        const response = await fetch(`/api/farcaster?address=${address}`);
        const fidData = await response.json();
        // if (fidData.fid) setFid(fidData.fid);
      }
    } catch (err) {
      console.error("Error fetching user status:", err);
      setError("Failed to load check-in status");
      toast.error("Failed to load check-in status");
    } finally {
      setIsLoading(false);
    }
  }, [address, publicClient, isCorrectChain, fid]);

  // Initialize SDK and fetch user context

  useEffect(() => {
    const initSdkContext = async () => {
      await sdk.isInMiniApp();
      await sdk.actions.ready();
      const context = await sdk.context;
      console.log("SDK context:", context?.user?.fid);

      if (!context?.user) {
        setError("Please link your Farcaster account to view your profile.");
        return;
      }
      if (context?.user) {
        setFid(context.user.fid);
      }
    };
    initSdkContext();
  }, []);

  useEffect(() => {
    fetchUserStatus();
  }, [fetchUserStatus]);
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
      toast.error("Please connect wallet and switch to Celo Network");
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
      // Switch to Celo mainnet if needed
      if (!isCorrectChain) {
        await switchChainAsync({ chainId: CELO_CHAIN_ID });
      }

      // Get signature for check-in
      const signature = await fetchSignature("checkIn", {
        userAddress: address,
        day: currentDay,
        round: currentRoundNumber,
      });

      // Check user's balance for check-in fee
      const balance = await publicClient.getBalance({ address });
      if (balance < CHECK_IN_FEE) {
        throw new Error(`Insufficient CELO for check-in fee (0.001 CELO)`);
      }
      // Encode the contract call data
      const checkInData = encodeFunctionData({
        abi: CELO_CHECK_IN_ABI,
        functionName: "checkIn",
        args: [BigInt(currentDay), signature],
      });

      // Try to get Divi referral data
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

      // Combine the data
      const combinedData = (checkInData + dataSuffix) as `0x${string}`;
      // Call checkIn
      const hash = await sendTransactionAsync({
        to: CELO_CHECK_IN_CONTRACT_ADDRESS,
        data: combinedData,
        value: CHECK_IN_FEE,
        maxFeePerGas: parseUnits("100", 9),
        maxPriorityFeePerGas: parseUnits("100", 9),
      });

      // Submit referral if possible
      try {
        await submitReferral({
          txHash: hash,
          chainId: CELO_CHAIN_ID,
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
      toast.error(`Connect wallet to cehck in farc:, ${fid}`);
      return;
    }

    setIsLoading(true);
    setTxHash(null);
    setError(null);

    try {
      // Get signature for claim
      // Get signature for check-in
      console.log("Fetching signature for claim reward...");
      const signature = await fetchSignature("claimReward", {
        userAddress: address,
        fid: fid,
        round: currentRoundNumber,
      });

      console.log("Signature response:", signature);
      // Encode the contract call data
      const claimData = encodeFunctionData({
        abi: CELO_CHECK_IN_ABI,
        functionName: "claimReward",
        args: [BigInt(fid), signature],
      });

      // Try to get Divi referral data
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

      // Combine the data
      const combinedData = (claimData + dataSuffix) as `0x${string}`;

      // Call claimReward
      const hash = await sendTransactionAsync({
        to: CELO_CHECK_IN_CONTRACT_ADDRESS,
        data: combinedData,
        maxFeePerGas: parseUnits("100", 9),
        maxPriorityFeePerGas: parseUnits("100", 9),
      });

      setTxHash(hash);
      toast.success("Reward claimed successfully!");
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
        {/* Status Indicators */}
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
                href={`https://celoscan.io/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                View on CeloScan
              </a>
            </span>
          </div>
        )}

        {/* Progress Section */}
        <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-800">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-medium text-gray-300">Round Progress</h3>
            <span className="text-sm text-gray-400">Day {currentDay} of 7</span>
          </div>

          <div className="w-full bg-gray-800 rounded-full h-2.5 mb-2">
            <div
              className={progressBarClasses}
              style={{ width: `${progressPercentage}%` }}
            />
          </div>

          <div className="flex justify-between text-sm text-gray-400">
            <span>{userCheckIns}/7 days checked in</span>
            <span>{currentReward} CELO reward</span>
          </div>
        </div>

        {/* Daily Check-ins Grid */}
        <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-800">
          <h3 className="font-medium text-gray-300 mb-3">Your Check-ins</h3>
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: 7 }).map((_, index) => (
              <div
                key={index}
                className={`flex flex-col items-center p-2 rounded-lg ${checkInStatus[index]
                    ? checkedInBorderClasses
                    : "bg-gray-800/50 border border-gray-700"
                  }`}
              >
                <span className="text-xs text-gray-300">Day {index + 1}</span>
                {checkInStatus[index] ? (
                  <CheckCircle2 className={`w-4 h-4 ${checkedInIconClasses} mt-1`} />
                ) : (
                  <div className="w-4 h-4 rounded-full bg-gray-700 mt-1" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        {!isCorrectChain ? (
          <Button
            onClick={() => switchChainAsync({ chainId: CELO_CHAIN_ID })}
            className={switchNetworkButtonClasses}
          >
            Switch to Celo Network
          </Button>
        ) : isLoading ? (
          <Button disabled className="w-full py-3 rounded-lg">
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
            Processing...
          </Button>
        ) : !dashboardData?.roundActive ? (
          <div className="p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/20 text-center text-yellow-400">
            Round is inactive. Check back soon!
          </div>
        ) : !hasCheckedInToday ? (
          <Button
            onClick={handleCheckin}
            className={primaryButtonClasses}
          >
            <CheckCircle2 className="w-5 h-5" />
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
            className={rewardButtonClasses}
          >
            <Gift className="w-5 h-5" />
            Claim {currentReward} CELO Reward
          </Button>
        )}

        {/* Final Day Messages */}
        {currentDay === 7 && userCheckIns < 7 && (
          <div className="p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/20 text-center text-yellow-400">
            You missed some check-ins so this round has ended for you.
          </div>
        )}
        {currentDay === 7 && userCheckIns === 7 && canClaimReward && (
          <div className={claimTimeBgClasses}>
            Claim time! You have 24 hours to claim your reward.
          </div>
        )}

        {/* Round Info */}
        <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-800">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-medium text-gray-300">Current Round</h3>
            <span className={roundNumberClasses}>#{currentRoundNumber}</span>
          </div>

          <div className="flex items-center justify-between text-sm text-gray-400 mb-1">
            <span>Status</span>
            <span className={isRoundActive ? "text-green-400" : "text-red-400"}>
              {isRoundActive ? "Active" : "Ended"}
            </span>
          </div>

          <div className="flex items-center justify-between text-sm text-gray-400">
            <span>Fee</span>
            <span>0.001 CELO/day</span>
          </div>
        </div>

        {/* Info Section */}
        <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-800">
          <h3 className="font-medium text-gray-300 mb-2">How It Works</h3>
          <ul className="space-y-2 text-sm text-gray-400">
            <li className="flex items-start gap-2">
              <ChevronRight className={chevronIconClasses} />
              <span>Check in daily (0.001 CELO fee per check-in)</span>
            </li>
            <li className="flex items-start gap-2">
              <ChevronRight className={chevronIconClasses} />
              <span>Complete all 7 days to claim your CELO reward</span>
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
};