import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Loader2, Send, Gift, HandCoins, Clock, AlertCircle } from "lucide-react";
import { Button } from "~/components/ui/Button";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { Input } from "../ui/input";
import { useAccount } from "wagmi";

interface TransactTabProps {
  onDonate: (amount: string) => void;
  onClaim: (fid: number) => void; // Kept for compatibility, but we'll use gasless claim
  maxClaim?: string;
  claimCooldown?: number;
  lastClaimAt?: number;
  isCorrectChain: boolean;
  isPending: boolean;
  fid?: number; // Initial FID (optional, we'll fetch dynamically)
}

interface NeynarResponse {
  fid: number | null;
  error?: string;
}

export default function TransactTab({
  onDonate,
  maxClaim = "0.5",
  claimCooldown = 86400,
  lastClaimAt = 0,
  isCorrectChain,
  isPending,
}: TransactTabProps) {
  const { address } = useAccount();
  const [amount, setAmount] = useState("");
  const [fid, setFid] = useState<number | null>(null);
  const [fidLoading, setFidLoading] = useState(false);
  const [fidError, setFidError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"donate" | "claim">("donate");
  const [claimPending, setClaimPending] = useState(false);

  // Fetch FID from Neynar API
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
      if (!data.fid) {
        setFidError("No Farcaster ID associated with this address");
      }
    } catch (error) {
      console.error("Error fetching FID:", error);
      setFidError(error instanceof Error ? error.message : "Failed to fetch FID");
      setFid(null);
    } finally {
      setFidLoading(false);
    }
  }, [address]);

  useEffect(() => {
    fetchFid();
  }, [fetchFid]);

  const canClaim = () => {
    if (!lastClaimAt) return true;
    const now = Math.floor(Date.now() / 1000);
    return now >= lastClaimAt + claimCooldown;
  };

  const nextClaimTime = lastClaimAt ? new Date((lastClaimAt + claimCooldown) * 1000) : null;

  // Handle gasless claim via API
  const handleGaslessClaim = async () => {
    if (!fid || !address) {
      toast.error("Farcaster ID or address missing");
      return;
    }

    setClaimPending(true);
    try {
      const response = await fetch("/api/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address, fid }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to process claim");
      }

      const { taskId } = await response.json();
      toast.success(`Claim submitted! Task ID: ${taskId}`);
      // Optionally refetch contract data or update UI
    } catch (error) {
      console.error("Gasless claim error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to process claim");
    } finally {
      setClaimPending(false);
    }
  };

  const handleSubmit = () => {
    if (!isCorrectChain) {
      toast.error("Please switch to Celo Network");
      return;
    }

    if (activeTab === "donate") {
      if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
        toast.error("Please enter a valid amount");
        return;
      }
      onDonate(amount);
      setAmount("");
    } else {
      handleGaslessClaim();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Header with Tabs */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-lg">
            <Gift className="w-5 h-5 text-blue-600 dark:text-blue-300" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Bank of Celo Vault
          </h2>
        </div>

        {/* Tab Selector */}
        <div className="flex bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
          <button
            onClick={() => setActiveTab("donate")}
            className={`flex-1 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
              activeTab === "donate"
                ? "bg-white dark:bg-gray-700 shadow-sm text-emerald-600 dark:text-emerald-400"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
            aria-label="Donate tab"
            role="tab"
            aria-selected={activeTab === "donate"}
          >
            <Gift className="w-4 h-4" />
            Donate
          </button>
          <button
            onClick={() => setActiveTab("claim")}
            className={`flex-1 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
              activeTab === "claim"
                ? "bg-white dark:bg-gray-700 shadow-sm text-amber-600 dark:text-amber-400"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
            aria-label="Claim tab"
            role="tab"
            aria-selected={activeTab === "claim"}
          >
            <HandCoins className="w-4 h-4" />
            Claim
          </button>
        </div>
      </div>

      {!isCorrectChain ? (
        <div className="p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 text-center">
          <p className="text-gray-600 dark:text-gray-300">
            Please switch to Celo Network to proceed
          </p>
        </div>
      ) : activeTab === "donate" ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700"
        >
          <div className="space-y-5">
            <div>
              <label
                htmlFor="donate-amount"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Amount to Donate (CELO)
              </label>
              <Input
                id="donate-amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.0"
                className="w-full py-3 text-base"
                min="0"
                step="0.01"
              />
            </div>
            <Button
              onClick={handleSubmit}
              disabled={isPending || !amount}
              className="w-full py-3 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white"
              aria-label="Donate CELO"
            >
              {isPending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <Send className="w-5 h-5" />
                  <span>Donate CELO</span>
                </div>
              )}
            </Button>
          </div>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700"
        >
          <div className="space-y-5">
            {!canClaim() && nextClaimTime && (
              <div className="p-3 bg-amber-50 dark:bg-amber-900/30 rounded-lg text-sm text-amber-800 dark:text-amber-200 flex items-center">
                <Clock className="w-4 h-4 mr-2 flex-shrink-0" />
                <span>
                  You can claim again {formatDistanceToNow(nextClaimTime, { addSuffix: true })}
                </span>
              </div>
            )}

            {fidLoading ? (
              <div className="p-4 text-center bg-gray-50 dark:bg-gray-700 rounded-lg">
                <Loader2 className="w-5 h-5 animate-spin text-amber-500 mx-auto mb-2" />
                <p className="text-gray-600 dark:text-gray-300">Fetching Farcaster ID...</p>
              </div>
            ) : fidError || !fid ? (
              <div className="p-4 text-center bg-red-50 dark:bg-red-900/30 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-500 mx-auto mb-2" />
                <p className="text-sm text-red-700 dark:text-red-300">
                  {fidError || "No Farcaster ID found. Please link your address to Farcaster to claim."}
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
                  Your Farcaster ID
                </label>
                <Input
                  id="farcaster-id"
                  type="number"
                  value={fid}
                  disabled
                  className="w-full py-3 text-base bg-gray-100 dark:bg-gray-700"
                  aria-readonly="true"
                />
              </div>
            )}

            <Button
              onClick={handleSubmit}
              disabled={isPending || claimPending || !fid || !canClaim() || !!fidError}
              className="w-full py-3 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 text-white"
              aria-label={`Claim ${maxClaim} CELO`}
            >
              {claimPending || isPending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <HandCoins className="w-5 h-5" />
                  <span>Claim {maxClaim} CELO (Gasless)</span>
                </div>
              )}
            </Button>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}