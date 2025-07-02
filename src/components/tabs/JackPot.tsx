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
import { base, celo } from "wagmi/chains";
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
  const { address: jackpotAddress, abi: jackpotAbi } = useJackpotContract(); // Assuming this returns mode-based values
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
        const tickets = await publicClient.readContract({
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

        const winnerAddress = roundData[6] as `0x${string}`;
        const hasWon = winnerAddress === address;
        const startTime = Number(roundData[1]);
        const formattedDate = format(new Date(startTime * 1000), "MMMM d");

        const currentRound: any = await publicClient.readContract({
          address: jackpotAddress,
          abi: jackpotAbi,
          functionName: "getCurrentRound",
          args: [],
        });
        const isRoundActive = currentRound.roundId === roundId;

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
  }, [fetchDashboardData, fetchPastRounds, targetChain.id]); // Added targetChain.id

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
      // Debug balance fetch
      console.log("Token Balance Data:", tokenBalance);
      balanceCheck = tokenBalance?.value || 0n;
      console.log(`DEGEN Balance: ${formatEther(balanceCheck)} DEGEN, Total Cost: ${formatEther(totalCost)} DEGEN`);
      if (balanceCheck < totalCost) {
        toast.error(`Insufficient DEGEN balance. Available: ${formatEther(balanceCheck)} DEGEN, Required: ${formatEther(totalCost)} DEGEN`);
        return;
      }
      // Approve DEGEN if needed
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

    let dataSuffix;
    try {
      dataSuffix = getDataSuffix({
        consumer: "0xC5337CeE97fF5B190F26C4A12341dd210f26e17c",
        providers: [
          "0x0423189886d7966f0dd7e7d256898daeee625dca",
          "0xc95876688026be9d6fa7a7c33328bd013effa2bb",
          "0x5f0a55fad9424ac99429f635dfb9bf20c3360ab8",
        ],
      });
    } catch (diviError) {
      console.error("Divi getDataSuffix error:", diviError);
      throw new Error("Failed to generate referral data");
    }

    const contractData = encodeFunctionData({
      abi: jackpotAbi,
      functionName: "buyTickets",
      args: mode === "degen" ? [BigInt(tickets)] : [],
    });

    const finalData = dataSuffix ? contractData + dataSuffix : contractData;

    const hash = await sendTransactionAsync({
      to: jackpotAddress,
      data: finalData as `0x${string}`,
      value: mode === "degen" ? 0n : totalCost,
      chainId: targetChain.id,
      maxFeePerGas: parseUnits("100", 9),
      maxPriorityFeePerGas: parseUnits("100", 9),
    });

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
      let dataSuffix;
      try {
        dataSuffix = getDataSuffix({
          consumer: "0xC5337CeE97fF5B190F26C4A12341dd210f26e17c",
          providers: [
            "0x0423189886d7966f0dd7e7d256898daeee625dca",
            "0xc95876688026be9d6fa7a7c33328bd013effa2bb",
            "0x5f0a55fad9424ac99429f635dfb9bf20c3360ab8",
          ],
        });
      } catch (diviError) {
        console.error("Divi getDataSuffix error:", diviError);
        throw new Error("Failed to generate referral data");
      }

      const contractData = encodeFunctionData({
        abi: jackpotAbi,
        functionName: "claimWinnings",
        args: [BigInt(roundId)],
      });

      const finalData = dataSuffix ? contractData + dataSuffix : contractData;

      const hash = await sendTransactionAsync({
        to: jackpotAddress,
        data: finalData as `0x${string}`,
        value: 0n,
        chainId: targetChain.id,
        maxFeePerGas: parseUnits("100", 9),
        maxPriorityFeePerGas: parseUnits("100", 9),
      });

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
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card-lg modern-card hover-lift p-6 text-center"
          style={{
            background: `var(--surface)`,
            border: `1px solid var(--glass-border)`,
          }}
        >
          <p className="text-glass-readable text-shadow">
            Please switch to {mode === "degen" ? "Base" : "Celo"} Network to proceed
          </p>
        </motion.div>
      ) : (
        <>
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, type: "spring", stiffness: 300 }}
            className="glass-card-lg modern-card hover-lift p-6 relative overflow-hidden"
            style={{
              background: `var(--gradient-primary)`,
              border: `1px solid var(--glass-border)`,
              boxShadow: `var(--glow-primary)`,
            }}
            whileHover={{ 
              scale: 1.02,
              boxShadow: `var(--glow-primary-intense)`,
            }}
          >
            {/* Animated background overlay */}
            <motion.div
              className="absolute inset-0 opacity-10"
              style={{ background: `var(--gradient-secondary)` }}
              animate={{
                opacity: [0.05, 0.15, 0.05],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
            <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-4">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2, duration: 0.6 }}
              >
                <motion.p 
                  className="text-sm font-black mb-3 text-shadow"
                  style={{ color: 'white' }}
                  animate={{ y: [0, -2, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  🎰 BOC Jackpot - {drawDate}
                </motion.p>
                <motion.h3 
                  className="text-4xl font-black text-white mb-4 gradient-text"
                  animate={{ 
                    scale: [1, 1.02, 1],
                    textShadow: ['0 0 10px rgba(255,255,255,0.3)', '0 0 20px rgba(255,255,255,0.5)', '0 0 10px rgba(255,255,255,0.3)']
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  💰 {dashboardData.currentPot} {currency}
                </motion.h3>
                <div className="flex items-center gap-3">
                  <motion.div
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                    className="p-2 rounded-xl"
                    style={{ background: 'rgba(255, 255, 255, 0.1)' }}
                  >
                    <Clock className="w-5 h-5 text-white" />
                  </motion.div>
                  {dashboardData.timeUntilDraw > 0 ? (
                    <motion.span 
                      className="text-lg font-mono font-bold text-white px-3 py-2 rounded-xl"
                      style={{ 
                        background: 'rgba(255, 255, 255, 0.15)',
                        backdropFilter: 'blur(10px)',
                      }}
                      animate={{ opacity: [1, 0.7, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    >
                      ⏰ {countdown}
                    </motion.span>
                  ) : (
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Button
                        onClick={handleTriggerDraw}
                        disabled={lotteryPending}
                        className="btn-secondary text-sm font-bold px-4 py-2"
                        style={{
                          background: 'rgba(255, 255, 255, 0.9)',
                          color: `var(--primary)`,
                          boxShadow: '0 4px 20px rgba(255, 255, 255, 0.3)',
                        }}
                      >
                        {lotteryPending ? (
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          >
                            <Loader2 className="w-4 h-4" />
                          </motion.div>
                        ) : (
                          <span className="flex items-center gap-2">
                            <Trophy className="w-4 h-4" />
                            🎯 Trigger Draw
                          </span>
                        )}
                      </Button>
                    </motion.div>
                  )}
                </div>
              </motion.div>
              <motion.div 
                className="flex items-center gap-3 p-3 rounded-2xl"
                style={{ 
                  background: 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(10px)',
                }}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4, duration: 0.6 }}
                whileHover={{ scale: 1.05 }}
              >
                <motion.div
                  animate={{ 
                    rotate: [0, 10, -10, 0],
                    scale: [1, 1.1, 1],
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="p-2 rounded-xl"
                  style={{ background: 'rgba(255, 255, 255, 0.2)' }}
                >
                  <Trophy className="w-6 h-6 text-white" />
                </motion.div>
                <div className="text-white">
                  <p className="text-xs font-bold text-shadow-sm opacity-90">Players</p>
                  <p className="text-xl font-black text-shadow">
                    {dashboardData.totalParticipants}
                  </p>
                </div>
              </motion.div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="glass-card-lg modern-card hover-lift p-6"
            style={{
              background: `var(--surface)`,
              border: `1px solid var(--glass-border)`,
            }}
            whileHover={{ 
              y: -2,
              boxShadow: `var(--shadow-xl)`,
            }}
          >
            <div className="space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="flex items-center gap-3"
              >
                <motion.div
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="p-2 rounded-xl"
                  style={{ background: `var(--surface-primary)` }}
                >
                  <Ticket className="w-6 h-6" style={{ color: `var(--primary)` }} />
                </motion.div>
                <h3 
                  className="text-2xl font-bold gradient-text"
                  style={{ 
                    background: `var(--gradient-primary)`, 
                    WebkitBackgroundClip: 'text', 
                    WebkitTextFillColor: 'transparent' 
                  }}
                >
                  🎫 Join the Jackpot
                </h3>
              </motion.div>

              {txHash && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-4 glass-card rounded-xl"
                  style={{
                    background: `rgba(16, 185, 129, 0.1)`,
                    border: `1px solid rgba(16, 185, 129, 0.3)`,
                  }}
                >
                  <div className="flex items-center gap-3">
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                      className="p-2 rounded-full"
                      style={{ background: `rgba(16, 185, 129, 0.2)` }}
                    >
                      <Trophy className="w-5 h-5" style={{ color: `var(--success)` }} />
                    </motion.div>
                    <div>
                      <p className="text-sm font-bold" style={{ color: `var(--success)` }}>
                        🎉 Tickets purchased successfully!
                      </p>
                      <motion.a
                        href={`https://${mode === "degen" ? "basescan.org" : "celoscan.io"}/tx/${txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-semibold underline"
                        style={{ color: `var(--primary)` }}
                        whileHover={{ scale: 1.05 }}
                      >
                        📊 View on {mode === "degen" ? "BaseScan" : "CeloScan"}
                      </motion.a>
                    </div>
                  </div>
                </motion.div>
              )}

              <div className="space-y-4">
                <label
                  htmlFor="ticket-count"
                  className="block label-enhanced"
                >
                  🎰 Number of Tickets ({ticketPrice} {currency} each)
                </label>

                <div className="flex gap-3 mb-4">
                  {TICKET_PRESETS.map((num) => (
                    <motion.button
                      key={num}
                      type="button"
                      onClick={() => setTicketCount(num.toString())}
                      className="px-4 py-2 text-sm font-bold rounded-xl transition-all hover-lift"
                      style={{
                        background: ticketCount === num.toString() 
                          ? `var(--gradient-primary)` 
                          : `var(--surface-hover)`,
                        border: `1px solid ${
                          ticketCount === num.toString() 
                            ? 'transparent' 
                            : `var(--border)`
                        }`,
                        color: ticketCount === num.toString() 
                          ? 'white' 
                          : `var(--foreground)`,
                        boxShadow: ticketCount === num.toString() 
                          ? `var(--glow-primary)` 
                          : 'none',
                      }}
                      whileHover={{ 
                        scale: 1.05,
                        y: -1,
                      }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {num}
                    </motion.button>
                  ))}
                </div>

                <div className="relative">
                  <Input
                    id="ticket-count"
                    type="number"
                    value={ticketCount}
                    onChange={(e) => setTicketCount(e.target.value)}
                    placeholder="1"
                    className="modern-input w-full py-4 pr-20 text-lg font-semibold"
                    style={{
                      background: `var(--surface-hover)`,
                      border: `1px solid var(--border)`,
                      color: `var(--foreground)`,
                    }}
                    min="1"
                    step="1"
                  />
                  <div 
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm font-bold px-2 py-1 rounded-lg"
                    style={{ 
                      background: `var(--surface-primary)`,
                      color: `var(--primary)`,
                    }}
                  >
                    🎫
                  </div>
                </div>
                <motion.div 
                  className="p-3 glass-card rounded-xl"
                  style={{
                    background: `var(--surface-secondary)`,
                    border: `1px solid var(--border)`,
                  }}
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="flex items-center justify-between">
                    <span className="label-enhanced">
                      💰 Total Cost:
                    </span>
                    <motion.span 
                      className="text-lg font-black text-shadow"
                      style={{ color: `var(--primary)` }}
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      {ticketCount && !isNaN(parseInt(ticketCount))
                        ? parseInt(ticketCount) * ticketPrice
                        : 0}{" "}
                      {currency}
                    </motion.span>
                  </div>
                </motion.div>
              </div>

              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  onClick={handleBuyTickets}
                  disabled={
                    lotteryPending ||
                    !ticketCount ||
                    isNaN(parseInt(ticketCount)) ||
                    parseInt(ticketCount) < 1
                  }
                  className="btn-primary w-full py-4 text-lg font-bold"
                  style={{
                    background: `var(--gradient-primary)`,
                    boxShadow: `var(--glow-primary)`,
                  }}
                >
                  {lotteryPending ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      <Loader2 className="w-6 h-6" />
                    </motion.div>
                  ) : (
                    <div className="flex items-center justify-center gap-3">
                      <motion.div
                        animate={{ rotate: [0, 10, -10, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <Ticket className="w-6 h-6" />
                      </motion.div>
                      <span>
                        🎫 Buy{" "}
                        {ticketCount && !isNaN(parseInt(ticketCount))
                          ? parseInt(ticketCount)
                          : 1}{" "}
                        Ticket{parseInt(ticketCount) !== 1 ? "s" : ""}
                      </span>
                    </div>
                  )}
                </Button>
              </motion.div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="glass-card-lg modern-card hover-lift p-6"
            style={{
              background: `var(--surface)`,
              border: `1px solid var(--glass-border)`,
            }}
            whileHover={{ 
              y: -2,
              boxShadow: `var(--shadow-xl)`,
            }}
          >
            <div className="flex justify-between items-center mb-6">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="flex items-center gap-3"
              >
                <motion.div
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="p-2 rounded-xl"
                  style={{ background: `var(--surface-primary)` }}
                >
                  <Ticket className="w-5 h-5" style={{ color: `var(--primary)` }} />
                </motion.div>
                <h3 className="text-lg font-black text-glass-readable">
                  🎫 Your Current Tickets
                </h3>
              </motion.div>
              <motion.span 
                className="text-sm font-semibold px-3 py-1 rounded-xl"
                style={{ 
                  background: `var(--surface-secondary)`,
                  color: `var(--foreground-secondary)`,
                }}
                whileHover={{ scale: 1.05 }}
              >
                Round #{dashboardData.currentRound}
              </motion.span>
            </div>

            {isLoading ? (
              <motion.div 
                className="text-center py-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="mx-auto mb-3 w-fit"
                >
                  <Loader2 
                    className="w-8 h-8"
                    style={{ color: `var(--primary)` }}
                  />
                </motion.div>
                <p className="label-enhanced">
                  Loading your tickets...
                </p>
              </motion.div>
            ) : (
              <motion.div 
                className="p-6 glass-card rounded-2xl"
                style={{
                  background: `var(--surface-secondary)`,
                  border: `1px solid var(--border)`,
                }}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 }}
                whileHover={{ 
                  scale: 1.02,
                  boxShadow: `var(--shadow)`,
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <motion.div
                      className="p-3 rounded-2xl"
                      style={{ background: `var(--gradient-primary)` }}
                      animate={{ 
                        rotate: [0, 5, -5, 0],
                        scale: [1, 1.05, 1],
                      }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <Ticket className="w-6 h-6 text-white" />
                    </motion.div>
                    <div>
                      <motion.p 
                        className="text-3xl font-black"
                        style={{ color: `var(--primary)` }}
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        {dashboardData.userTicketsCurrentRound}
                      </motion.p>
                      <p className="label-enhanced">
                        Active Ticket
                        {dashboardData.userTicketsCurrentRound !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                  {dashboardData.userTicketsCurrentRound > 0 && (
                    <motion.div
                      className="text-right"
                      animate={{ y: [0, -3, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <p className="text-2xl">🍀</p>
                      <p 
                        className="text-xs font-black text-shadow-sm"
                        style={{ color: `var(--success)` }}
                      >
                        Good Luck!
                      </p>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            )}
          </motion.div>

          {dashboardData.hasUnclaimed && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.3, type: "spring", stiffness: 300 }}
              className="glass-card-lg modern-card hover-lift p-6 relative overflow-hidden"
              style={{
                background: `rgba(245, 158, 11, 0.05)`,
                border: `1px solid rgba(245, 158, 11, 0.2)`,
                boxShadow: `0 0 30px rgba(245, 158, 11, 0.2)`,
              }}
              whileHover={{ 
                scale: 1.02,
                boxShadow: `0 0 40px rgba(245, 158, 11, 0.3)`,
              }}
            >
              {/* Animated background */}
              <motion.div
                className="absolute inset-0 opacity-10"
                style={{ background: `linear-gradient(135deg, #f59e0b, #d97706)` }}
                animate={{
                  opacity: [0.05, 0.15, 0.05],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
              <div className="relative z-10 flex justify-between items-center mb-6">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                  className="flex items-center gap-3"
                >
                  <motion.div
                    animate={{ 
                      rotate: [0, 10, -10, 0],
                      scale: [1, 1.1, 1],
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="p-3 rounded-2xl"
                    style={{ background: `rgba(245, 158, 11, 0.2)` }}
                  >
                    <Trophy className="w-6 h-6" style={{ color: `var(--warning)` }} />
                  </motion.div>
                  <h3 
                    className="text-xl font-black text-shadow-lg"
                    style={{ color: `var(--warning)` }}
                  >
                    🏆 Unclaimed Winnings!
                  </h3>
                </motion.div>
                <motion.div
                  animate={{ 
                    y: [0, -5, 0],
                    rotate: [0, 5, -5, 0],
                  }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="text-2xl"
                >
                  💰
                </motion.div>
              </div>

              <div className="relative z-10 space-y-4">
                {unclaimedRounds.map((roundId, index) => (
                  <motion.div
                    key={roundId}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                    className="flex items-center justify-between p-4 glass-card rounded-xl hover-lift"
                    style={{
                      background: `var(--surface)`,
                      border: `1px solid rgba(245, 158, 11, 0.3)`,
                    }}
                    whileHover={{ 
                      scale: 1.02,
                      boxShadow: `0 0 20px rgba(245, 158, 11, 0.2)`,
                    }}
                  >
                    <div className="flex items-center gap-4">
                      <motion.div
                        className="p-3 rounded-2xl"
                        style={{ background: `rgba(245, 158, 11, 0.2)` }}
                        animate={{ 
                          scale: [1, 1.1, 1],
                          rotate: [0, 5, -5, 0],
                        }}
                        transition={{ duration: 2, repeat: Infinity, delay: index * 0.2 }}
                      >
                        <Trophy className="w-6 h-6" style={{ color: `var(--warning)` }} />
                      </motion.div>
                      <div>
                        <motion.p 
                          className="text-lg font-black text-shadow"
                          style={{ color: `var(--foreground)` }}
                          animate={{ y: [0, -1, 0] }}
                          transition={{ duration: 2, repeat: Infinity, delay: index * 0.3 }}
                        >
                          🎉 Round {roundId}
                        </motion.p>
                        <p 
                          className="text-sm font-bold text-shadow-sm"
                          style={{ color: `var(--warning)` }}
                        >
                          Congratulations! You won! 🎊
                        </p>
                      </div>
                    </div>
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Button
                        onClick={() => handleClaimWinnings(roundId)}
                        disabled={lotteryPending}
                        className="btn-warning px-6 py-3 text-base font-bold"
                        style={{
                          background: `linear-gradient(135deg, #f59e0b, #d97706)`,
                          boxShadow: `0 0 20px rgba(245, 158, 11, 0.4)`,
                          color: 'white',
                        }}
                      >
                        {lotteryPending ? (
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          >
                            <Loader2 className="w-5 h-5" />
                          </motion.div>
                        ) : (
                          <span className="flex items-center gap-2">
                            <Trophy className="w-4 h-4" />
                            💎 Claim Prize
                          </span>
                        )}
                      </Button>
                    </motion.div>
                  </motion.div>
                ))}
                <motion.div 
                  className="relative z-10 mt-4 p-3 glass-card rounded-xl"
                  style={{
                    background: `rgba(245, 158, 11, 0.1)`,
                    border: `1px solid rgba(245, 158, 11, 0.2)`,
                  }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 }}
                >
                  <p 
                    className="text-xs font-bold flex items-center gap-2 text-shadow-sm"
                    style={{ color: `var(--warning)` }}
                  >
                    ℹ️ <span>5% fee applies to help cover infrastructure costs</span>
                  </p>
                </motion.div>
              </div>
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="glass-card-lg modern-card hover-lift p-6"
            style={{
              background: `var(--surface)`,
              border: `1px solid var(--glass-border)`,
            }}
            whileHover={{ 
              y: -2,
              boxShadow: `var(--shadow-xl)`,
            }}
          >
            <motion.button
              onClick={() => setShowPastTickets(!showPastTickets)}
              className="flex items-center justify-between w-full text-left group"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center gap-3">
                <motion.div
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="p-2 rounded-xl"
                  style={{ background: `var(--surface-primary)` }}
                >
                  <Clock className="w-5 h-5" style={{ color: `var(--primary)` }} />
                </motion.div>
                <h3 className="text-lg font-black text-glass-readable transition-colors group-hover:text-primary">
                  📜 Your Ticket History
                </h3>
              </div>
              <motion.div
                animate={{ rotate: showPastTickets ? 90 : 0 }}
                transition={{ duration: 0.2 }}
                className="p-2 rounded-xl"
                style={{ background: `var(--surface-hover)` }}
              >
                <ChevronRight
                  className="w-5 h-5"
                  style={{ color: `var(--foreground-secondary)` }}
                />
              </motion.div>
            </motion.button>

            {showPastTickets && (
              <motion.div 
                className="mt-6 space-y-4"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                {isLoading ? (
                  <motion.div 
                    className="text-center py-8"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      className="mx-auto mb-3 w-fit"
                    >
                      <Loader2 
                        className="w-8 h-8"
                        style={{ color: `var(--primary)` }}
                      />
                    </motion.div>
                    <p className="label-enhanced">
                      Loading history...
                    </p>
                  </motion.div>
                ) : pastTickets.length === 0 ? (
                  <motion.div 
                    className="text-center py-8 glass-card rounded-xl"
                    style={{
                      background: `var(--surface-secondary)`,
                      border: `1px solid var(--border)`,
                    }}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                  >
                    <motion.div
                      animate={{ y: [0, -5, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="text-4xl mb-3"
                    >
                      🎫
                    </motion.div>
                    <p className="text-base font-bold text-glass-readable">
                      No past tickets found. Buy tickets to join the jackpot!
                    </p>
                  </motion.div>
                ) : (
                  <>
                    {pastTickets
                      .sort((a, b) => b.roundId - a.roundId)
                      .map((ticket, index) => {
                        const randomStatement = MOTIVATIONAL_STATEMENTS[Math.floor(Math.random() * MOTIVATIONAL_STATEMENTS.length)];

                        return (
                          <motion.div 
                            key={ticket.roundId} 
                            className="space-y-3"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                          >
                            <motion.div
                              className="p-4 glass-card rounded-xl flex justify-between items-center hover-lift"
                              style={{
                                background: ticket.hasWon 
                                  ? `rgba(16, 185, 129, 0.1)` 
                                  : `var(--surface-secondary)`,
                                border: ticket.hasWon 
                                  ? `1px solid rgba(16, 185, 129, 0.3)` 
                                  : `1px solid var(--border)`,
                                boxShadow: ticket.hasWon 
                                  ? `0 0 20px rgba(16, 185, 129, 0.2)` 
                                  : 'none',
                              }}
                              whileHover={{ 
                                scale: 1.02,
                                y: -2,
                              }}
                            >
                              <div className="flex items-center gap-4">
                                <motion.div
                                  className="p-3 rounded-2xl"
                                  style={{
                                    background: ticket.hasWon 
                                      ? `rgba(16, 185, 129, 0.2)` 
                                      : `var(--surface-primary)`,
                                  }}
                                  animate={{ 
                                    rotate: ticket.hasWon ? [0, 5, -5, 0] : 0,
                                    scale: ticket.hasWon ? [1, 1.1, 1] : 1,
                                  }}
                                  transition={{ duration: 2, repeat: Infinity, delay: index * 0.2 }}
                                >
                                  {ticket.hasWon ? (
                                    <Trophy className="w-6 h-6" style={{ color: `var(--success)` }} />
                                  ) : (
                                    <Ticket className="w-6 h-6" style={{ color: `var(--primary)` }} />
                                  )}
                                </motion.div>
                                <div>
                                  <motion.p 
                                    className="text-lg font-bold"
                                    style={{ color: `var(--foreground)` }}
                                    animate={{ y: [0, -1, 0] }}
                                    transition={{ duration: 2, repeat: Infinity, delay: index * 0.3 }}
                                  >
                                    {ticket.hasWon ? "🏆" : "🎫"} Round #{ticket.roundId}
                                  </motion.p>
                                  <p 
                                    className="text-sm font-semibold"
                                    style={{ color: `var(--foreground-secondary)` }}
                                  >
                                    {ticket.date} • {ticket.tickets} Ticket
                                    {ticket.tickets !== 1 ? "s" : ""}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <motion.div
                                  className="px-3 py-2 rounded-xl"
                                  style={{
                                    background: ticket.hasWon 
                                      ? `rgba(16, 185, 129, 0.2)` 
                                      : ticket.roundActive 
                                        ? `rgba(34, 197, 94, 0.2)` 
                                        : `var(--surface-hover)`,
                                  }}
                                  animate={ticket.hasWon && unclaimedRounds.includes(ticket.roundId) ? {
                                    scale: [1, 1.05, 1],
                                    opacity: [0.8, 1, 0.8],
                                  } : {}}
                                  transition={{ duration: 1.5, repeat: Infinity }}
                                >
                                  <p
                                    className="text-sm font-black text-shadow-sm"
                                    style={{
                                      color: ticket.hasWon
                                        ? `var(--success)`
                                        : ticket.roundActive
                                          ? `var(--success)`
                                          : `var(--foreground-secondary)`,
                                    }}
                                  >
                                    {ticket.hasWon
                                      ? unclaimedRounds.includes(ticket.roundId)
                                        ? "🏆 Unclaimed!"
                                        : "💰 Claimed"
                                      : `${ticket.roundActive ? "🔄 Active" : "✅ Complete"}`}
                                  </p>
                                </motion.div>
                              </div>
                            </motion.div>

                            {!ticket.hasWon && (
                              <motion.div 
                                className="px-4 py-3 glass-card rounded-xl"
                                style={{
                                  background: `var(--surface-secondary)`,
                                  border: `1px solid var(--border)`,
                                }}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 + 0.2 }}
                              >
                                <div className="flex items-start gap-3">
                                  <motion.div
                                    animate={{ rotate: [0, 10, -10, 0] }}
                                    transition={{ duration: 3, repeat: Infinity, delay: index * 0.5 }}
                                    className="p-2 rounded-xl mt-0.5"
                                    style={{ background: `var(--surface-primary)` }}
                                  >
                                    <svg
                                      className="w-4 h-4"
                                      style={{ color: `var(--primary)` }}
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
                                  </motion.div>
                                  <p className="text-sm font-bold text-glass-readable">
                                    💬 {randomStatement}
                                  </p>
                                </div>
                              </motion.div>
                            )}
                          </motion.div>
                        );
                      })}

                    <motion.div 
                      className="mt-6 p-6 glass-card rounded-2xl"
                      style={{
                        background: `var(--surface-secondary)`,
                        border: `1px solid var(--border)`,
                      }}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                      whileHover={{ 
                        scale: 1.02,
                        boxShadow: `var(--shadow)`,
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <motion.div
                            animate={{ 
                              rotate: [0, 5, -5, 0],
                              scale: [1, 1.1, 1],
                            }}
                            transition={{ duration: 3, repeat: Infinity }}
                            className="p-3 rounded-2xl"
                            style={{ background: `var(--gradient-primary)` }}
                          >
                            <Wallet className="w-6 h-6 text-white" />
                          </motion.div>
                          <p className="text-base font-black text-glass-readable">
                            💰 Total Lifetime Winnings:
                          </p>
                        </div>
                        <motion.p 
                          className="text-2xl font-black text-shadow"
                          style={{ color: `var(--primary)` }}
                          animate={{ scale: [1, 1.05, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          {dashboardData.totalWinnings} {currency}
                        </motion.p>
                      </div>
                    </motion.div>
                  </>
                )}
              </motion.div>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="glass-card-lg modern-card hover-lift p-6"
            style={{
              background: `var(--surface)`,
              border: `1px solid var(--glass-border)`,
            }}
            whileHover={{ 
              y: -2,
              boxShadow: `var(--shadow-xl)`,
            }}
          >
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
              className="flex items-center gap-3 mb-6"
            >
              <motion.div
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="p-2 rounded-xl"
                style={{ background: `var(--surface-primary)` }}
              >
                <Clock className="w-6 h-6" style={{ color: `var(--primary)` }} />
              </motion.div>
              <h3 
                className="text-xl font-bold gradient-text"
                style={{ 
                  background: `var(--gradient-primary)`, 
                  WebkitBackgroundClip: 'text', 
                  WebkitTextFillColor: 'transparent' 
                }}
              >
                📊 Past Rounds
              </h3>
            </motion.div>

            {pastRounds.length === 0 ? (
              <motion.div 
                className="text-center py-8 glass-card rounded-xl"
                style={{
                  background: `var(--surface-secondary)`,
                  border: `1px solid var(--border)`,
                }}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.7 }}
              >
                <motion.div
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="text-4xl mb-3"
                >
                  📊
                </motion.div>
                <p className="text-base font-bold text-glass-readable">
                  No past rounds data available
                </p>
              </motion.div>
            ) : (
              <div className="space-y-4">
                {pastRounds.map((round, index) => (
                  <motion.div
                    key={round.roundId}
                    className="p-4 glass-card rounded-xl hover-lift"
                    style={{
                      background: round.winner !== "0x0000000000000000000000000000000000000000"
                        ? `rgba(16, 185, 129, 0.1)`
                        : `var(--surface-secondary)`,
                      border: round.winner !== "0x0000000000000000000000000000000000000000"
                        ? `1px solid rgba(16, 185, 129, 0.3)`
                        : `1px solid var(--border)`,
                      boxShadow: round.winner !== "0x0000000000000000000000000000000000000000"
                        ? `0 0 20px rgba(16, 185, 129, 0.1)`
                        : 'none',
                    }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 + index * 0.1 }}
                    whileHover={{ 
                      scale: 1.02,
                      y: -2,
                    }}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <motion.div
                          className="p-2 rounded-xl"
                          style={{
                            background: round.winner !== "0x0000000000000000000000000000000000000000"
                              ? `rgba(16, 185, 129, 0.2)`
                              : `var(--surface-primary)`,
                          }}
                          animate={{ 
                            rotate: round.winner !== "0x0000000000000000000000000000000000000000" ? [0, 5, -5, 0] : 0,
                            scale: round.winner !== "0x0000000000000000000000000000000000000000" ? [1, 1.1, 1] : 1,
                          }}
                          transition={{ duration: 2, repeat: Infinity, delay: index * 0.2 }}
                        >
                          {round.winner !== "0x0000000000000000000000000000000000000000" ? (
                            <Trophy className="w-5 h-5" style={{ color: `var(--success)` }} />
                          ) : (
                            <Clock className="w-5 h-5" style={{ color: `var(--primary)` }} />
                          )}
                        </motion.div>
                        <div>
                          <motion.p 
                            className="text-lg font-black text-shadow"
                            style={{ color: `var(--foreground)` }}
                            animate={{ y: [0, -1, 0] }}
                            transition={{ duration: 2, repeat: Infinity, delay: index * 0.3 }}
                          >
                            {round.winner !== "0x0000000000000000000000000000000000000000" ? "🏆" : "🔄"} Round #{round.roundId}
                          </motion.p>
                          <p className="label-enhanced">
                            {format(
                              new Date(round.startTime * 1000),
                              "MMMM d, yyyy",
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <motion.p 
                          className="text-lg font-black text-shadow"
                          style={{ color: `var(--primary)` }}
                          animate={{ scale: [1, 1.05, 1] }}
                          transition={{ duration: 2, repeat: Infinity, delay: index * 0.1 }}
                        >
                          💰 {round.pot} {currency}
                        </motion.p>
                        <p className="text-xs font-bold text-shadow-sm" style={{ color: `var(--foreground-secondary)` }}>
                          👥 {round.participantCount} players
                        </p>
                      </div>
                    </div>

                    {round.winner !==
                    "0x0000000000000000000000000000000000000000" ? (
                      <motion.div 
                        className="mt-4 pt-4 glass-card rounded-xl p-3"
                        style={{
                          background: `rgba(16, 185, 129, 0.1)`,
                          border: `1px solid rgba(16, 185, 129, 0.2)`,
                        }}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: index * 0.1 + 0.8 }}
                      >
                        <div className="flex items-center gap-3">
                          <motion.div
                            animate={{ scale: [1, 1.1, 1] }}
                            transition={{ duration: 2, repeat: Infinity, delay: index * 0.2 }}
                            className="text-2xl"
                          >
                            🎉
                          </motion.div>
                          <div>
                            <p 
                              className="text-sm font-black text-shadow-sm"
                              style={{ color: `var(--success)` }}
                            >
                              🏆 Winner: {round.winner.slice(0, 6)}...{round.winner.slice(-4)}
                            </p>
                            <p className="text-xs font-bold text-shadow-sm" style={{ color: `var(--foreground-secondary)` }}>
                              💰 Prize: {round.winningAmount} {currency}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div 
                        className="mt-4 pt-4 glass-card rounded-xl p-3"
                        style={{
                          background: `var(--surface-hover)`,
                          border: `1px solid var(--border)`,
                        }}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: index * 0.1 + 0.8 }}
                      >
                        <div className="flex items-center gap-3">
                          <motion.div
                            animate={{ rotate: [0, 180, 360] }}
                            transition={{ duration: 3, repeat: Infinity, delay: index * 0.5 }}
                            className="text-xl"
                          >
                            🔄
                          </motion.div>
                          <p className="text-sm font-bold text-shadow-sm" style={{ color: `var(--foreground-secondary)` }}>
                            💵 No winner - Pot rolled over to next round
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </>
      )}
    </motion.div>
  );
}