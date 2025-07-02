/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Loader2,
  Send,
  Gift,
  HandCoins,
  Clock,
  AlertCircle,
  Ticket,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";
import { Button } from "~/components/ui/Button";
import { toast } from "sonner";
import { formatDistanceToNow, set } from "date-fns";
import { Input } from "../ui/input";
import {
  useAccount,
  usePublicClient,
  useSignTypedData,
  useSendTransaction,
  useChainId,
  useWriteContract,
  useBalance,
} from "wagmi";
import { ERC20_ABI, useBankContract } from "~/hooks/contracts";
import JackPot from "./JackPot";
import JackPotV2 from "./JackPotV2";
import { useChainMode } from "~/app/chain-mode/context";
import { getDataSuffix, submitReferral } from "@divvi/referral-sdk";
import { encodeFunctionData, formatEther, parseEther, parseUnits } from "viem";
import { base, celo } from "wagmi/chains";

interface TransactTabProps {
  onDonate: (amount: string) => void;
  maxClaim?: string;
  claimCooldown?: number;
  lastClaimAt?: number;
  vaultBalance?: string;
  availableForClaim: string;
  isCorrectChain: boolean;
  isPending: boolean;
}

interface NeynarResponse {
  fid: number | null;
  userScore?: number | null;
  error?: string;
}

export default function TransactTab({
  onDonate,
  maxClaim: initialMaxClaim = "0.5",
  claimCooldown = 86400,
  lastClaimAt = 0,
  isCorrectChain,
  isPending,
  availableForClaim,
  vaultBalance,
}: TransactTabProps) {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { signTypedDataAsync } = useSignTypedData();
  const { sendTransactionAsync } = useSendTransaction();
    const { writeContractAsync } = useWriteContract();
  
  const { address: bankAddress, abi: bankAbi } = useBankContract();
  const [amount, setAmount] = useState("");
  const [fid, setFid] = useState<number | null>(null);
  const [qualityScore, setQualityScore] = useState<number | null>(null);
  const [fidLoading, setFidLoading] = useState(false);
  const [fidError, setFidError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    "donate" | "claim" | "lottery" | "lottery2"
  >("donate");
  const [claimPending, setClaimPending] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [hasClaimed, setHasClaimed] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const [isUnderMaintenance, setIsUnderMaintenance] = useState(false);
  const { mode } = useChainMode();
  const currency = mode === "degen" ? "DEGEN" : "CELO";
  const maxClaim = mode === "degen" ? "100" : initialMaxClaim;
  const { data: tokenBalance } = useBalance({
  address,
  token: mode === "degen" ? "0x4ed4E862860beD51a9570b96d89aF5E1B0Efefed" : undefined, // DEGEN on Base
  chainId: mode === "degen" ? base.id : undefined,
});

    const chainId = useChainId()
    const targetChain = mode === "degen" ? base : celo;

  const getUsername = async (userAddress: string): Promise<string | null> => {
    if (!userAddress) return null;
    try {
      const response = await fetch(
        `/api/farcaster/username?address=${userAddress}`,
      );
      const data = await response.json();
      return data.username || null;
    } catch (error) {
      console.error("Error fetching username:", error);
      return null;
    }
  };

  const fetchFid = useCallback(async () => {
    if (!address) return;
    setFidLoading(true);
    setFidError(null);

    try {
      const response = await fetch(`/api/farcaster?address=${address}`);
      const data: NeynarResponse = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.error || "Failed to fetch FID");
      }

      setFid(data.fid);
      setQualityScore(data.userScore || null);
      const username = await getUsername(address);
      setUsername(username);
      if (!data.fid) {
        setFidError("No Farcaster ID associated with this address");
      } else {
        if (!publicClient) {
          throw new Error("Public client is not available");
        }
        // const isBlacklisted = await publicClient.readContract({
        //   address: bankAddress,
        //   abi: bankAbi,
        //   functionName: "fidBlacklisted",
        //   args: [BigInt(data.fid)],
        // });
        const isBlacklisted = false; // Placeholder, replace with actual check if needed - TODO: Implement blacklist check
        if (isBlacklisted) {
          setFidError("This Farcaster ID is blacklisted");
          setFid(null);
        }
      }
    } catch (error) {
      console.log("Error fetching FID:", error);
      setFidError(
        error instanceof Error ? error.message : "Failed to fetch FID",
      );
      setFid(null);
    } finally {
      setFidLoading(false);
    }
  }, [address, publicClient, bankAbi, bankAddress]);
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

  const fetchHasClaimed = useCallback(async () => {
    if (!address || !publicClient || !isCorrectChain) return;
    try {
      const donorInfo: any = await publicClient.readContract({
        address: bankAddress,
        abi: bankAbi,
        functionName: "donors",
        args: [address],
      });
      const claimed = donorInfo[3];
      setHasClaimed(claimed as boolean);
    } catch (error) {
      console.error("Error fetching hasClaimed:", error);
      toast.error("Failed to check claim status. Please try again.");
    }
  }, [address, publicClient, isCorrectChain, bankAbi, bankAddress]);

  useEffect(() => {
    fetchFid();
    fetchHasClaimed();
  }, [fetchFid, fetchHasClaimed]);

  const canClaim = () => {
    if (!lastClaimAt) return true;
    const now = Math.floor(Date.now() / 1000);
    return now >= lastClaimAt + claimCooldown;
  };

  const nextClaimTime = lastClaimAt
    ? new Date((lastClaimAt + claimCooldown) * 1000)
    : null;

const handleClaim = async () => {
  if(qualityScore && qualityScore < 0.39) {
    toast.error("You need a positive quality score to claim rewards, keep being active on Farcaster!");
    return;
  }
  if (!fid || !address || !publicClient) {
    toast.error("Farcaster ID or address missing");
    return;
  }
  if (availableForClaim < maxClaim) {
    toast.error("Insufficient vault balance to claim");
    return;
  }

  setClaimPending(true);
  setTxHash(null);

  try {
    const deadline = Math.floor(Date.now() / 1000) + 3600;

    const nonce = (await publicClient.readContract({
      address: bankAddress,
      abi: bankAbi,
      functionName: "nonces",
      args: [address],
    })) as bigint;

    const domain = {
      name: mode === "degen" ? "BankOfDegen" : "BankOfCelo",
      version: "1",
      chainId: targetChain.id,
      verifyingContract: bankAddress,
    };

    const types = {
      Claim: [
        { name: "claimer", type: "address" },
        { name: "fid", type: "uint256" },
        { name: "deadline", type: "uint256" },
        { name: "nonce", type: "uint256" },
      ],
    };

    const message = {
      claimer: address,
      fid: BigInt(fid),
      deadline: BigInt(deadline),
      nonce,
    };

    const signature = await signTypedDataAsync({
      domain,
      types,
      primaryType: "Claim",
      message,
    });

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
      console.log("Divi getDataSuffix error:", diviError);
      throw new Error("Failed to generate referral data");
    }

    // Check native balance for gas fees (ETH on Base, CELO on Celo)
    const balance = await publicClient.getBalance({ address });
    const minBalance = parseEther("0.001"); // Minimum 0.001 ETH/CELO for gas
    const hasSufficientGas = balance >= minBalance;

    const contractData = encodeFunctionData({
      abi: bankAbi,
      functionName: "claim",
      args: [BigInt(fid), BigInt(deadline), signature],
    });

    const finalData = dataSuffix ? contractData + dataSuffix : contractData;

    let hash: `0x${string}`;
    if (hasSufficientGas) {
      // Direct transaction with gas payment
      hash = await sendTransactionAsync({
        to: bankAddress,
        data: finalData as `0x${string}`,
        value: 0n, // No native currency value for claim
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
        console.log("Divi submitReferral error:", diviError);
        toast.warning("Claim succeeded, but referral tracking failed");
      }

      setTxHash(hash);
      toast.success(`Claimed ${maxClaim} ${currency}! Transaction hash: ${hash.slice(0, 6)}...`);
    } else {
      // Gasless claim via API
      const requestBody = {
        address,
        fid: fid.toString(),
        deadline: deadline.toString(),
        signature,
        nonce: nonce.toString(),
        dataSuffix,
      };

      const response = await fetch("/api/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to process claim");
      }

      const result = await response.json();
      hash = result.transactionHash;

      try {
        await submitReferral({
          txHash: hash,
          chainId: targetChain.id,
        });
      } catch (diviError) {
        console.log("Divi submitReferral error:", diviError);
        toast.warning("Claim succeeded, but referral tracking failed");
      }

      setTxHash(hash);
      toast.success(`Claimed ${maxClaim} ${currency} (gasless)! Transaction hash: ${hash.slice(0, 6)}...`);
    }
  } catch (error) {
    console.log("Claim error:", error);
    toast.error(error instanceof Error ? error.message : "Failed to process claim");
  } finally {
    setClaimPending(false);
  }
};

  const handleSubmit = () => {
    if (!isCorrectChain) {
      toast.error(`Please switch to ${mode === "degen" ? "Base" : "Celo"} Network`);
      return;
    }

    if (activeTab === "donate") {
      if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
        toast.error("Please enter a valid amount");
        return;
      }
      console.log(mode, "mode");
      const donate = onDonate(amount);
      console.log("Donate function called:", donate);
      setAmount("");
    } else if (activeTab === "claim") {
      handleClaim();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="space-y-6 w-full"
    >
      <div className="flex flex-col gap-4 w-full">
        <div 
          className="flex flex-wrap glass-card rounded-2xl p-2 gap-2 w-full"
          style={{
            background: `var(--surface)`,
            border: `1px solid var(--border)`,
          }}
        >
          {[
            { id: "donate", icon: Gift, label: "Donate", color: "primary" },
            { id: "claim", icon: HandCoins, label: "Claim", color: "secondary" },
            { id: "lottery", icon: Ticket, label: "Jackpot", color: "accent" },
            { id: "lottery2", icon: Ticket, label: "JackpotV2", color: "success" },
          ].map((tab) => (
            <motion.button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className="flex-1 min-w-[120px] py-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 hover-lift"
              style={{
                background: activeTab === tab.id ? `var(--gradient-primary)` : 'transparent',
                color: activeTab === tab.id ? 'white' : `var(--foreground-secondary)`,
                boxShadow: activeTab === tab.id ? `var(--glow-primary)` : 'none',
              }}
              whileHover={{ 
                scale: 1.02,
                y: -1,
              }}
              whileTap={{ scale: 0.98 }}
              aria-label={`${tab.label} tab`}
              role="tab"
              aria-selected={activeTab === tab.id}
            >
              <motion.div
                animate={{
                  rotate: activeTab === tab.id ? [0, 5, -5, 0] : 0,
                  scale: activeTab === tab.id ? 1.1 : 1,
                }}
                transition={{ duration: 0.3 }}
              >
                <tab.icon className="w-5 h-5" />
              </motion.div>
              <span className="whitespace-nowrap text-sm">{tab.label}</span>
            </motion.button>
          ))}
        </div>
      </div>

      {activeTab === "donate" ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="glass-card-lg modern-card hover-lift p-6"
          style={{
            background: `var(--surface)`,
            border: `1px solid var(--glass-border)`,
          }}
        >
          <div className="space-y-6">
            <div className="space-y-3">
              <label
                htmlFor="donate-amount"
                className="block text-sm font-semibold text-foreground-secondary"
              >
                Amount to Donate ({currency})
              </label>
              <div className="relative">
                <Input
                  id="donate-amount"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.0"
                  className="modern-input w-full py-4 text-lg font-semibold"
                  style={{
                    background: `var(--surface-hover)`,
                    border: `1px solid var(--border)`,
                    color: `var(--foreground)`,
                  }}
                  min="0"
                  step="0.01"
                />
                <div 
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm font-bold px-2 py-1 rounded-lg"
                  style={{ 
                    background: `var(--surface-primary)`,
                    color: `var(--primary)`,
                  }}
                >
                  {currency}
                </div>
              </div>
              {tokenBalance && (
                <p className="text-xs text-foreground-muted">
                  Available: {parseFloat(tokenBalance.formatted).toFixed(4)} {currency}
                </p>
              )}
            </div>
            
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                onClick={() => handleDonate(amount)}
                disabled={isPending || !amount}
                className="btn-primary w-full py-4 text-base font-bold"
                style={{
                  background: `var(--gradient-primary)`,
                  boxShadow: `var(--glow-primary)`,
                }}
                aria-label={`Donate ${currency}`}
              >
                {isPending ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <div className="flex items-center justify-center gap-3">
                    <motion.div
                      animate={{ rotate: [0, 10, -10, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <Send className="w-5 h-5" />
                    </motion.div>
                    <span>Donate {currency}</span>
                  </div>
                )}
              </Button>
            </motion.div>
          </div>
        </motion.div>
      ) : activeTab === "claim" ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="glass-card-lg modern-card hover-lift p-6"
          style={{
            background: `var(--surface)`,
            border: `1px solid var(--glass-border)`,
          }}
        >
          {isUnderMaintenance ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-6"
            >
              <div 
                className="p-6 glass-card rounded-2xl"
                style={{
                  background: `rgba(245, 158, 11, 0.1)`,
                  border: `1px solid rgba(245, 158, 11, 0.3)`,
                }}
              >
                <div className="flex flex-col items-center">
                  <motion.div
                    animate={{ rotate: [0, 5, -5, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="mb-4 p-3 rounded-2xl"
                    style={{ background: `rgba(245, 158, 11, 0.2)` }}
                  >
                    <AlertTriangle 
                      className="w-10 h-10" 
                      style={{ color: `var(--warning)` }}
                    />
                  </motion.div>
                  <h3 
                    className="text-xl font-bold mb-2"
                    style={{ color: `var(--warning)` }}
                  >
                    Maintenance in Progress
                  </h3>
                  <p 
                    className="text-base font-medium"
                    style={{ color: `var(--foreground-secondary)` }}
                  >
                    The claim feature is under maintenance. Please check back later.
                  </p>
                </div>
              </div>
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  onClick={() => window.location.reload()}
                  className="w-full py-3 text-base font-bold"
                  style={{
                    background: `var(--warning)`,
                    color: 'white',
                    boxShadow: `0 0 20px rgba(245, 158, 11, 0.4)`,
                  }}
                >
                  <RefreshCw className="w-5 h-5 mr-2" />
                  Refresh Page
                </Button>
              </motion.div>
            </motion.div>
          ) : (
            <div className="space-y-6">
              {!canClaim() && nextClaimTime && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="p-4 glass-card rounded-xl flex items-center gap-3"
                  style={{
                    background: `rgba(245, 158, 11, 0.1)`,
                    border: `1px solid rgba(245, 158, 11, 0.3)`,
                  }}
                >
                  <motion.div
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                  >
                    <Clock 
                      className="w-5 h-5 flex-shrink-0" 
                      style={{ color: `var(--warning)` }}
                    />
                  </motion.div>
                  <span 
                    className="text-sm font-semibold"
                    style={{ color: `var(--warning)` }}
                  >
                    You can claim again{" "}
                    {formatDistanceToNow(nextClaimTime, { addSuffix: true })}
                  </span>
                </motion.div>
              )}

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
                  <span 
                    className="text-sm font-semibold"
                    style={{ color: `var(--success)` }}
                  >
                    Claim successful!{" "}
                    <motion.a
                      href={`https://${mode === "degen" ? "basescan.org" : "celoscan.io"}/tx/${txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline font-bold"
                      whileHover={{ scale: 1.05 }}
                      style={{ color: `var(--primary)` }}
                    >
                      View on {mode === "degen" ? "BaseScan" : "CeloScan"}
                    </motion.a>
                  </span>
                </motion.div>
              )}

              {fidLoading ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-6 text-center glass-card rounded-xl"
                  style={{
                    background: `var(--surface-secondary)`,
                    border: `1px solid var(--border)`,
                  }}
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
                  <p 
                    className="text-base font-semibold"
                    style={{ color: `var(--foreground-secondary)` }}
                  >
                    Fetching Farcaster ID...
                  </p>
                </motion.div>
              ) : fidError || !fid ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-6 text-center glass-card rounded-xl"
                  style={{
                    background: `rgba(239, 68, 68, 0.1)`,
                    border: `1px solid rgba(239, 68, 68, 0.3)`,
                  }}
                >
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="mx-auto mb-3 w-fit p-2 rounded-xl"
                    style={{ background: `rgba(239, 68, 68, 0.2)` }}
                  >
                    <AlertCircle 
                      className="w-6 h-6" 
                      style={{ color: `var(--error)` }}
                    />
                  </motion.div>
                  <p 
                    className="text-sm font-semibold mb-3"
                    style={{ color: `var(--error)` }}
                  >
                    {fidError ||
                      "No Farcaster ID found. Please link your address to Farcaster to claim."}
                  </p>
                  <motion.a
                    href="https://warpcast.com/~/settings"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-bold underline inline-block px-4 py-2 rounded-lg"
                    style={{ 
                      color: `var(--primary)`,
                      background: `var(--surface-primary)`,
                    }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Link on Warpcast
                  </motion.a>
                </motion.div>
              ) : (
                <div className="space-y-3">
                  <label
                    htmlFor="farcaster-id"
                    className="block text-sm font-semibold text-foreground-secondary"
                  >
                    Your Farcaster ID / Quality Score
                  </label>
                  <Input
                    id="farcaster-id"
                    type="text"
                    value={`${fid} || ${qualityScore}` || username || ""}
                    disabled
                    className="modern-input w-full py-3 text-base font-semibold"
                    style={{
                      background: `var(--surface-hover)`,
                      border: `1px solid var(--border)`,
                      color: `var(--foreground)`,
                    }}
                    aria-readonly="true"
                  />
                </div>
              )}

              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  onClick={handleSubmit}
                  disabled={
                    isPending ||
                    claimPending ||
                    !fid ||
                    !canClaim() ||
                    !!fidError ||
                    !isCorrectChain ||
                    hasClaimed
                  }
                  className="w-full py-4 text-base font-bold rounded-xl"
                  style={{
                    background: hasClaimed || !canClaim() 
                      ? `var(--surface)` 
                      : `var(--gradient-secondary)`,
                    boxShadow: hasClaimed || !canClaim() 
                      ? 'none' 
                      : `var(--glow-secondary)`,
                    color: hasClaimed || !canClaim() 
                      ? `var(--foreground-muted)` 
                      : 'white',
                    opacity: hasClaimed || !canClaim() ? 0.6 : 1,
                  }}
                  aria-label={`Claim ${maxClaim} ${currency}`}
                >
                  {claimPending || isPending ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      <Loader2 className="w-6 h-6" />
                    </motion.div>
                  ) : (
                    <div className="flex items-center justify-center gap-3">
                      <motion.div
                        animate={!hasClaimed && canClaim() ? { 
                          y: [0, -3, 0],
                          rotate: [0, 5, -5, 0] 
                        } : {}}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <HandCoins className="w-6 h-6" />
                      </motion.div>
                      {hasClaimed ? (
                        <span>You have already claimed</span>
                      ) : (
                        <span>Claim {maxClaim} {currency}</span>
                      )}
                    </div>
                  )}
                </Button>
              </motion.div>
            </div>
          )}
        </motion.div>
      ) : activeTab === "lottery" ? (
        <JackPot isCorrectChain={isCorrectChain} />
      ) : activeTab === "lottery2" ? (
        <JackPotV2 isCorrectChain={isCorrectChain} />
      ) : null}
    </motion.div>
  );
}
