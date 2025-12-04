/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
import { useState } from "react";
import { useAccount } from "wagmi";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useQuery } from "convex/react";
import {
  Trophy,
  Loader2,
  Award,
  ChevronDown,
  ChevronUp,
  RefreshCcw,
} from "lucide-react";
import { api } from "../../../../../convex/_generated/api";
import { useChainMode } from "~/app/chain-mode/context";

interface User {
  _id: string;
  _creationTime: number;
  fid: string;
  username: string;
  score: number;
  address: string;
  isOG: boolean;
}

interface LeaderBoardProps {
  isCorrectChain?: boolean;
}

import { cn } from "~/lib/utils";

export default function RewardsLeaderBoard({
  isCorrectChain = true,
}: LeaderBoardProps) {
  const { address } = useAccount();
  const [expandedDonor, setExpandedDonor] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const { mode } = useChainMode();

  const isDegen = mode === "degen";

  // Fetch leaderboard from Convex
  const leaderboardData = useQuery(api.users.getLeaderboard, { limit: 50 });
  const users = leaderboardData || [];

  // Sort users by score in descending order
  const sortedUsers = [...users].sort((a, b) => b.score - a.score);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      if (!isCorrectChain) {
        toast.error(`Please connect to ${mode === "degen" ? "Base" : "Celo"} network`);
        return;
      }
      toast.success("Leaderboard refreshed");
    } catch (error) {
      console.log("Failed to refresh leaderboard:", error);
      toast.error("Failed to refresh leaderboard");
    } finally {
      setLoading(false);
    }
  };

  // Check if current user is in the leaderboard
  const getUserRank = () => {
    if (!address) return null;
    return (
      sortedUsers.findIndex(
        (user) => user.address.toLowerCase() === address.toLowerCase(),
      ) + 1
    );
  };

  const userRank = getUserRank();

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
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
            <span className="text-[var(--text-primary)]">{mode === "degen" ? "Degen" : "Celo"} Rewards</span>
          </h2>
          <button
            onClick={fetchLeaderboard}
            disabled={loading || !isCorrectChain}
            className={cn(
              "text-[11px] text-center flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 font-medium rounded-full py-1.5 transition-all duration-200",
              "bg-[var(--bg-tertiary)] text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]/80"
            )}
          >
            {loading ? (
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
          Welcome to the {mode === "degen" ? "Degen" : "Celo"} Leaderboard where we display our users who cast
          via the {mode === "degen" ? "degen" : "celo"} channel!! In addition, users successfully verified using
          their passports through the Self Protocol will have a multiplier of
          x2!!
        </div>

        {!isCorrectChain ? (
          <div className="p-4 text-center bg-yellow-500/10 rounded-lg border border-yellow-500/20">
            <p className="text-yellow-500">
              Please connect to {mode === "degen" ? "Base" : "Celo"} network to view leaderboard
            </p>
          </div>
        ) : loading && !leaderboardData ? (
          <div className="flex justify-center py-6">
            <Loader2 className="w-8 h-8 animate-spin text-[var(--accent-primary)]" />
          </div>
        ) : sortedUsers.length === 0 ? (
          <div className="p-4 text-center bg-[var(--bg-tertiary)] rounded-lg">
            <p className="text-[var(--text-secondary)]">
              No activity yet. Start casting in the {mode === "degen" ? "degen" : "celo"} channel!
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <AnimatePresence>
              {sortedUsers.map((user, index) => (
                <motion.div
                  key={user._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ delay: index * 0.05 }}
                  className={cn(
                    "overflow-hidden rounded-lg transition-all duration-200 border",
                    expandedDonor === user.address
                      ? "bg-[var(--bg-tertiary)] border-[var(--accent-primary)]"
                      : "bg-[var(--bg-secondary)] border-transparent hover:bg-[var(--bg-tertiary)]",
                    user.address === address && "ring-2 ring-[var(--accent-primary)]"
                  )}
                >
                  <button
                    onClick={() =>
                      setExpandedDonor(
                        expandedDonor === user.address ? null : user.address,
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
                          {user.username || truncateAddress(user.address)}
                          {user.address === address && (
                            <span className="ml-2 text-xs bg-[var(--accent-primary)] text-[var(--accent-text)] px-2 py-0.5 rounded-full">
                              You
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-[var(--text-secondary)]">
                          {user.score.toFixed(2)} Points
                        </p>
                      </div>
                      {expandedDonor === user.address ? (
                        <ChevronUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[var(--text-tertiary)] transition-transform duration-200" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[var(--text-tertiary)] transition-transform duration-200" />
                      )}
                    </div>
                  </button>

                  {expandedDonor === user.address && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="px-3 pb-3"
                    >
                      <div className="pt-2 border-t border-[var(--border-primary)]">
                        <div className="flex justify-between text-xs text-[var(--text-secondary)]">
                          <span>Total Points:</span>
                          <span className="font-medium">
                            {user.score.toFixed(2)} Points
                          </span>
                        </div>
                        <div className="flex justify-between text-xs text-[var(--text-secondary)] mt-1">
                          <span>Address:</span>
                          <span className="font-mono">{user.address}</span>
                        </div>
                        <div className="flex justify-between text-xs text-[var(--text-secondary)] mt-1">
                          <span>Rank:</span>
                          <span className="font-medium">#{index + 1}</span>
                        </div>
                        {user.username && (
                          <div className="flex justify-between text-xs text-[var(--text-secondary)] mt-1">
                            <span>Username:</span>
                            <span className="font-medium">{user.username}</span>
                          </div>
                        )}
                        {user.isOG && (
                          <div className="flex justify-between text-xs text-[var(--text-secondary)] mt-1">
                            <span>Status:</span>
                            <span className="font-medium text-[var(--accent-primary)]">
                              OG (2x multiplier)
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

      {/* Top User Highlight */}
      {sortedUsers.length > 0 && (
        <div className={cn(
          "p-5 rounded-2xl border",
          "bg-[var(--bg-tertiary)] border-[var(--border-primary)]"
        )}>
          <div className="flex items-center gap-3 mb-3">
            <Award className="w-5 h-5 text-[var(--accent-primary)]" />
            <h3 className="font-medium text-[var(--text-primary)]">
              Top User
            </h3>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 flex items-center justify-center bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full shadow-md">
              <span className="text-sm font-bold text-white">1</span>
            </div>
            <div>
              <p className="text-sm font-medium text-[var(--text-primary)]">
                {sortedUsers[0].username ||
                  truncateAddress(sortedUsers[0].address)}
              </p>
              <p className="text-xs text-[var(--text-secondary)]">
                {sortedUsers[0].score.toFixed(2)} Points
              </p>
            </div>
          </div>
        </div>
      )}

      {/* User's Position (if not in top users) */}
      {userRank !== null && userRank > sortedUsers.length && (
        <div className="p-4 bg-[var(--bg-tertiary)] rounded-lg">
          <p className="text-sm text-center text-[var(--text-secondary)]">
            Your rank: #{userRank} with{" "}
            {sortedUsers[userRank - 1]?.score.toFixed(2) || "0"} Points
          </p>
        </div>
      )}
    </motion.div>
  );
}
