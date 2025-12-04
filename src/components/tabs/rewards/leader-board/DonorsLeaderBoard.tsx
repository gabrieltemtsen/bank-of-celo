/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { usePublicClient, useAccount } from "wagmi";
import { formatEther } from "viem";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "~/components/ui/Button";
import { truncateAddress } from "~/lib/truncateAddress";
import { toast } from "sonner";
import { useBankContract } from "~/hooks/contracts";
import { celo } from "viem/chains";
import {
  Trophy,
  Loader2,
  Award,
  ChevronDown,
  ChevronUp,
  RefreshCcw,
} from "lucide-react";
import { useChainMode } from "~/app/chain-mode/context";

interface Donor {
  donor: string;
  amount: string;
  username: string | null; // Added to store username
  rank: number;
}

interface LeaderBoardProps {
  isCorrectChain?: boolean;
}

import { cn } from "~/lib/utils";

export default function DonorsLeaderBoard({
  isCorrectChain = true,
}: LeaderBoardProps) {
  const publicClient = usePublicClient();
  const { address } = useAccount();
  const [donors, setDonors] = useState<Donor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedDonor, setExpandedDonor] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const { mode } = useChainMode();
  const currency = mode === "degen" ? "DEGEN" : "CELO";
  const { address: bankAddress, abi: bankAbi } = useBankContract();

  const isDegen = mode === "degen";

  // Fetch current user's username
  useEffect(() => {
    async function fetchUsername() {
      try {
        if (!address) {
          setUsername(null);
          setLoading(false);
          return;
        }
        const response = await fetch(
          `/api/farcaster/username?address=${address}`,
        );
        const data = await response.json();

        if (response.ok && data.username) {
          setUsername(data.username);
          console.log("Fetched username:", data.username);
        } else {
          setUsername(null);
          console.log("No username found for address:", address);
        }
      } catch (error) {
        console.error("Error fetching Farcaster username:", error);
        setUsername(null);
      } finally {
        setLoading(false);
      }
    }
    fetchUsername();
  }, [address]);

  // Fetch username for a given address
  const getUsername = async (donorAddress: string): Promise<string | null> => {
    if (!donorAddress) return null;
    try {
      const response = await fetch(
        `/api/farcaster/username?address=${donorAddress}`,
      );
      const data = await response.json();
      return data.username || null;
    } catch (error) {
      console.error("Error fetching username:", error);
      return null;
    }
  };

  const fetchLeaderboard = async () => {
    setIsLoading(true);
    try {
      if (!publicClient || !isCorrectChain) {
        toast.error(`Please connect to ${mode === "degen" ? "Base" : "Celo"} network`);
        setIsLoading(false);
        return;
      }

      // Get top donors from contract
      const leaderboard = (await publicClient.readContract({
        address: bankAddress as `0x${string}`,
        abi: bankAbi,
        functionName: "getLeaderboard",
      })) as any[];

      // Format donor data with usernames
      const formattedDonors = await Promise.all(
        leaderboard
          .filter(
            (entry) =>
              entry.donor !== "0x0000000000000000000000000000000000000000",
          )
          .map(async (entry, index) => ({
            donor: entry.donor,
            amount: formatEther(entry.amount),
            username: await getUsername(entry.donor), // Fetch username
            rank: index + 1,
          })),
      );

      setDonors(formattedDonors);
      toast.success("Leaderboard updated");
    } catch (error) {
      console.log("Failed to fetch leaderboard:", error);
      toast.error("Failed to load leaderboard");
    } finally {
      setIsLoading(false);
    }
  };

  // Check if current user is in the leaderboard
  const getUserRank = () => {
    if (!address) return null;
    return (
      donors.findIndex(
        (donor) => donor.donor.toLowerCase() === address.toLowerCase(),
      ) + 1
    );
  };

  const userRank = getUserRank();

  useEffect(() => {
    fetchLeaderboard();

    // Watch for new donations
    const unwatch = publicClient?.watchContractEvent({
      address: bankAddress as `0x${string}`,
      abi: bankAbi,
      eventName: "Donated",
      onLogs: () => fetchLeaderboard(),
    });

    return () => unwatch?.();
  }, [publicClient, isCorrectChain]);

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="space-y-6"
      >
        <div className={cn(
          "p-5 rounded-2xl shadow-sm border",
          "bg-[var(--bg-secondary)] border-[var(--border-primary)]"
        )}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base sm:text-lg font-semibold flex items-center gap-3">
              <div className={cn(
                "p-1.5 sm:p-2 rounded-lg",
                "bg-[var(--bg-tertiary)]"
              )}>
                <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--accent-primary)]" />
              </div>
              <span className="text-[var(--text-primary)]">Top Donors</span>
            </h2>
            <button
              onClick={fetchLeaderboard}
              disabled={isLoading || !isCorrectChain}
              className={cn(
                "text-[11px] text-center flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 font-medium rounded-full py-1.5 transition-all duration-200",
                "bg-[var(--bg-tertiary)] text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]/80"
              )}
            >
              {isLoading ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <RefreshCcw className="w-3 h-3" />
              )}
            </button>
          </div>
          <div className={cn(
            "p-5 mb-4 rounded-2xl border text-xs",
            "bg-[var(--bg-tertiary)] border-[var(--border-primary)] text-[var(--text-secondary)]"
          )}>
            Welcome to the Donors Leaderboard where, a list of our top donors
            are acknowledged!!
          </div>

          {!isCorrectChain ? (
            <div className="p-4 text-center bg-yellow-500/10 rounded-lg border border-yellow-500/20">
              <p className="text-yellow-500">
                Please connect to {mode === "degen" ? "Base" : "Celo"} network to view leaderboard
              </p>
            </div>
          ) : isLoading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="w-8 h-8 animate-spin text-[var(--accent-primary)]" />
            </div>
          ) : donors.length === 0 ? (
            <div className="p-4 text-center bg-[var(--bg-tertiary)] rounded-lg">
              <p className="text-[var(--text-secondary)]">
                No donations yet. Be the first to contribute!
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <AnimatePresence>
                {donors.map((donor, index) => (
                  <motion.div
                    key={`${donor.donor}-${index}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ delay: index * 0.05 }}
                    className={cn(
                      "overflow-hidden rounded-lg transition-all duration-200 border",
                      expandedDonor === donor.donor
                        ? "bg-[var(--bg-tertiary)] border-[var(--accent-primary)]"
                        : "bg-[var(--bg-secondary)] border-transparent hover:bg-[var(--bg-tertiary)]",
                      donor.donor === address && "ring-2 ring-[var(--accent-primary)]"
                    )}
                  >
                    <button
                      onClick={() =>
                        setExpandedDonor(
                          expandedDonor === donor.donor ? null : donor.donor,
                        )
                      }
                      className="w-full flex items-center p-3 transition-all duration-200"
                    >
                      <div className="flex items-center w-full">
                        <div
                          className={cn(
                            "w-8 h-8 flex items-center justify-center rounded-full mr-3 transition-all duration-200",
                            index < 3
                              ? "bg-gradient-to-br from-yellow-400 to-yellow-600 shadow-md text-white"
                              : "bg-[var(--bg-tertiary)] text-[var(--text-secondary)]"
                          )}
                        >
                          <span className="text-sm font-bold">
                            {index + 1}
                          </span>
                        </div>
                        <div className="text-left flex-1">
                          <p className="text-xs sm:text-sm font-medium text-[var(--text-primary)] truncate">
                            {donor.username || truncateAddress(donor.donor)}
                            {donor.donor === address && (
                              <span className="ml-2 text-xs bg-[var(--accent-primary)] text-[var(--accent-text)] px-2 py-0.5 rounded-full">
                                You
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-[var(--text-secondary)]">
                            {parseFloat(donor.amount).toFixed(2)} {currency}
                          </p>
                        </div>
                        {expandedDonor === donor.donor ? (
                          <ChevronUp className="w-4 h-4 text-[var(--text-tertiary)] transition-transform duration-200" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-[var(--text-tertiary)] transition-transform duration-200" />
                        )}
                      </div>
                    </button>

                    {expandedDonor === donor.donor && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="px-3 pb-3"
                      >
                        <div className="pt-2 border-t border-[var(--border-primary)]">
                          <div className="flex justify-between text-xs text-[var(--text-secondary)]">
                            <span>Total Donations:</span>
                            <span className="font-medium">
                              {parseFloat(donor.amount).toFixed(2)} {currency}
                            </span>
                          </div>
                          <div className="flex justify-between text-xs text-[var(--text-secondary)] mt-1">
                            <span>Address:</span>
                            <span className="font-mono">{donor.donor}</span>
                          </div>
                          <div className="flex justify-between text-xs text-[var(--text-secondary)] mt-1">
                            <span>Rank:</span>
                            <span className="font-medium">#{index + 1}</span>
                          </div>
                          {donor.username && (
                            <div className="flex justify-between text-xs text-[var(--text-secondary)] mt-1">
                              <span>Username:</span>
                              <span className="font-medium">
                                {donor.username}
                              </span>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Top Donor Highlight */}
        {donors.length > 0 && (
          <div className={cn(
            "p-5 rounded-2xl border",
            "bg-[var(--bg-tertiary)] border-[var(--border-primary)]"
          )}>
            <div className="flex items-center gap-3 mb-3">
              <Award className="w-5 h-5 text-[var(--accent-primary)]" />
              <h3 className="font-medium text-[var(--text-primary)]">
                Top Donor
              </h3>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 flex items-center justify-center bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full shadow-md">
                <span className="text-sm font-bold text-white">1</span>
              </div>
              <div>
                <p className="text-sm font-medium text-[var(--text-primary)]">
                  {donors[0].username || truncateAddress(donors[0].donor)}
                </p>
                <p className="text-xs text-[var(--text-secondary)]">
                  {parseFloat(donors[0].amount).toFixed(2)} {currency} donated
                </p>
              </div>
            </div>
          </div>
        )}

        {/* User's Position (if not in top donors) */}
        {userRank !== null && userRank > donors.length && (
          <div className="p-4 bg-[var(--bg-tertiary)] rounded-lg">
            <p className="text-sm text-center text-[var(--text-secondary)]">
              Your rank: #{userRank} with {donors[userRank - 1]?.amount || "0"}{" "}
              {currency} donated
            </p>
          </div>
        )}
      </motion.div>
    </>
  );
}
