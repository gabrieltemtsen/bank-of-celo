/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import {
  Loader2,
  Ticket,
  Clock,
  Wallet,
  Trophy,
  ChevronRight,
} from "lucide-react";
import { Button } from "~/components/ui/Button";
import { toast } from "sonner";
import { formatDistanceToNow, format } from "date-fns";
import { useAccount, usePublicClient, useWriteContract, useSendTransaction, useBalance } from "wagmi";
import { CELO_JACKPOT_CONTRACT_ADDRESS, CELO_JACKPOT_ABI, DEGEN_JACKPOT_ABI } from "~/lib/constants";
import { MOTIVATIONAL_STATEMENTS } from "~/lib/constants";
import { ERC20_ABI, useJackpotContract } from "~/hooks/contracts";
import { encodeFunctionData, parseEther, formatEther, parseUnits } from "viem";
import { getDataSuffix, submitReferral } from "@divvi/referral-sdk";
import { Input } from "../ui/input";
import { base, celo } from "viem/chains";
import { useChainMode } from "~/app/chain-mode/context";

interface CeloJackpotProps {
  isCorrectChain: boolean;
}
interface RoundData {
  roundId: number;
  startTime: number;
  endTime: number;
  pot: string;
  participantCount: number;
  winner: string;
  winningAmount: string;
  claimed: boolean;
  drawCompleted: boolean;
}

const TICKET_PRESETS = [1, 5, 10, 25];

export default function CeloJackpot({ isCorrectChain }: CeloJackpotProps) {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { sendTransactionAsync } = useSendTransaction();
  const { writeContractAsync } = useWriteContract();
  const { mode } = useChainMode();
  const targetChain = mode === "degen" ? base : celo;
  const currency = mode === "degen" ? "DEGEN" : "CELO";
  const ticketPrice = mode === "degen" ? 250 : 1;
  const { address: jackpotAddress, abi: jackpotAbi } = useJackpotContract();
  const { data: tokenBalance } = useBalance({
    address,
    token: mode === "degen" ? "0x4ed4E862860beD51a9570b96d89aF5E1B0Efefed" : undefined, // DEGEN on Base
    chainId: mode === "degen" ? base.id : undefined,
  });

  const [ticketCount, setTicketCount] = useState("1");
  const [lotteryPending, setLotteryPending] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);

  const [dashboardData, setDashboardData] = useState<{
    currentRound: number;
    timeUntilDraw: number;
    currentPot: string;
    userTicketsCurrentRound: number;
    hasUnclaimed: boolean;
    totalWinnings: string;
    totalParticipants: number;
  }>({
    currentRound: 0,
    timeUntilDraw: 0,
    currentPot: "0",
    userTicketsCurrentRound: 0,
    hasUnclaimed: false,
    totalWinnings: "0",
    totalParticipants: 0,
  });
  const [pastTickets, setPastTickets] = useState<
    { roundId: number; tickets: number; hasWon?: boolean; roundActive?: boolean; date?: string; }[]
  >([]);
  const [unclaimedRounds, setUnclaimedRounds] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showPastTickets, setShowPastTickets] = useState(false);
  const [countdown, setCountdown] = useState<string>("00:00:00");
  const [isDataLoading, setIsDataLoading] = useState(false);
  const countdownRef = useRef<NodeJS.Timeout>();
  const [drawDate, setDrawDate] = useState<string>("TBD");
  const [pastRounds, setPastRounds] = useState<RoundData[]>([]);

  const fetchDashboardData = useCallback(async () => {
    if (!address || !publicClient || !isCorrectChain) return;
    if (!isDataLoading) setIsDataLoading(true);
    try {
      const data: any = await publicClient.readContract({
        address: jackpotAddress,
        abi: jackpotAbi,
        functionName: "getDashboardData",
        args: [address],
      });

      setDashboardData({
        currentRound: Number(data[0]),
        timeUntilDraw: Number(data[1]),
        currentPot: formatEther(data[2]),
        userTicketsCurrentRound: Number(data[3]),
        hasUnclaimed: data[4],
        totalWinnings: formatEther(data[5]),
        totalParticipants: Number(data[6]),
      });

      const userRounds: any = await publicClient.readContract({
        address: jackpotAddress,
        abi: jackpotAbi,
        functionName: "getUserRounds",
        args: [address],
      });

      const ticketsPromises = userRounds.map(async (roundId: bigint) => {
        const tickets: any = await publicClient.readContract({
          address: jackpotAddress,
          abi: jackpotAbi,
          functionName: "userTickets",
          args: [address, roundId],
        });

        const roundData: any = await publicClient.readContract({
          address: jackpotAddress,
          abi: jackpotAbi,
          functionName: "rounds",
          args: [roundId],
        });

        const winnerAddress = roundData[5] as `0x${string}`;
        const hasWon = winnerAddress === address;
        const startTime = Number(roundData[1]);
        const timeInSeconds = Number(startTime);
        const startTimeDate = new Date(timeInSeconds * 1000);
        const formattedDate = format(startTimeDate, "MMMM d");

        const getCurrentRound: any = await publicClient.readContract({
          address: jackpotAddress,
          abi: jackpotAbi,
          functionName: "getCurrentRound",
          args: [],
        });
        const isRoundActive = getCurrentRound.roundId === roundId;
        const timestampSeconds = Number(getCurrentRound.startTime);
        const date = new Date(timestampSeconds * 1000);
        const formattedDrawDate = format(date, "MMMM d");
        setDrawDate(formattedDrawDate);

        return {
          roundId: Number(roundId),
          tickets: Number(tickets),
          hasWon,
          roundActive: isRoundActive,
          date: formattedDate,
        };
      });

      const ticketsData = await Promise.all(ticketsPromises);
      setPastTickets(ticketsData.filter((t: any) => t.tickets > 0));

      const unclaimed: any = await publicClient.readContract({
        address: jackpotAddress,
        abi: jackpotAbi,
        functionName: "getUnclaimedRounds",
        args: [address],
      });
      setUnclaimedRounds(unclaimed.map((r: any) => Number(r)));
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast.error("Failed to load jackpot data. Please try again.");
    } finally {
      setIsLoading(false);
      setIsDataLoading(false);
    }
  }, [address, publicClient, isCorrectChain, jackpotAddress, jackpotAbi]);

  const fetchPastRounds = useCallback(async () => {
    if (!publicClient) return;

    try {
      const currentRound: any = await publicClient.readContract({
        address: jackpotAddress,
        abi: jackpotAbi,
        functionName: "getCurrentRound",
      });
      const currentRoundId = Number(currentRound.roundId);

      const roundsToFetch = Math.min(5, currentRoundId - 1);
      const roundPromises = [];

      for (let i = currentRoundId - 1; i > currentRoundId - 1 - roundsToFetch; i--) {
        roundPromises.push(
          publicClient.readContract({
            address: jackpotAddress,
            abi: jackpotAbi,
            functionName: "rounds",
            args: [BigInt(i)],
          }),
        );
      }
      const roundsData = await Promise.all(roundPromises);
      const formattedRounds = roundsData.map((round: any, index) => ({
        roundId: currentRoundId - 1 - index,
        startTime: Number(round[1]),
        endTime: Number(round[2]),
        pot: formatEther(round[3]),
        participantCount: Number(round[4]),
        winner: round[5],
        winningAmount: formatEther(round[6]),
        claimed: round[7],
        drawCompleted: round[8],
      }));

      setPastRounds(formattedRounds);
    } catch (error) {
      console.error("Error fetching past rounds:", error);
    }
  }, [publicClient, jackpotAddress, jackpotAbi]);

  useEffect(() => {
    fetchDashboardData();
    fetchPastRounds();
    const syncInterval = setInterval(fetchDashboardData, 3000);
    return () => clearInterval(syncInterval);
  }, [fetchDashboardData, fetchPastRounds, targetChain.id]);

  const handleTriggerDraw = async () => {
    if (!address || !publicClient || !isCorrectChain) {
      toast.error("Wallet not connected or wrong network");
      return;
    }

    setLotteryPending(true);
    try {
      const hash = await sendTransactionAsync({
        to: jackpotAddress,
        data: encodeFunctionData({
          abi: jackpotAbi,
          functionName: "triggerDraw",
          args: [],
        }),
        value: 0n,
        chainId: targetChain.id,
      });

      toast.success(`Draw triggered successfully! Transaction: ${hash.slice(0, 6)}...`);
      fetchDashboardData();
    } catch (error) {
      console.error("Trigger draw error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to trigger draw");
    } finally {
      setLotteryPending(false);
    }
  };

  const formatCountdown = (seconds: number): string => {
    if (seconds <= 0) return "00:00:00";
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

const handleBuyTickets = async () => {
  if (!address || !publicClient || !isCorrectChain) {
    toast.error("Wallet not connected or wrong network");
    return;
  }

  const tickets = parseInt(ticketCount);
  if (isNaN(tickets)) {
    toast.error("Please enter a valid number of tickets");
    return;
  }

  setLotteryPending(true);
  setTxHash(null);

  try {
    const totalCost = mode === "degen" ? parseUnits((tickets * ticketPrice).toString(), 18) : parseEther((tickets * ticketPrice).toString());
    let balanceCheck;

    if (mode === "degen") {
      console.log("Token Balance Data:", tokenBalance);
      balanceCheck = tokenBalance?.value || 0n;
      console.log(`DEGEN Balance: ${formatEther(balanceCheck)} DEGEN, Total Cost: ${formatEther(totalCost)} DEGEN`);
      if (balanceCheck < totalCost) {
        toast.error(`Insufficient DEGEN balance. Available: ${formatEther(balanceCheck)} DEGEN, Required: ${formatEther(totalCost)} DEGEN`);
        return;
      }
      const degenTokenAddress = "0x4ed4E862860beD51a9570b96d89aF5E1B0Efefed";
      const allowance = await publicClient.readContract({
        address: degenTokenAddress,
        abi: ERC20_ABI,
        functionName: "allowance",
        args: [address, jackpotAddress],
      }) as bigint;
      console.log(`DEGEN Allowance: ${formatEther(allowance)} DEGEN`);
      if (allowance < totalCost) {
        toast.info(`Approving ${tickets * ticketPrice} DEGEN...`);
        const approveHash = await writeContractAsync({
          address: degenTokenAddress,
          abi: ERC20_ABI,
          functionName: "approve",
          args: [jackpotAddress, totalCost],
          chainId: targetChain.id,
        });
        await publicClient.waitForTransactionReceipt({ hash: approveHash });
        toast.success("DEGEN approval successful!");
      }
    } else {
      balanceCheck = await publicClient.getBalance({ address });
      console.log(`CELO Balance: ${formatEther(balanceCheck)} CELO, Total Cost: ${formatEther(totalCost)} CELO`);
      if (balanceCheck < totalCost) {
        toast.error(`Insufficient CELO balance. Available: ${formatEther(balanceCheck)} CELO, Required: ${formatEther(totalCost)} CELO`);
        return;
      }
    }

    const dataSuffix = getDataSuffix({
      consumer: "0xC5337CeE97fF5B190F26C4A12341dd210f26e17c",
      providers: [
        "0x0423189886d7966f0dd7e7d256898daeee625dca",
        "0xc95876688026be9d6fa7a7c33328bd013effa2bb",
        "0x5f0a55fad9424ac99429f635dfb9bf20c3360ab8",
      ],
    });

    const contractData = encodeFunctionData({
      abi: jackpotAbi,
      functionName: "buyTickets",
      args: mode === "degen" ? [BigInt(tickets)] : [],
    });

    const finalData = dataSuffix ? contractData + dataSuffix : contractData;

    // Try to estimate gas for better wallet compatibility
    let gasEstimate;
    try {
      gasEstimate = await publicClient.estimateGas({
        account: address,
        to: jackpotAddress,
        data: finalData as `0x${string}`,
        value: mode === "degen" ? 0n : totalCost,
      });
    } catch (gasError) {
      console.warn("Gas estimation failed, using defaults:", gasError);
    }

    const hash = await sendTransactionAsync({
      to: jackpotAddress,
      data: finalData as `0x${string}`,
      value: mode === "degen" ? 0n : totalCost,
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
      toast.warning("Ticket purchase succeeded, but referral tracking failed");
    }

    toast.success(
      `Successfully bought ${tickets} ticket${tickets > 1 ? "s" : ""} for ${tickets * ticketPrice} ${currency}! Transaction: ${hash.slice(0, 6)}...`,
    );
    setTxHash(hash);
    setTicketCount("1");
    fetchDashboardData();
  } catch (error) {
    console.error("Ticket purchase error:", error);
    toast.error(error instanceof Error ? error.message : "Failed to purchase tickets");
  } finally {
    setLotteryPending(false);
  }
};

  const handleClaimWinnings = async (roundId: number) => {
    if (!address || !publicClient || !isCorrectChain) {
      toast.error("Wallet not connected or wrong network");
      return;
    }

    setLotteryPending(true);
    setTxHash(null);

    try {
      const dataSuffix = getDataSuffix({
        consumer: "0xC5337CeE97fF5B190F26C4A12341dd210f26e17c",
        providers: [
          "0x0423189886d7966f0dd7e7d256898daeee625dca",
          "0xc95876688026be9d6fa7a7c33328bd013effa2bb",
          "0x5f0a55fad9424ac99429f635dfb9bf20c3360ab8",
        ],
      });

      const contractData = encodeFunctionData({
        abi: jackpotAbi,
        functionName: "claimWinnings",
        args: [BigInt(roundId)],
      });

      const finalData = dataSuffix ? contractData + dataSuffix : contractData;

      // Try to estimate gas for better wallet compatibility
      let gasEstimate;
      try {
        gasEstimate = await publicClient.estimateGas({
          account: address,
          to: jackpotAddress,
          data: finalData as `0x${string}`,
          value: 0n,
        });
      } catch (gasError) {
        console.warn("Gas estimation failed, using defaults:", gasError);
      }

      const hash = await sendTransactionAsync({
        to: jackpotAddress,
        data: finalData as `0x${string}`,
        value: 0n,
        chainId: targetChain.id,
        maxFeePerGas: parseUnits("100", 9),
        maxPriorityFeePerGas: parseUnits("100", 9),
        ...(gasEstimate && { gas: gasEstimate }),
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
        toast.warning("Claim succeeded, but referral tracking failed");
      }

      toast.success(`Successfully claimed winnings for Round ${roundId}! Transaction: ${hash.slice(0, 6)}...`);
      setTxHash(hash);
      fetchDashboardData();
    } catch (error) {
      console.error("Claim winnings error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to claim winnings");
    } finally {
      setLotteryPending(false);
    }
  };

  useEffect(() => {
    if (dashboardData.timeUntilDraw > 0) {
      setCountdown(formatCountdown(dashboardData.timeUntilDraw));
      countdownRef.current = setInterval(() => {
        setCountdown((prev) => {
          const [hours, minutes, seconds] = prev.split(":").map(Number);
          const totalSeconds = hours * 3600 + minutes * 60 + seconds - 1;
          return totalSeconds <= 0 ? "00:00:00" : formatCountdown(totalSeconds);
        });
      }, 1000);
    } else {
      setCountdown("00:00:00");
    }
    return () => clearInterval(countdownRef.current);
  }, [dashboardData.timeUntilDraw]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="space-y-6 max-w-2xl mx-auto"
    >
      {!isCorrectChain ? (
        <div className="p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 text-center">
          <p className="text-gray-600 dark:text-gray-300">
            Please switch to {mode === "degen" ? "Base" : "Celo"} Network to proceed
          </p>
        </div>
      ) : (
        <>
          <motion.div
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.3 }}
            className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-6 shadow-lg"
          >
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div>
                <p className="text-sm text-purple-100 mb-5">
                  BOC Jackpot - {drawDate}
                </p>
                <h3 className="text-3xl font-bold text-white mb-5">
                  {dashboardData.currentPot} {currency}
                </h3>
                <div className="flex items-center gap-2 text-purple-100">
                  <Clock className="w-4 h-4" />
                  {dashboardData.timeUntilDraw > 0 ? (
                    <span className="text-sm font-mono">
                      Draw in {countdown}
                    </span>
                  ) : (
                    <Button
                      onClick={handleTriggerDraw}
                      disabled={lotteryPending}
                      className="text-sm bg-purple-400 text-black hover:bg-purple-600 px-3 py-1"
                    >
                      {lotteryPending ? (
                        <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
                      ) : (
                        "Trigger Draw Now"
                      )}
                    </Button>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 text-white">
                <Trophy className="w-5 h-5" />
                <span className="font-medium">
                  {dashboardData.totalParticipants}
                </span>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700"
          >
            <div className="space-y-5">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Join the Jackpot
              </h3>

              {txHash && (
                <div className="p-3 bg-green-50 dark:bg-green-900/30 rounded-lg text-sm text-green-800 dark:text-green-200 flex items-center">
                  <span>
                    Tickets purchased successfully!{" "}
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

              <div>
                <label
                  htmlFor="ticket-count"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Number of Tickets ({ticketPrice} {currency} each)
                </label>

                <div className="flex gap-2 mb-3">
                  {TICKET_PRESETS.map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setTicketCount(num.toString())}
                      className={`px-3 py-1 text-sm rounded-full border ${
                        ticketCount === num.toString()
                          ? "bg-purple-600 border-purple-600 text-white"
                          : "bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600"
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>

                <Input
                  id="ticket-count"
                  type="number"
                  value={ticketCount}
                  onChange={(e) => setTicketCount(e.target.value)}
                  placeholder="1"
                  className="w-full py-3 text-black dark:text-white dark:bg-gray-700"
                  min="1"
                  step="1"
                />
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Total cost:{" "}
                  <span className="font-medium text-gray-900 dark:text-white">
                    {ticketCount && !isNaN(parseInt(ticketCount))
                      ? parseInt(ticketCount) * ticketPrice
                      : 0}{" "}
                    {currency}
                  </span>
                </p>
              </div>

              <Button
                onClick={handleBuyTickets}
                disabled={
                  lotteryPending ||
                  !ticketCount ||
                  isNaN(parseInt(ticketCount)) ||
                  parseInt(ticketCount) < 1
                }
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 text-white shadow-md"
              >
                {lotteryPending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <Ticket className="w-5 h-5" />
                    <span className="font-semibold">
                      Buy{" "}
                      {ticketCount && !isNaN(parseInt(ticketCount))
                        ? parseInt(ticketCount)
                        : 1}{" "}
                      Ticket{parseInt(ticketCount) !== 1 ? "s" : ""}
                    </span>
                  </div>
                )}
              </Button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Your Tickets in Current Round
              </h3>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Round #{dashboardData.currentRound}
              </span>
            </div>

            {isLoading ? (
              <div className="text-center py-4">
                <Loader2 className="w-5 h-5 animate-spin text-purple-500 mx-auto" />
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-purple-100 dark:bg-purple-900 p-2 rounded-lg">
                    <Ticket className="w-5 h-5 text-purple-600 dark:text-purple-300" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {dashboardData.userTicketsCurrentRound}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Ticket
                      {dashboardData.userTicketsCurrentRound !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </motion.div>

          {dashboardData.hasUnclaimed && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
              className="p-6 bg-amber-50 dark:bg-amber-900/20 rounded-2xl shadow-sm border border-amber-200 dark:border-amber-800"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-amber-800 dark:text-amber-200">
                  🎰 Unclaimed Winnings
                </h3>
                <Trophy className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>

              <div className="space-y-3">
                {unclaimedRounds.map((roundId) => (
                  <div
                    key={roundId}
                    className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border border-amber-100 dark:border-amber-800/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="bg-amber-100 dark:bg-amber-900 p-2 rounded-lg">
                        <Trophy className="w-5 h-5 text-amber-600 dark:text-amber-300" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          Round {roundId}
                        </p>
                        <p className="text-sm text-amber-600 dark:text-amber-400">
                          You won this round!
                        </p>
                      </div>
                    </div>
                    <Button
                      onClick={() => handleClaimWinnings(roundId)}
                      disabled={lotteryPending}
                      className="bg-amber-600 hover:bg-amber-700 text-white shadow"
                    >
                      {lotteryPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        "Claim"
                      )}
                    </Button>
                  </div>
                ))}
                <div className="text-xs text-amber-700 dark:text-amber-300/80 mt-2 px-1">
                  Note: There is a 5% fee on claimed prizes to help cover
                  infrastructure costs.
                </div>
              </div>
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
            className="p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700"
          >
            <button
              onClick={() => setShowPastTickets(!showPastTickets)}
              className="flex items-center justify-between w-full text-left group"
            >
              <h3 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                Your Ticket History
              </h3>
              <ChevronRight
                className={`w-5 h-5 text-gray-500 dark:text-gray-400 transition-transform ${showPastTickets ? "rotate-90" : ""}`}
              />
            </button>

            {showPastTickets && (
              <div className="mt-4 space-y-4">
                {isLoading ? (
                  <div className="text-center py-4">
                    <Loader2 className="w-5 h-5 animate-spin text-purple-500 mx-auto" />
                  </div>
                ) : pastTickets.length === 0 ? (
                  <div className="text-center py-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <p className="text-gray-500 dark:text-gray-400">
                      No past tickets found. Buy tickets to join the jackpot!
                    </p>
                  </div>
                ) : (
                  <>
                    {pastTickets
                      .sort((a, b) => b.roundId - a.roundId)
                      .map((ticket) => {
                        const randomStatement = MOTIVATIONAL_STATEMENTS[Math.floor(Math.random() * MOTIVATIONAL_STATEMENTS.length)];

                        return (
                          <div key={ticket.roundId} className="space-y-3">
                            <div
                              className={`p-4 rounded-lg flex justify-between items-center border ${
                                ticket.hasWon
                                  ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                                  : "bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600"
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <div
                                  className={`p-3 rounded-full ${
                                    ticket.hasWon
                                      ? "bg-green-100 dark:bg-green-800 text-green-600 dark:text-green-300"
                                      : "bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300"
                                  }`}
                                >
                                  {ticket.hasWon ? (
                                    <Trophy className="w-5 h-5" />
                                  ) : (
                                    <Ticket className="w-5 h-5" />
                                  )}
                                </div>
                                <div>
                                  <p className="font-medium text-gray-900 dark:text-white">
                                    Round #{ticket.roundId}
                                  </p>
                                  <p className="text-sm text-gray-500 dark:text-gray-400">
                                    {ticket.date} • {ticket.tickets} Ticket
                                    {ticket.tickets !== 1 ? "s" : ""}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p
                                  className={`text-sm font-medium ${
                                    ticket.hasWon
                                      ? "text-green-600 dark:text-green-400"
                                      : ticket.roundActive
                                        ? "text-green-500 dark:text-green-400"
                                        : "text-gray-500 dark:text-gray-400"
                                  }`}
                                >
                                  {ticket.hasWon
                                    ? unclaimedRounds.includes(ticket.roundId)
                                      ? "🏆 Unclaimed Prize!"
                                      : "💰 Prize Claimed"
                                    : `${ticket.roundActive ? "Active" : "Completed"} Round`}
                                </p>
                              </div>
                            </div>

                            {!ticket.hasWon && (
                              <div className="px-4 py-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-100 dark:border-purple-800/50">
                                <div className="flex items-start gap-2">
                                  <svg
                                    className="w-5 h-5 text-purple-500 dark:text-purple-400 mt-0.5 flex-shrink-0"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth="2"
                                      d="M13 10V3L4 14h7v7l9-11h-7z"
                                    />
                                  </svg>
                                  <p className="text-sm text-purple-800 dark:text-purple-200">
                                    {randomStatement}
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}

                    <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Wallet className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Total Winnings:
                          </p>
                        </div>
                        <p className="text-lg font-bold text-gray-900 dark:text-white">
                          {dashboardData.totalWinnings} {currency}
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.4 }}
            className="p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700"
          >
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              Past Rounds
            </h3>

            {pastRounds.length === 0 ? (
              <div className="text-center py-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <p className="text-gray-500 dark:text-gray-400">
                  No past rounds data available
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {pastRounds.map((round) => (
                  <div
                    key={round.roundId}
                    className={`p-4 rounded-lg border ${
                      round.winner !==
                      "0x0000000000000000000000000000000000000000"
                        ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                        : "bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600"
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          Round #{round.roundId}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {format(
                            new Date(round.startTime * 1000),
                            "MMMM d, yyyy",
                          )}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-black font-medium">
                          {round.pot} {currency}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {round.participantCount} participants
                        </p>
                      </div>
                    </div>

                    {round.winner !==
                    "0x0000000000000000000000000000000000000000" ? (
                      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                        <p className="text-sm font-medium text-green-600 dark:text-green-400">
                          Winner: {round.winner.slice(0, 6)}...
                          {round.winner.slice(-4)}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Won {round.winningAmount} {currency}
                        </p>
                      </div>
                    ) : (
                      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          No winner - Pot carried over
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </>
      )}
    </motion.div>
  );
}