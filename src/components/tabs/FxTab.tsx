/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowUpDown, ArrowRight, Coins, TrendingUp, Info } from "lucide-react";
import { useAccount, useBalance, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseUnits, formatUnits } from "viem";
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

  // Token balances
  const { data: depositTokenBalance } = useBalance({
    address,
    token: depositTokenAddress as `0x${string}`,
  });

  const { data: rewardTokenBalance } = useBalance({
    address,
    token: rewardTokenAddress as `0x${string}`,
  });

  // User deposit info
  const { data: userDeposit, refetch: refetchUserDeposit } = useReadContract({
    address: vaultAddress as `0x${string}`,
    abi: vaultABI,
    functionName: "getUserDeposit",
    args: [address],
    query: { enabled: !!address },
  });

  // Pending rewards
  const { data: pendingReward, refetch: refetchPendingReward } = useReadContract({
    address: vaultAddress as `0x${string}`,
    abi: vaultABI,
    functionName: "pendingReward",
    args: [address],
    query: { enabled: !!address },
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
  const tokenDecimals = 6; // Both USDC and cEUR use 6 decimals
  const rewardDecimals = 18;

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
      // Use Farcaster SDK to open URL for token swapping
      const swapUrl = isDegen 
        ? `https://app.uniswap.org/#/swap?outputCurrency=0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913&chain=base` // USDC on Base
        : `https://app.uniswap.org/#/swap?outputCurrency=0xD8763CBa276a3738E6DE85b4b3bF5FDed6D6cA73&chain=celo`; // cEUR on Celo
      
      await sdk.actions.openUrl(swapUrl);
      toast.success("Opening swap interface...");
    } catch (error) {
      console.error("Failed to open swap URL:", error);
      toast.error("Failed to open swap interface");
    }
  };

  // Effects for transaction success
  useEffect(() => {
    if (approveHash && !isApproveLoading) {
      refetchAllowance();
      toast.success("Tokens approved successfully!");
    }
  }, [approveHash, isApproveLoading, refetchAllowance]);

  useEffect(() => {
    if (depositHash && !isDepositLoading) {
      refetchUserDeposit();
      refetchPendingReward();
      toast.success("Deposit successful!");
    }
  }, [depositHash, isDepositLoading, refetchUserDeposit, refetchPendingReward]);

  useEffect(() => {
    if (withdrawHash && !isWithdrawLoading) {
      refetchUserDeposit();
      refetchPendingReward();
      toast.success("Withdrawal successful!");
    }
  }, [withdrawHash, isWithdrawLoading, refetchUserDeposit, refetchPendingReward]);

  // Color scheme based on mode
  const colorScheme = isDegen ? {
    primary: "purple",
    gradient: "from-purple-500 to-purple-600",
    text: "text-purple-600 dark:text-purple-400",
    bg: "bg-purple-50 dark:bg-purple-900/20",
    border: "border-purple-200 dark:border-purple-800"
  } : {
    primary: "emerald",
    gradient: "from-emerald-500 to-emerald-600",
    text: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-900/20",
    border: "border-emerald-200 dark:border-emerald-800"
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
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${colorScheme.bg} mb-4`}>
          <TrendingUp className={`w-8 h-8 ${colorScheme.text}`} />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Fx Savings
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Save {tokenSymbol} and earn {rewardSymbol} rewards
        </p>
      </motion.div>

      {/* Balances */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 gap-4"
      >
        <div className={`p-4 rounded-xl ${colorScheme.bg} ${colorScheme.border} border`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {tokenSymbol} Balance
            </span>
            <Coins className={`w-4 h-4 ${colorScheme.text}`} />
          </div>
          <p className="text-lg font-semibold text-gray-900 dark:text-white">
            {formatBalance(depositTokenBalance?.value, tokenDecimals)}
          </p>
        </div>
        
        <div className={`p-4 rounded-xl ${colorScheme.bg} ${colorScheme.border} border`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Deposited
            </span>
            <TrendingUp className={`w-4 h-4 ${colorScheme.text}`} />
          </div>
          <p className="text-lg font-semibold text-gray-900 dark:text-white">
            {formatBalance(getDepositAmount(userDeposit), tokenDecimals)}
          </p>
        </div>
      </motion.div>

      {/* Pending Rewards */}
      {getPendingReward(pendingReward) > 0n && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={`p-4 rounded-xl ${colorScheme.bg} ${colorScheme.border} border`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Pending Rewards</p>
              <p className={`text-lg font-semibold ${colorScheme.text}`}>
                {formatBalance(getPendingReward(pendingReward), rewardDecimals)} {rewardSymbol}
              </p>
            </div>
            <div className={`p-2 rounded-lg ${colorScheme.bg}`}>
              <Coins className={`w-5 h-5 ${colorScheme.text}`} />
            </div>
          </div>
        </motion.div>
      )}

      {/* Deposit Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="space-y-4"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Deposit {tokenSymbol}
          </h3>
          {depositTokenBalance && depositTokenBalance.value === 0n && (
            <Button
              onClick={handleSwap}
              className={`px-3 py-1 text-sm border ${colorScheme.text} ${colorScheme.border} bg-transparent hover:bg-gray-50 dark:hover:bg-gray-800`}
            >
              <ArrowUpDown className="w-4 h-4 mr-2" />
              Get {tokenSymbol}
            </Button>
          )}
        </div>

        <div className="space-y-3">
          <div className="relative">
            <input
              type="number"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              placeholder={`Enter ${tokenSymbol} amount`}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <Button
              onClick={() => {
                if (depositTokenBalance) {
                  setDepositAmount(formatBalance(depositTokenBalance.value, tokenDecimals));
                }
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 text-xs bg-transparent hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400"
            >
              Max
            </Button>
          </div>

          {needsApproval() ? (
            <Button
              onClick={handleApprove}
              disabled={!depositAmount || isApproving || approvePending || isApproveLoading}
              className={`w-full bg-gradient-to-r ${colorScheme.gradient} text-white`}
            >
              {isApproving || approvePending || isApproveLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Approving...
                </div>
              ) : (
                <>
                  Approve {tokenSymbol}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          ) : (
            <Button
              onClick={handleDeposit}
              disabled={!depositAmount || isDepositing || depositPending || isDepositLoading || needsApproval()}
              className={`w-full bg-gradient-to-r ${colorScheme.gradient} text-white`}
            >
              {isDepositing || depositPending || isDepositLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Depositing...
                </div>
              ) : (
                <>
                  Deposit {tokenSymbol}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          )}
        </div>
      </motion.div>

      {/* Withdraw Section */}
      {getDepositAmount(userDeposit) > 0n && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="space-y-4"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Withdraw
          </h3>
          
          <Button
            onClick={handleWithdraw}
            disabled={withdrawPending || isWithdrawLoading}
            className={`w-full border ${colorScheme.text} ${colorScheme.border} bg-transparent hover:bg-gray-50 dark:hover:bg-gray-800`}
          >
            {withdrawPending || isWithdrawLoading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                Withdrawing...
              </div>
            ) : (
              <>
                Withdraw All & Claim Rewards
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </motion.div>
      )}

      {/* Info Box */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800"
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