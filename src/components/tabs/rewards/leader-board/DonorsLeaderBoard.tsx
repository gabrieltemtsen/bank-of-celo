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
  
  // Dynamic color classes based on mode
  const isDegen = mode === "degen";
  const primaryColor = isDegen ? "purple" : "emerald";
  const secondaryColor = isDegen ? "blue" : "emerald";

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
        <div className="p-5 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-3">
              <div className={`bg-${primaryColor}-100 dark:bg-${primaryColor}-900 p-2 rounded-lg`}>
                <Trophy className={`w-5 h-5 text-${primaryColor}-600 dark:text-${primaryColor}-300`} />
              </div>
              <span className="text-gray-900 dark:text-white">Top Donors</span>
            </h2>
            <button
              onClick={fetchLeaderboard}
              disabled={isLoading || !isCorrectChain}
              className="text-xs text-center flex items-center justify-center w-10 h-10 font-medium bg-gradient-to-br from-emerald-400 to-emerald-600 hover:from-emerald-500 hover:to-emerald-700 dark:bg-gray-700 dark:hover:bg-gray-600 text-white rounded-full py-1.5 transition-all duration-200"
            >
              {isLoading ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <RefreshCcw className="w-3 h-3" />
              )}
            </button>
          </div>
          <div className={`p-5 mb-4 bg-gradient-to-r text-xs from-${primaryColor}-50 to-${secondaryColor}-50 dark:from-${primaryColor}-900/30 dark:to-${secondaryColor}-900/30 rounded-2xl border border-${primaryColor}-100 dark:border-${primaryColor}-800`}>
            Welcome to the Donors Leaderboard where, a list of our top donors
            are acknowledged!!
          </div>

          {!isCorrectChain ? (
            <div className="p-4 text-center bg-yellow-50 dark:bg-yellow-900/30 rounded-lg">
              <p className="text-yellow-600 dark:text-yellow-300">
                Please connect to {mode === "degen" ? "Base" : "Celo"} network to view leaderboard
              </p>
            </div>
          ) : isLoading ? (
            <div className="flex justify-center py-6">
              <Loader2 className={`w-8 h-8 animate-spin text-${primaryColor}-500`} />
            </div>
          ) : donors.length === 0 ? (
            <div className="p-4 text-center bg-gray-50 dark:bg-gray-700 rounded-lg">
              <p className="text-gray-600 dark:text-gray-300">
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
                    className={`overflow-hidden rounded-lg transition-all duration-200 ${
                      expandedDonor === donor.donor
                        ? `bg-${primaryColor}-50 dark:bg-${primaryColor}-900/30 border border-${primaryColor}-100 dark:border-${primaryColor}-800`
                        : "bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600"
                    } ${donor.donor === address ? `ring-2 ring-${primaryColor}-500` : ""}`}
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
                          className={`w-8 h-8 flex items-center justify-center rounded-full mr-3 transition-all duration-200 ${
                            index < 3
                              ? "bg-gradient-to-br from-yellow-400 to-yellow-600 shadow-md"
                              : `bg-${primaryColor}-100 dark:bg-${primaryColor}-900`
                          }`}
                        >
                          <span
                            className={`text-sm font-bold ${
                              index < 3
                                ? "text-white"
                                : `text-${primaryColor}-600 dark:text-${primaryColor}-300`
                            }`}
                          >
                            {index + 1}
                          </span>
                        </div>
                        <div className="text-left flex-1">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {donor.username || truncateAddress(donor.donor)}
                            {donor.donor === address && (
                              <span className={`ml-2 text-xs bg-${primaryColor}-100 dark:bg-${primaryColor}-900 text-${primaryColor}-600 dark:text-${primaryColor}-300 px-2 py-0.5 rounded-full`}>
                                You
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {parseFloat(donor.amount).toFixed(2)} {currency}
                          </p>
                        </div>
                        {expandedDonor === donor.donor ? (
                          <ChevronUp className="w-4 h-4 text-gray-500 transition-transform duration-200" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-gray-500 transition-transform duration-200" />
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
                        <div className={`pt-2 border-t border-${primaryColor}-100 dark:border-${primaryColor}-800`}>
                          <div className="flex justify-between text-xs text-gray-600 dark:text-gray-300">
                            <span>Total Donations:</span>
                            <span className="font-medium">
                              {parseFloat(donor.amount).toFixed(2)} {currency}
                            </span>
                          </div>
                          <div className="flex justify-between text-xs text-gray-600 dark:text-gray-300 mt-1">
                            <span>Address:</span>
                            <span className="font-mono">{donor.donor}</span>
                          </div>
                          <div className="flex justify-between text-xs text-gray-600 dark:text-gray-300 mt-1">
                            <span>Rank:</span>
                            <span className="font-medium">#{index + 1}</span>
                          </div>
                          {donor.username && (
                            <div className="flex justify-between text-xs text-gray-600 dark:text-gray-300 mt-1">
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
          <div className={`p-5 bg-gradient-to-r from-${primaryColor}-50 to-${secondaryColor}-50 dark:from-${primaryColor}-900/30 dark:to-${secondaryColor}-900/30 rounded-2xl border border-${primaryColor}-100 dark:border-${primaryColor}-800`}>
            <div className="flex items-center gap-3 mb-3">
              <Award className={`w-5 h-5 text-${primaryColor}-600 dark:text-${primaryColor}-300`} />
              <h3 className="font-medium text-gray-900 dark:text-white">
                Top Donor
              </h3>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 flex items-center justify-center bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full shadow-md">
                <span className="text-sm font-bold text-white">1</span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {donors[0].username || truncateAddress(donors[0].donor)}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-300">
                  {parseFloat(donors[0].amount).toFixed(2)} {currency} donated
                </p>
              </div>
            </div>
          </div>
        )}

        {/* User's Position (if not in top donors) */}
        {userRank !== null && userRank > donors.length && (
          <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <p className="text-sm text-center text-gray-600 dark:text-gray-300">
              Your rank: #{userRank} with {donors[userRank - 1]?.amount || "0"}{" "}
              {currency} donated
            </p>
          </div>
        )}
      </motion.div>
    </>
  );
}