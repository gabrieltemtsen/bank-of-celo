/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { ArrowUpDown, ArrowRight, Coins, TrendingUp, Info, Zap, RefreshCw } from "lucide-react";
import { useAccount, useBalance, useReadContract, useWriteContract, useWaitForTransactionReceipt, useSendCalls } from "wagmi";
import { parseUnits, formatUnits, encodeFunctionData } from "viem";
import { toast } from "sonner";
import { Button } from "~/components/ui/Button";
import { useChainMode } from "~/app/chain-mode/context";
import { useVaultContract, ERC20_ABI } from "~/hooks/contracts";
import { useFrame } from "~/components/providers/FrameProvider";
import sdk from "@farcaster/frame-sdk";

interface FxTabProps {
  isCorrectChain: boolean;
}

export default function FxTab({ isCorrectChain }: FxTabProps) {
  const { address } = useAccount();
  const { mode } = useChainMode();
  const { isSDKLoaded } = useFrame();
  const isDegen = mode === "degen";

  // Contract addresses based on mode
  const { address: vaultAddress, abi: vaultABI } = useVaultContract();
  
  // Token addresses
  const depositTokenAddress = isDegen 
    ? "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" // USDC on Base
    : "0xD8763CBa276a3738E6DE85b4b3bF5FDed6D6cA73"; // cEUR on Celo
  
  const rewardTokenAddress = isDegen
    ? "0x4ed4E862860beD51a9570b96d89aF5E1B0Efefed" // DEGEN on Base
    : "0x471EcE3750Da237f93B8E339c536989b8978a438"; // CELO on Celo

  // State
  const [depositAmount, setDepositAmount] = useState("");
  const [isApproving, setIsApproving] = useState(false);
  const [isDepositing, setIsDepositing] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState(Date.now());

  // Token balances with refresh key
  const { data: depositTokenBalance, refetch: refetchDepositBalance } = useBalance({
    address,
    token: depositTokenAddress as `0x${string}`,
    query: { refetchInterval: 3000 },
  });

  const { data: rewardTokenBalance, refetch: refetchRewardBalance } = useBalance({
    address,
    token: rewardTokenAddress as `0x${string}`,
    query: { refetchInterval: 3000 },
  });

  // Native token balance for swap functionality
  const { data: nativeBalance } = useBalance({
    address,
    query: { refetchInterval: 3000 },
  });

  // User deposit info
  const { data: userDeposit, refetch: refetchUserDeposit } = useReadContract({
    address: vaultAddress as `0x${string}`,
    abi: vaultABI,
    functionName: "getUserDeposit",
    args: [address],
    query: { enabled: !!address, refetchInterval: 3000 },
  });

  // Pending rewards
  const { data: pendingReward, refetch: refetchPendingReward } = useReadContract({
    address: vaultAddress as `0x${string}`,
    abi: vaultABI,
    functionName: "pendingReward",
    args: [address],
    query: { enabled: !!address, refetchInterval: 3000 },
  });

  // Reward rate for APY calculation
  const { data: rewardRate } = useReadContract({
    address: vaultAddress as `0x${string}`,
    abi: vaultABI,
    functionName: "rewardRate",
    query: { enabled: !!vaultAddress, refetchInterval: 60000 }, // Refresh every minute
  });

  // Total deposits for calculation context
  const { data: totalDeposits } = useReadContract({
    address: vaultAddress as `0x${string}`,
    abi: vaultABI,
    functionName: "totalDeposits",
    query: { enabled: !!vaultAddress, refetchInterval: 10000 },
  });

  // Token allowance
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: depositTokenAddress as `0x${string}`,
    abi: ERC20_ABI,
    functionName: "allowance",
    args: [address, vaultAddress],
    query: { enabled: !!address },
  });

  // Contract write functions
  const { 
    writeContract: approveToken, 
    data: approveHash,
    error: approveError,
    isPending: approvePending 
  } = useWriteContract();

  const { 
    writeContract: depositToVault, 
    data: depositHash,
    error: depositError,
    isPending: depositPending 
  } = useWriteContract();

  const { 
    writeContract: withdrawFromVault, 
    data: withdrawHash,
    error: withdrawError,
    isPending: withdrawPending 
  } = useWriteContract();

  // Batch transaction hook for approve + deposit
  const { 
    sendCalls,
    data: batchTxId,
    error: batchError,
    isPending: batchPending 
  } = useSendCalls();

  // Wait for transactions
  const { isLoading: isApproveLoading } = useWaitForTransactionReceipt({
    hash: approveHash,
  });

  const { isLoading: isDepositLoading } = useWaitForTransactionReceipt({
    hash: depositHash,
  });

  const { isLoading: isWithdrawLoading } = useWaitForTransactionReceipt({
    hash: withdrawHash,
  });

  // Helper functions
  const tokenSymbol = isDegen ? "USDC" : "cEUR";
  const rewardSymbol = isDegen ? "DEGEN" : "CELO";
  const tokenDecimals = isDegen ? 6 : 18; // USDC uses 6 decimals, cEUR uses 18 decimals
  const rewardDecimals = 18; // Both DEGEN and CELO use 18 decimals

  const formatBalance = (balance: bigint | undefined, decimals: number) => {
    if (!balance) return "0";
    return parseFloat(formatUnits(balance, decimals)).toFixed(4);
  };

  // Helper to get deposit amount from getUserDeposit result
  const getDepositAmount = (deposit: unknown): bigint => {
    if (!deposit) return 0n;
    if (Array.isArray(deposit) && deposit.length >= 1) {
      return BigInt(deposit[0].toString());
    }
    return 0n;
  };

  // Helper to safely convert pending reward to BigInt
  const getPendingReward = (reward: unknown): bigint => {
    if (!reward) return 0n;
    try {
      return BigInt(reward.toString());
    } catch {
      return 0n;
    }
  };

  // Helper to safely convert reward rate to BigInt
  const getRewardRate = (rate: unknown): bigint => {
    if (!rate) return 0n;
    try {
      return BigInt(rate.toString());
    } catch {
      return 0n;
    }
  };

  // Calculate estimated APY from reward rate
  const calculateAPY = (rate: bigint): number => {
    if (rate === 0n) return 0;
    // Assuming rate is per second, calculate annual percentage
    const ratePerSecond = Number(formatUnits(rate, rewardDecimals));
    const secondsPerYear = 365 * 24 * 60 * 60;
    return ratePerSecond * secondsPerYear * 100; // Convert to percentage
  };

  // Calculate estimated daily rewards for a given deposit amount
  const calculateDailyRewards = (depositAmountBN: bigint, currentRate: bigint): bigint => {
    if (depositAmountBN === 0n || currentRate === 0n) return 0n;
    const secondsPerDay = 24 * 60 * 60;
    // rewards = depositAmount * rate * timeInSeconds
    // Need to normalize for different decimal places between deposit token and reward token
    return (depositAmountBN * currentRate * BigInt(secondsPerDay)) / (10n ** BigInt(tokenDecimals));
  };

  // Refresh all data
  const refreshAllData = useCallback(async () => {
    try {
      await Promise.all([
        refetchDepositBalance(),
        refetchRewardBalance(),
        refetchUserDeposit(),
        refetchPendingReward(),
        refetchAllowance(),
      ]);
      setLastRefreshTime(Date.now());
    } catch (error) {
      console.error("Failed to refresh data:", error);
    }
  }, [refetchDepositBalance, refetchRewardBalance, refetchUserDeposit, refetchPendingReward, refetchAllowance]);

  const needsApproval = () => {
    if (!allowance || !depositAmount) return false;
    const depositAmountBN = parseUnits(depositAmount, tokenDecimals);
    return BigInt(allowance.toString()) < depositAmountBN;
  };

  const handleApprove = async () => {
    if (!depositAmount) return;
    
    try {
      setIsApproving(true);
      const amount = parseUnits(depositAmount, tokenDecimals);
      
      await approveToken({
        address: depositTokenAddress as `0x${string}`,
        abi: ERC20_ABI,
        functionName: "approve",
        args: [vaultAddress, amount],
      });
      
      toast.success("Approval transaction submitted!");
    } catch (error) {
      console.error("Approval error:", error);
      toast.error("Failed to approve tokens");
    } finally {
      setIsApproving(false);
    }
  };

  const handleDeposit = async () => {
    if (!depositAmount) return;
    
    try {
      setIsDepositing(true);
      const amount = parseUnits(depositAmount, tokenDecimals);
      
      await depositToVault({
        address: vaultAddress as `0x${string}`,
        abi: vaultABI,
        functionName: "deposit",
        args: [amount],
      });
      
      toast.success("Deposit transaction submitted!");
      setDepositAmount("");
    } catch (error) {
      console.error("Deposit error:", error);
      toast.error("Failed to deposit tokens");
    } finally {
      setIsDepositing(false);
    }
  };

  const handleBatchApproveAndDeposit = async () => {
    if (!depositAmount) return;
    
    try {
      setIsDepositing(true);
      const amount = parseUnits(depositAmount, tokenDecimals);
      
      // Prepare batch transaction calls
      const calls = [
        // First call: Approve tokens
        {
          to: depositTokenAddress as `0x${string}`,
          data: encodeFunctionData({
            abi: ERC20_ABI,
            functionName: "approve",
            args: [vaultAddress, amount],
          }),
        },
        // Second call: Deposit tokens
        {
          to: vaultAddress as `0x${string}`,
          data: encodeFunctionData({
            abi: vaultABI,
            functionName: "deposit",
            args: [amount],
          }),
        },
      ];

      await sendCalls({ calls });
      
      toast.success("Batch transaction submitted! Tokens will be approved and deposited.");
      setDepositAmount("");
    } catch (error) {
      console.error("Batch transaction error:", error);
      toast.error("Failed to execute batch transaction");
    } finally {
      setIsDepositing(false);
    }
  };

  const handleWithdraw = async () => {
    const depositAmount = getDepositAmount(userDeposit);
    if (depositAmount === 0n) return;
    
    try {
      await withdrawFromVault({
        address: vaultAddress as `0x${string}`,
        abi: vaultABI,
        functionName: "withdraw",
        args: [depositAmount],
      });
      
      toast.success("Withdrawal transaction submitted!");
    } catch (error) {
      console.error("Withdrawal error:", error);
      toast.error("Failed to withdraw tokens");
    }
  };

  const handleSwap = async () => {
    if (!isSDKLoaded) {
      toast.error("Frame SDK not loaded");
      return;
    }

    try {
      // Use Farcaster SDK swapToken action for native token swapping
      const swapParams = isDegen 
        ? {
            // For Degen mode: Swap ETH (native) to USDC on Base
            sellToken: "eip155:8453/native", // ETH on Base
            buyToken: "eip155:8453/erc20:0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", // USDC on Base
          }
        : {
            // For Celo mode: Swap CELO (native) to cEUR on Celo
            sellToken: "eip155:42220/native", // CELO native token
            buyToken: "eip155:42220/erc20:0xD8763CBa276a3738E6DE85b4b3bF5FDed6D6cA73", // cEUR on Celo
          };

      const result = await sdk.actions.swapToken(swapParams);
      
      if (result) {
        toast.success("Swap completed successfully!");
        // Refresh balances after successful swap
        setTimeout(() => refreshAllData(), 3000);
      }
    } catch (error) {
      console.error("Swap failed:", error);
      if (error === "rejected_by_user") {
        toast.info("Swap cancelled by user");
      } else {
        toast.error("Swap failed. Please try again.");
      }
    }
  };

  const handleNativeSwap = async () => {
    if (!isSDKLoaded) {
      toast.error("Frame SDK not loaded");
      return;
    }

    try {
      const nativeSymbol = isDegen ? "ETH" : "CELO";
      const targetSymbol = isDegen ? "USDC" : "cEUR";
      
      // Swap native token to target token
      const swapParams = isDegen 
        ? {
            sellToken: "eip155:8453/native", // ETH on Base
            buyToken: "eip155:8453/erc20:0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", // USDC on Base
          }
        : {
            sellToken: "eip155:42220/native", // CELO native token
            buyToken: "eip155:42220/erc20:0xD8763CBa276a3738E6DE85b4b3bF5FDed6D6cA73", // cEUR on Celo
          };

      toast.info(`Opening swap: ${nativeSymbol} → ${targetSymbol}`);
      const result = await sdk.actions.swapToken(swapParams);
      
      if (result) {
        toast.success(`${nativeSymbol} → ${targetSymbol} swap completed!`);
        setTimeout(() => refreshAllData(), 3000);
      }
    } catch (error) {
      console.error("Native swap failed:", error);
      if (error === "rejected_by_user") {
        toast.info("Swap cancelled");
      } else {
        toast.error("Swap failed. Please try again.");
      }
    }
  };

  // Effects for transaction success with immediate data refresh
  useEffect(() => {
    if (approveHash && !isApproveLoading) {
      setTimeout(async () => {
        await refetchAllowance();
        toast.success("Tokens approved successfully!");
      }, 1000); // Wait 1 second for blockchain confirmation
    }
  }, [approveHash, isApproveLoading, refetchAllowance]);

  useEffect(() => {
    if (depositHash && !isDepositLoading) {
      setTimeout(async () => {
        await refreshAllData();
        toast.success("Deposit successful! Balances updated.");
      }, 2000); // Wait 2 seconds for blockchain confirmation
    }
  }, [depositHash, isDepositLoading, refreshAllData]);

  useEffect(() => {
    if (withdrawHash && !isWithdrawLoading) {
      setTimeout(async () => {
        await refreshAllData();
        toast.success("Withdrawal successful! Balances updated.");
      }, 2000); // Wait 2 seconds for blockchain confirmation
    }
  }, [withdrawHash, isWithdrawLoading, refreshAllData]);

  // Handle batch transaction completion
  useEffect(() => {
    if (batchTxId && !batchPending) {
      setTimeout(async () => {
        await refreshAllData();
        toast.success("Batch transaction completed! Tokens approved and deposited successfully.");
      }, 3000); // Wait 3 seconds for both transactions to complete
    }
  }, [batchTxId, batchPending, refreshAllData]);

  // Simplified color scheme with standard colors that work on all backgrounds
  const colorScheme = isDegen ? {
    primary: "purple",
    gradient: "from-purple-500 to-purple-600",
    text: "text-purple-600 dark:text-purple-400",
    bg: "bg-purple-50 dark:bg-purple-900/20",
    cardBg: "bg-white dark:bg-gray-800",
    border: "border-purple-200 dark:border-purple-600",
    accent: "text-purple-700 dark:text-purple-300"
  } : {
    primary: "emerald",
    gradient: "from-emerald-500 to-emerald-600",
    text: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-900/20",
    cardBg: "bg-white dark:bg-gray-800",
    border: "border-emerald-200 dark:border-emerald-600",
    accent: "text-emerald-700 dark:text-emerald-300"
  };

  if (!isCorrectChain) {
    return (
      <div className="p-6 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/20 mb-4">
          <Info className="w-8 h-8 text-red-600 dark:text-red-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Wrong Network
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Please switch to {isDegen ? "Base" : "Celo"} network to use Fx savings.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Development Disclaimer */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-4 rounded-xl bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700 shadow-sm"
      >
        <div className="flex items-start space-x-3">
          <Info className="w-5 h-5 text-orange-600 dark:text-orange-400 mt-0.5" />
          <div className="text-sm text-orange-800 dark:text-orange-200">
            <p className="font-medium mb-1">🚧 Under Development</p>
            <p>
              This feature is currently under development and testing. Please use with caution and only deposit small amounts for testing purposes.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="text-center"
      >
        <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${colorScheme.bg} mb-4`}>
          <TrendingUp className={`w-8 h-8 ${colorScheme.text}`} />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Fx Savings
        </h2>
        <p className="text-gray-100 ">
          Save {tokenSymbol} and earn {rewardSymbol} rewards
        </p>
      </motion.div>

      {/* Current APY Display */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className={`p-4 rounded-xl ${colorScheme.cardBg} ${colorScheme.border} border shadow-sm`}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Current APY</p>
            <p className={`text-2xl font-bold ${colorScheme.accent}`}>
              {getRewardRate(rewardRate) > 0n ? `${calculateAPY(getRewardRate(rewardRate)).toFixed(2)}%` : "Loading..."}
            </p>
          </div>
          <div className={`p-3 rounded-lg ${colorScheme.bg}`}>
            <TrendingUp className={`w-6 h-6 ${colorScheme.text}`} />
          </div>
        </div>
      </motion.div>

      {/* Balances */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="grid grid-cols-2 gap-4"
      >
        <div className={`p-4 rounded-xl ${colorScheme.cardBg} backdrop-blur-sm ${colorScheme.border} border shadow-sm`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
              {tokenSymbol} Balance
            </span>
            <Coins className={`w-4 h-4 ${colorScheme.text}`} />
          </div>
          <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
            {formatBalance(depositTokenBalance?.value, tokenDecimals)}
          </p>
        </div>
        
        <div className={`p-4 rounded-xl ${colorScheme.cardBg} backdrop-blur-sm ${colorScheme.border} border shadow-sm`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
              Deposited
            </span>
            <TrendingUp className={`w-4 h-4 ${colorScheme.text}`} />
          </div>
          <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
            {formatBalance(getDepositAmount(userDeposit), tokenDecimals)}
          </p>
          {getDepositAmount(userDeposit) > 0n && (
            <p className="text-xs mt-1 text-gray-600 dark:text-gray-400">
              Daily: ~{formatBalance(calculateDailyRewards(getDepositAmount(userDeposit), getRewardRate(rewardRate)), rewardDecimals)} {rewardSymbol}
            </p>
          )}
        </div>
      </motion.div>

      {/* Pending Rewards */}
      {getPendingReward(pendingReward) > 0n && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className={`p-4 rounded-xl ${colorScheme.cardBg} ${colorScheme.border} border shadow-sm`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-800 dark:text-gray-200">Pending Rewards</p>
              <p className={`text-xl font-bold ${colorScheme.accent}`}>
                {formatBalance(getPendingReward(pendingReward), rewardDecimals)} {rewardSymbol}
              </p>
            </div>
            <div className={`p-3 rounded-lg ${colorScheme.bg}`}>
              <Coins className={`w-5 h-5 ${colorScheme.text}`} />
            </div>
          </div>
        </motion.div>
      )}

      {/* Estimated Rewards Preview */}
      {depositAmount && parseFloat(depositAmount) > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className={`p-4 rounded-xl ${colorScheme.cardBg} ${colorScheme.border} border shadow-sm`}
        >
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
              Estimated Rewards for {depositAmount} {tokenSymbol}
            </p>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <p className={`text-sm font-semibold ${colorScheme.accent}`}>
                  {formatBalance(calculateDailyRewards(parseUnits(depositAmount, tokenDecimals), getRewardRate(rewardRate)), rewardDecimals)}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Daily</p>
              </div>
              <div>
                <p className={`text-sm font-semibold ${colorScheme.accent}`}>
                  {formatBalance(calculateDailyRewards(parseUnits(depositAmount, tokenDecimals), getRewardRate(rewardRate)) * 7n, rewardDecimals)}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Weekly</p>
              </div>
              <div>
                <p className={`text-sm font-semibold ${colorScheme.accent}`}>
                  {formatBalance(calculateDailyRewards(parseUnits(depositAmount, tokenDecimals), getRewardRate(rewardRate)) * 30n, rewardDecimals)}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Monthly</p>
              </div>
            </div>
            <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-2">
              *Estimates based on current rate. Actual rewards may vary.
            </p>
          </div>
        </motion.div>
      )}

      {/* No Balance State */}
      {depositTokenBalance && depositTokenBalance.value === 0n && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className={`p-6 rounded-2xl ${colorScheme.cardBg} ${colorScheme.border} border shadow-sm text-center`}
        >
          <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${colorScheme.bg} mb-4`}>
            <Coins className={`w-8 h-8 ${colorScheme.text}`} />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            No {tokenSymbol} Balance
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-2">
            You need {tokenSymbol} to start earning rewards. Swap your {isDegen ? "ETH" : "CELO"} tokens to get started.
          </p>
          {nativeBalance && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              Available: {parseFloat(formatUnits(nativeBalance.value, 18)).toFixed(4)} {isDegen ? "ETH" : "CELO"}
            </p>
          )}
          <div className="space-y-3">
            <Button
              onClick={handleNativeSwap}
              className={`w-full bg-gradient-to-r ${colorScheme.gradient} text-white hover:opacity-90 transition-opacity shadow-lg`}
            >
              <Zap className="w-5 h-5 mr-2" />
              Swap {isDegen ? "ETH" : "CELO"} for {tokenSymbol}
            </Button>
            <Button
              onClick={handleSwap}
              className={`w-full border ${colorScheme.text} ${colorScheme.border} bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700`}
            >
              <ArrowUpDown className="w-4 h-4 mr-2" />
              Other Swap Options
            </Button>
          </div>
        </motion.div>
      )}

      {/* Deposit Section - Only show when user has balance */}
      {depositTokenBalance && depositTokenBalance.value > 0n && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="space-y-6"
        >
          {/* Modern Form Header */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-gray-100">
                Deposit {tokenSymbol}
              </h3>
              <p className="text-sm text-gray-100">
                Start earning {rewardSymbol} rewards on your deposit
              </p>
            </div>
            <Button
              onClick={refreshAllData}
              className="p-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg"
            >
              <RefreshCw className="w-4 h-4 text-gray-600 " />
            </Button>
          </div>

          {/* Modern Form Card */}
          <div className={`p-6 rounded-2xl ${colorScheme.cardBg} ${colorScheme.border} border shadow-sm`}>
            <div className="space-y-6">
              {/* Amount Input with Enhanced Styling */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Amount to Deposit
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    placeholder="0.00"
                    className={`w-full px-4 py-4 text-lg rounded-xl border-2 ${colorScheme.border} bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-${colorScheme.primary}-500 focus:border-${colorScheme.primary}-500 transition-all duration-200`}
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      {tokenSymbol}
                    </span>
                    <Button
                      onClick={() => {
                        if (depositTokenBalance) {
                          setDepositAmount(formatBalance(depositTokenBalance.value, tokenDecimals));
                        }
                      }}
                      className={`px-3 py-1 text-xs rounded-lg ${colorScheme.text} ${colorScheme.bg} hover:opacity-80 transition-opacity`}
                    >
                      MAX
                    </Button>
                  </div>
                </div>
                {/* Balance Display */}
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600 dark:text-gray-400">
                    Available: {formatBalance(depositTokenBalance?.value, tokenDecimals)} {tokenSymbol}
                  </span>
                  {depositAmount && parseFloat(depositAmount) > 0 && (
                    <span className={`${colorScheme.text} font-medium`}>
                      ≈ ${(parseFloat(depositAmount) * 1.2).toFixed(2)} USD
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                {/* Batch Approve & Deposit Button */}
                <Button
                  onClick={handleBatchApproveAndDeposit}
                  disabled={!depositAmount || isDepositing || batchPending}
                  className={`w-full py-4 bg-gradient-to-r ${colorScheme.gradient} text-white font-semibold rounded-xl hover:opacity-90 transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {isDepositing || batchPending ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                      Processing Batch Transaction...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      <Zap className="w-5 h-5 mr-2" />
                      Approve & Deposit {tokenSymbol}
                    </div>
                  )}
                </Button>

                {/* Info about batch transactions */}
                <div className="px-3 py-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
                  <p className="text-xs text-blue-800 dark:text-blue-200">
                    💡 One-click approval and deposit using batch transactions for a seamless experience
                  </p>
                </div>

                {/* Fallback: Individual buttons for wallets that don't support batch transactions */}
                <div className="space-y-2">
                  <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                    Or use individual steps:
                  </p>
                  <div className="flex gap-2">
                  <Button
                    onClick={handleApprove}
                    disabled={!depositAmount || isApproving || approvePending || isApproveLoading || !needsApproval()}
                    className={`flex-1 py-3 border-2 ${colorScheme.border} ${colorScheme.text} bg-transparent hover:${colorScheme.bg} transition-all duration-200 rounded-xl font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {isApproving || approvePending || isApproveLoading ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                        Approving...
                      </div>
                    ) : (
                      `Approve ${tokenSymbol}`
                    )}
                  </Button>
                  
                  <Button
                    onClick={handleDeposit}
                    disabled={!depositAmount || isDepositing || depositPending || isDepositLoading || needsApproval()}
                    className={`flex-1 py-3 border-2 ${colorScheme.border} ${colorScheme.text} bg-transparent hover:${colorScheme.bg} transition-all duration-200 rounded-xl font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {isDepositing || depositPending || isDepositLoading ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                        Depositing...
                      </div>
                    ) : (
                      `Deposit ${tokenSymbol}`
                    )}
                  </Button>
                  </div>
                </div>
                
                {/* Quick Swap Option */}
                <Button
                  onClick={handleNativeSwap}
                  className={`w-full py-3 border-2 ${colorScheme.border} ${colorScheme.text} bg-transparent hover:${colorScheme.bg} transition-all duration-200 rounded-xl font-medium`}
                >
                  <ArrowUpDown className="w-4 h-4 mr-2" />
                  Need more {tokenSymbol}? Swap {isDegen ? "ETH" : "CELO"}
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Modern Withdraw Section */}
      {getDepositAmount(userDeposit) > 0n && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="space-y-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-gray-100">
                Withdraw Funds
              </h3>
              <p className="text-sm text-gray-100 mt-1">
                Withdraw your deposit and claim all pending rewards
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-100">Total to withdraw</p>
              <p className="text-lg font-bold text-gray-100">
                {formatBalance(getDepositAmount(userDeposit), tokenDecimals)} {tokenSymbol}
              </p>
              {getPendingReward(pendingReward) > 0n && (
                <p className={`text-sm ${colorScheme.text} font-medium`}>
                  + {formatBalance(getPendingReward(pendingReward), rewardDecimals)} {rewardSymbol}
                </p>
              )}
            </div>
          </div>
          
          <div className={`p-6 rounded-2xl ${colorScheme.cardBg} ${colorScheme.border} border shadow-sm`}>
            <div className="space-y-4">
              {/* Withdrawal Summary */}
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                  <span className="text-gray-600 dark:text-gray-400">Principal Amount</span>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">
                    {formatBalance(getDepositAmount(userDeposit), tokenDecimals)} {tokenSymbol}
                  </span>
                </div>
                {getPendingReward(pendingReward) > 0n && (
                  <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                    <span className="text-gray-600 dark:text-gray-400">Pending Rewards</span>
                    <span className={`font-semibold ${colorScheme.text}`}>
                      {formatBalance(getPendingReward(pendingReward), rewardDecimals)} {rewardSymbol}
                    </span>
                  </div>
                )}
              </div>

              {/* Withdraw Button */}
              <Button
                onClick={handleWithdraw}
                disabled={withdrawPending || isWithdrawLoading}
                className={`w-full py-4 border-2 ${colorScheme.border} ${colorScheme.text} bg-gray-800 hover:${colorScheme.bg} font-semibold rounded-xl transition-all duration-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {withdrawPending || isWithdrawLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current mr-3"></div>
                    Processing Withdrawal...
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <ArrowRight className="w-5 h-5 mr-2" />
                    Withdraw All & Claim Rewards
                  </div>
                )}
              </Button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Info Box */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 shadow-sm"
      >
        <div className="flex items-start space-x-3">
          <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
          <div className="text-sm text-blue-800 dark:text-blue-200">
            <p className="font-medium mb-1">How Fx Savings Works:</p>
            <ul className="space-y-1">
              <li>• Deposit {tokenSymbol} to start earning {rewardSymbol} rewards</li>
              <li>• Rewards are calculated based on your deposit and time</li>
              <li>• Withdraw anytime to claim your deposits and rewards</li>
              <li>• No lock-up period - full flexibility</li>
            </ul>
          </div>
        </div>
      </motion.div>
    </div>
  );
}