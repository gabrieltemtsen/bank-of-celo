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
import { formatDistanceToNow } from "date-fns";
import { Input } from "../ui/input";
import {
  useAccount,
  usePublicClient,
  useSignTypedData,
  useSendTransaction,
} from "wagmi";
import { useBankContract } from "~/hooks/contracts";
import JackPot from "./JackPot";
import JackPotV2 from "./JackPotV2";
import { useChainMode } from "~/app/chain-mode/context";
import { getDataSuffix, submitReferral } from "@divvi/referral-sdk";
import { encodeFunctionData, formatEther, parseEther, parseUnits } from "viem";

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
  const { address: bankAddress, abi: bankAbi } = useBankContract();
  const [amount, setAmount] = useState("");
  const [fid, setFid] = useState<number | null>(null);
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
  const maxClaim = mode === "degen" ? "250" : initialMaxClaim;

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
      const username = await getUsername(address);
      setUsername(username);
      if (!data.fid) {
        setFidError("No Farcaster ID associated with this address");
      } else {
        if (!publicClient) {
          throw new Error("Public client is not available");
        }
        const isBlacklisted = await publicClient.readContract({
          address: bankAddress,
          abi: bankAbi,
          functionName: "fidBlacklisted",
          args: [BigInt(data.fid)],
        });
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
        chainId: mode === "degen" ? 8453 : 42220,
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

      const balance = await publicClient.getBalance({ address });
      const minBalance = parseEther("0.001");

      if (balance >= minBalance) {
        const contractData = encodeFunctionData({
          abi: bankAbi,
          functionName: "claim",
          args: [BigInt(fid), BigInt(deadline), signature],
        });

        const finalData = dataSuffix ? contractData + dataSuffix : contractData;

        const hash = await sendTransactionAsync({
          to: bankAddress,
          data: finalData as `0x${string}`,
          value: 0n,
          maxFeePerGas: parseUnits("100", 9),
          maxPriorityFeePerGas: parseUnits("100", 9),
        });

        try {
          await submitReferral({
            txHash: hash,
            chainId: mode === "degen" ? 8453 : 42220,
          });
        } catch (diviError) {
          console.log("Divi submitReferral error:", diviError);
          toast.warning("Claim succeeded, but referral tracking failed");
        }

        setTxHash(hash);
        toast.success(
          `Claimed ${maxClaim} ${currency}! Transaction hash: ${hash.slice(0, 6)}...`,
        );
      } else {
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
        setTxHash(result.transactionHash);

        try {
          await submitReferral({
            txHash: result.transactionHash,
            chainId: mode === "degen" ? 8453 : 42220,
          });
        } catch (diviError) {
          console.log("Divi submitReferral error:", diviError);
          toast.warning("Claim succeeded, but referral tracking failed");
        }

        toast.success(
          `Claimed ${maxClaim} ${currency} (gasless)! Transaction hash: ${result.transactionHash.slice(0, 6)}...`,
        );
      }
    } catch (error) {
      console.log("Claim error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to process claim",
      );
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
      onDonate(amount);
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
        <div className="flex flex-wrap bg-gray-100 dark:bg-gray-800 rounded-xl p-1 gap-1 w-full">
          <button
            onClick={() => setActiveTab("donate")}
            className={`flex-1 min-w-[120px] py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
              activeTab === "donate"
                ? "bg-white dark:bg-gray-700 shadow-sm text-emerald-600 dark:text-emerald-400"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
            aria-label="Donate tab"
            role="tab"
            aria-selected={activeTab === "donate"}
          >
            <Gift className="w-4 h-4" />
            <span className="whitespace-nowrap">Donate</span>
          </button>
          <button
            onClick={() => setActiveTab("claim")}
            className={`flex-1 min-w-[120px] py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
              activeTab === "claim"
                ? "bg-white dark:bg-gray-700 shadow-sm text-amber-600 dark:text-amber-400"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
            aria-label="Claim tab"
            role="tab"
            aria-selected={activeTab === "claim"}
          >
            <HandCoins className="w-4 h-4" />
            <span className="whitespace-nowrap">Claim</span>
          </button>
          <button
            onClick={() => setActiveTab("lottery")}
            className={`flex-1 min-w-[120px] py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
              activeTab === "lottery"
                ? "bg-white dark:bg-gray-700 shadow-sm text-purple-600 dark:text-purple-400"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
            aria-label="jackpot tab"
            role="tab"
            aria-selected={activeTab === "lottery"}
          >
            <Ticket className="w-4 h-4" />
            <span className="whitespace-nowrap">Jackpot</span>
          </button>
          <button
            onClick={() => setActiveTab("lottery2")}
            className={`flex-1 min-w-[120px] py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
              activeTab === "lottery2"
                ? "bg-white dark:bg-gray-700 shadow-sm text-green-800 dark:text-green-800"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
            aria-label="jackpot tab"
            role="tab"
            aria-selected={activeTab === "lottery2"}
          >
            <Ticket className="w-4 h-4" />
            <span className="whitespace-nowrap">JackpotV2</span>
          </button>
        </div>
      </div>

      {activeTab === "donate" ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="p-4 sm:p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 w-full"
        >
          <div className="space-y-4">
            <div>
              <label
                htmlFor="donate-amount"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Amount to Donate ({currency})
              </label>
              <Input
                id="donate-amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.0"
                className="w-full py-3 text-black"
                min="0"
                step="0.01"
              />
            </div>
            <Button
              onClick={handleSubmit}
              disabled={isPending || !amount}
              className="w-full py-3 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white"
              aria-label={`Donate ${currency}`}
            >
              {isPending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <Send className="w-5 h-5" />
                  <span>Donate {currency}</span>
                </div>
              )}
            </Button>
          </div>
        </motion.div>
      ) : activeTab === "claim" ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="p-4 sm:p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 w-full"
        >
          {isUnderMaintenance ? (
            <div className="text-center space-y-4">
              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/30 rounded-lg text-yellow-800 dark:text-yellow-200">
                <div className="flex flex-col items-center">
                  <AlertTriangle className="w-8 h-8 mb-2 text-yellow-500" />
                  <h3 className="text-lg font-medium">
                    Maintenance in Progress
                  </h3>
                  <p className="mt-1 text-sm">
                    The claim feature is under maintenance. Please check back
                    later.
                  </p>
                </div>
              </div>
              <Button
                onClick={() => window.location.reload()}
                className="w-full"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh Page
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {!canClaim() && nextClaimTime && (
                <div className="p-3 bg-amber-50 dark:bg-amber-900/30 rounded-lg text-sm text-amber-800 dark:text-amber-200 flex items-center">
                  <Clock className="w-4 h-4 mr-2 flex-shrink-0" />
                  <span>
                    You can claim again{" "}
                    {formatDistanceToNow(nextClaimTime, { addSuffix: true })}
                  </span>
                </div>
              )}

              {txHash && (
                <div className="p-3 bg-green-50 dark:bg-green-900/30 rounded-lg text-sm text-green-800 dark:text-green-200 flex items-center">
                  <span>
                    Claim successful!{" "}
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

              {fidLoading ? (
                <div className="p-4 text-center bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <Loader2 className="w-5 h-5 animate-spin text-amber-500 mx-auto mb-2" />
                  <p className="text-gray-600 dark:text-gray-300">
                    Fetching Farcaster ID...
                  </p>
                </div>
              ) : fidError || !fid ? (
                <div className="p-4 text-center bg-red-50 dark:bg-red-900/30 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-red-500 mx-auto mb-2" />
                  <p className="text-sm text-red-700 dark:text-red-300">
                    {fidError ||
                      "No Farcaster ID found. Please link your address to Farcaster to claim."}
                  </p>
                  <a
                    href="https://warpcast.com/~/settings"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 dark:text-blue-400 underline mt-2 inline-block"
                  >
                    Link on Warpcast
                  </a>
                </div>
              ) : (
                <div>
                  <label
                    htmlFor="farcaster-id"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    Your Farcaster username/ ID
                  </label>
                  <Input
                    id="farcaster-id"
                    type="number"
                    value={fid || username || ""}
                    disabled
                    className="w-full py-3 text-black bg-gray-100 dark:bg-gray-700"
                    aria-readonly="true"
                  />
                </div>
              )}

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
                className="w-full py-3 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 text-white"
                aria-label={`Claim ${maxClaim} ${currency}`}
              >
                {claimPending || isPending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <HandCoins className="w-5 h-5" />
                    {hasClaimed ? (
                      <span>You have already claimed</span>
                    ) : (
                      <span>Claim {maxClaim} {currency}</span>
                    )}
                  </div>
                )}
              </Button>
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
