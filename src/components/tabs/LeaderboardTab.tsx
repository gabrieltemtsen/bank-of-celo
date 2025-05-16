/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { usePublicClient, useAccount } from "wagmi";
import { formatEther } from "viem";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Loader2, Award, ChevronDown, ChevronUp, RefreshCcw } from "lucide-react";
import { Button } from "~/components/ui/Button";
import { truncateAddress } from "~/lib/truncateAddress";
import { toast } from "sonner";
import { BANK_OF_CELO_CONTRACT_ABI, BANK_OF_CELO_CONTRACT_ADDRESS } from "~/lib/constants";
import { celo } from "viem/chains";

interface Donor {
  donor: string;
  amount: string;
  tier?: number;
}

interface LeaderboardTabProps {
  isCorrectChain?: boolean;
}

export default function LeaderboardTab({ isCorrectChain = true }: LeaderboardTabProps) {
  const publicClient = usePublicClient();
  const { address } = useAccount();
  const [donors, setDonors] = useState<Donor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedDonor, setExpandedDonor] = useState<string | null>(null);

  const fetchLeaderboard = async () => {
    setIsLoading(true);
    try {
      if (!publicClient || !isCorrectChain) {
        toast.error("Please connect to Celo network");
        setIsLoading(false);
        return;
      }

      // Get top donors from contract
      const leaderboard = await publicClient.readContract({
        address: BANK_OF_CELO_CONTRACT_ADDRESS as `0x${string}`,
        abi: BANK_OF_CELO_CONTRACT_ABI,
        functionName: "getLeaderboard",
      }) as any[];

      // Format donor data
      const formattedDonors = leaderboard
        .filter(entry => entry.donor !== "0x0000000000000000000000000000000000000000")
        .map((entry, index) => ({
          donor: entry.donor,
          amount: formatEther(entry.amount),
          rank: index + 1
        }));

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
    return donors.findIndex(donor => donor.donor.toLowerCase() === address.toLowerCase()) + 1;
  };

  const userRank = getUserRank();

  useEffect(() => {
    fetchLeaderboard();
    
    // Watch for new donations
    const unwatch = publicClient?.watchContractEvent({
      address: BANK_OF_CELO_CONTRACT_ADDRESS as `0x${string}`,
      abi: BANK_OF_CELO_CONTRACT_ABI,
      eventName: "Donated",
      onLogs: () => fetchLeaderboard(),
    });

    return () => unwatch?.();
  }, [publicClient, isCorrectChain]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <div className="p-5 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-3">
            <div className="bg-purple-100 dark:bg-purple-900 p-2 rounded-lg">
              <Trophy className="w-5 h-5 text-purple-600 dark:text-purple-300" />
            </div>
            <span className="text-gray-900 dark:text-white">Top Donors</span>
          </h2>
          <button
            onClick={fetchLeaderboard}
            disabled={isLoading || !isCorrectChain}
            className="text-xs text-center flex items-center justify-center w-10 h-10 !p-10 font-medium bg-gradient-to-br from-emerald-400 to-emerald-600 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-full  py-1.5"
          >
            {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCcw />}
          </button>
        </div>

        {!isCorrectChain ? (
          <div className="p-4 text-center bg-yellow-50 dark:bg-yellow-900/30 rounded-lg">
            <p className="text-yellow-600 dark:text-yellow-300">
              Please connect to Celo network to view leaderboard
            </p>
          </div>
        ) : isLoading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
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
                  key={`${donor}-${index}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ delay: index * 0.05 }}
                  className={`overflow-hidden rounded-lg ${
                    expandedDonor === donor.donor 
                      ? "bg-purple-50 dark:bg-purple-900/30 border border-purple-100 dark:border-purple-800"
                      : "bg-gray-50 dark:bg-gray-700"
                  } ${donor.donor === address ? 'ring-2 ring-purple-500' : ''}`}
                >
                  <button
                    onClick={() => setExpandedDonor(expandedDonor === donor.donor ? null : donor.donor)}
                    className="w-full flex items-center p-3"
                  >
                    <div className="flex items-center w-full">
                      <div className={`w-8 h-8 flex items-center justify-center rounded-full mr-3 ${
                        index < 3 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600' : 'bg-purple-100 dark:bg-purple-900'
                      }`}>
                        <span className={`text-sm font-bold ${
                          index < 3 ? 'text-white' : 'text-purple-600 dark:text-purple-300'
                        }`}>
                          {index + 1}
                        </span>
                      </div>
                      <div className="text-left flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {truncateAddress(donor.donor)}
                          {donor.donor === address && (
                            <span className="ml-2 text-xs bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-300 px-2 py-0.5 rounded-full">
                              You
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {parseFloat(donor.amount).toFixed(2)} CELO
                        </p>
                      </div>
                      {expandedDonor === donor.donor ? (
                        <ChevronUp className="w-4 h-4 text-gray-500" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-gray-500" />
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
                      <div className="pt-2 border-t border-purple-100 dark:border-purple-800">
                        <div className="flex justify-between text-xs text-gray-600 dark:text-gray-300">
                          <span>Total Donations:</span>
                          <span className="font-medium">
                            {parseFloat(donor.amount).toFixed(2)} CELO
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
        <div className="p-5 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/30 dark:to-blue-900/30 rounded-2xl border border-purple-100 dark:border-purple-800">
          <div className="flex items-center gap-3 mb-3">
            <Award className="w-5 h-5 text-purple-600 dark:text-purple-300" />
            <h3 className="font-medium text-gray-900 dark:text-white">Top Donor</h3>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 flex items-center justify-center bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full">
              <span className="text-sm font-bold text-white">1</span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {truncateAddress(donors[0].donor)}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-300">
                {parseFloat(donors[0].amount).toFixed(2)} CELO donated
              </p>
            </div>
          </div>
        </div>
      )}

      {/* User's Position (if not in top donors) */}
      {userRank !== null && userRank > donors.length && (
        <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <p className="text-sm text-center text-gray-600 dark:text-gray-300">
            Your rank: #{userRank} with {donors[userRank - 1]?.amount || '0'} CELO donated
          </p>
        </div>
      )}
    </motion.div>
  );
}