/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { usePublicClient, useAccount } from "wagmi";
import { formatEther } from "viem";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Loader2, Award, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "~/components/ui/Button";
import { truncateAddress } from "~/lib/truncateAddress";
import { toast } from "sonner";
import {
  BANK_OF_CELO_CONTRACT_ABI,
  BANK_OF_CELO_CONTRACT_ADDRESS,
} from "~/lib/constants";
import { celo } from "viem/chains";
import { fetchUsersByAddress } from "~/lib/neynar";
import { useChainMode } from "~/app/chain-mode/context";

interface Donor {
  donor: string;
  amount: string;
  tier?: number;
}

interface LeaderboardTabProps {
  isCorrectChain?: boolean;
}

export default function LeaderboardTab({
  isCorrectChain = true,
}: LeaderboardTabProps) {
  const publicClient = usePublicClient();
  const { address } = useAccount();
  const [donors, setDonors] = useState<Donor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedDonor, setExpandedDonor] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const { mode } = useChainMode();
  const currency = mode === "degen" ? "DEGEN" : "CELO";

  useEffect(() => {
    async function fetchUsername() {
      try {
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
  const getUsername = async (donorAddress: string) => {
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
        address: BANK_OF_CELO_CONTRACT_ADDRESS as `0x${string}`,
        abi: BANK_OF_CELO_CONTRACT_ABI,
        functionName: "getLeaderboard",
      })) as any[];

      // Format donor data
      const formattedDonors = leaderboard
        .filter(
          (entry) =>
            entry.donor !== "0x0000000000000000000000000000000000000000",
        )
        .map((entry, index) => ({
          donor: entry.donor,
          amount: formatEther(entry.amount),
          rank: index + 1,
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
      transition={{ duration: 0.7 }}
      className="space-y-8"
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card-lg modern-card hover-lift p-8"
        style={{
          background: `var(--surface)`,
          border: `1px solid var(--glass-border)`,
        }}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <motion.div
              whileHover={{ rotate: 15, scale: 1.1 }}
              className="p-3 rounded-2xl"
              style={{ 
                background: `var(--gradient-primary)`,
                boxShadow: `var(--glow-primary)`,
              }}
            >
              <Trophy className="w-6 h-6 text-white" />
            </motion.div>
            <h2 
              className="text-2xl font-bold gradient-text"
              style={{ 
                background: `var(--gradient-primary)`, 
                WebkitBackgroundClip: 'text', 
                WebkitTextFillColor: 'transparent' 
              }}
            >
              Top Donors
            </h2>
          </div>
          
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              onClick={fetchLeaderboard}
              disabled={isLoading || !isCorrectChain}
              variant="glass"
              className="text-sm font-semibold px-4 py-2 rounded-xl"
              style={{
                background: `var(--surface-secondary)`,
                border: `1px solid var(--glass-border)`,
                color: `var(--foreground)`,
              }}
            >
              {isLoading ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <Loader2 className="w-4 h-4" />
                </motion.div>
              ) : (
                "Refresh"
              )}
            </Button>
          </motion.div>
        </div>

        {!isCorrectChain ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-6 text-center glass-card rounded-xl"
            style={{
              background: `rgba(245, 158, 11, 0.1)`,
              border: `1px solid rgba(245, 158, 11, 0.3)`,
            }}
          >
            <motion.div
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="mb-3 mx-auto w-fit"
            >
              <Trophy 
                className="w-8 h-8" 
                style={{ color: `var(--warning)` }}
              />
            </motion.div>
            <p 
              className="text-lg font-semibold"
              style={{ color: `var(--warning)` }}
            >
              Please connect to {mode === "degen" ? "Base" : "Celo"} network to view leaderboard
            </p>
          </motion.div>
        ) : isLoading ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-12"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="mb-4"
            >
              <Loader2 
                className="w-12 h-12"
                style={{ color: `var(--primary)` }}
              />
            </motion.div>
            <p 
              className="text-lg font-semibold"
              style={{ color: `var(--foreground-secondary)` }}
            >
              Loading leaderboard...
            </p>
          </motion.div>
        ) : donors.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-8 text-center glass-card rounded-xl"
            style={{
              background: `var(--surface-secondary)`,
              border: `1px solid var(--border)`,
            }}
          >
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="mb-4 mx-auto w-fit p-4 rounded-full"
              style={{ background: `var(--gradient-primary)` }}
            >
              <Trophy className="w-8 h-8 text-white" />
            </motion.div>
            <p 
              className="text-lg font-semibold"
              style={{ color: `var(--foreground-secondary)` }}
            >
              No donations yet. Be the first to contribute!
            </p>
          </motion.div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {donors.map((donor, index) => (
                <motion.div
                  key={`${donor}-${index}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ delay: index * 0.05 }}
                  className="glass-card modern-card hover-lift overflow-hidden"
                  style={{
                    background: expandedDonor === donor.donor 
                      ? `var(--surface-primary)` 
                      : `var(--surface-secondary)`,
                    border: donor.donor === address 
                      ? `2px solid var(--primary)` 
                      : `1px solid var(--glass-border)`,
                    boxShadow: donor.donor === address 
                      ? `var(--glow-primary)` 
                      : expandedDonor === donor.donor 
                        ? `var(--shadow-lg)` 
                        : `var(--shadow)`,
                  }}
                >
                  <motion.button
                    onClick={() =>
                      setExpandedDonor(
                        expandedDonor === donor.donor ? null : donor.donor,
                      )
                    }
                    className="w-full flex items-center p-4"
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                  >
                    <div className="flex items-center w-full">
                      <motion.div
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        className="w-12 h-12 flex items-center justify-center rounded-2xl mr-4"
                        style={{
                          background: index < 3
                            ? `var(--gradient-secondary)`
                            : `var(--gradient-primary)`,
                          boxShadow: index < 3 
                            ? `var(--glow-secondary)` 
                            : `var(--glow-primary)`,
                        }}
                      >
                        <span className="text-base font-bold text-white">
                          {index + 1}
                        </span>
                      </motion.div>
                      
                      <div className="text-left flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p 
                            className="text-base font-semibold"
                            style={{ color: `var(--foreground)` }}
                          >
                            {truncateAddress(donor.donor)}
                          </p>
                          {donor.donor === address && (
                            <motion.span
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="text-xs font-bold px-3 py-1 rounded-full"
                              style={{
                                background: `var(--gradient-primary)`,
                                color: 'white',
                              }}
                            >
                              You
                            </motion.span>
                          )}
                        </div>
                        <p 
                          className="text-sm font-medium"
                          style={{ color: `var(--foreground-secondary)` }}
                        >
                          {parseFloat(donor.amount).toFixed(2)} {currency}
                        </p>
                      </div>
                      
                      <motion.div
                        animate={{ rotate: expandedDonor === donor.donor ? 180 : 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <ChevronDown 
                          className="w-5 h-5" 
                          style={{ color: `var(--foreground-muted)` }}
                        />
                      </motion.div>
                    </div>
                  </motion.button>

                  {expandedDonor === donor.donor && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      className="px-4 pb-4"
                    >
                      <div 
                        className="pt-4 space-y-3"
                        style={{ borderTop: `1px solid var(--glass-border)` }}
                      >
                        <div className="flex justify-between items-center">
                          <span 
                            className="text-sm font-medium"
                            style={{ color: `var(--foreground-muted)` }}
                          >
                            Total Donations:
                          </span>
                          <span 
                            className="text-sm font-bold"
                            style={{ color: `var(--primary)` }}
                          >
                            {parseFloat(donor.amount).toFixed(2)} {currency}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span 
                            className="text-sm font-medium"
                            style={{ color: `var(--foreground-muted)` }}
                          >
                            Address:
                          </span>
                          <span 
                            className="text-sm font-mono font-medium"
                            style={{ color: `var(--foreground-secondary)` }}
                          >
                            {donor.donor}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span 
                            className="text-sm font-medium"
                            style={{ color: `var(--foreground-muted)` }}
                          >
                            Rank:
                          </span>
                          <motion.span 
                            className="text-sm font-bold px-3 py-1 rounded-full"
                            style={{ 
                              background: `var(--gradient-primary)`,
                              color: 'white',
                            }}
                            whileHover={{ scale: 1.05 }}
                          >
                            #{index + 1}
                          </motion.span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </motion.div>

      {/* Enhanced Top Donor Highlight */}
      {donors.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card-lg modern-card hover-lift p-8"
          style={{
            background: `var(--surface-primary)`,
            border: `1px solid var(--glass-border)`,
          }}
        >
          <div className="flex items-center gap-4 mb-6">
            <motion.div
              whileHover={{ rotate: 360, scale: 1.1 }}
              transition={{ duration: 0.6 }}
              className="p-3 rounded-2xl"
              style={{ 
                background: `var(--gradient-secondary)`,
                boxShadow: `var(--glow-secondary)`,
              }}
            >
              <Award className="w-6 h-6 text-white" />
            </motion.div>
            <h3 
              className="text-xl font-bold gradient-text"
              style={{ 
                background: `var(--gradient-secondary)`, 
                WebkitBackgroundClip: 'text', 
                WebkitTextFillColor: 'transparent' 
              }}
            >
              Top Donor
            </h3>
          </div>
          
          <div className="flex items-center gap-4">
            <motion.div
              whileHover={{ scale: 1.1, rotate: 5 }}
              className="w-16 h-16 flex items-center justify-center rounded-2xl"
              style={{ 
                background: `var(--gradient-secondary)`,
                boxShadow: `var(--glow-secondary)`,
              }}
            >
              <span className="text-xl font-bold text-white">1</span>
            </motion.div>
            <div className="flex-1">
              <p 
                className="text-lg font-bold mb-1"
                style={{ color: `var(--foreground)` }}
              >
                {truncateAddress(donors[0].donor)}
              </p>
              <p 
                className="text-base font-semibold"
                style={{ color: `var(--foreground-secondary)` }}
              >
                {parseFloat(donors[0].amount).toFixed(2)} {currency} donated
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Enhanced User's Position */}
      {userRank !== null && userRank > donors.length && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-card modern-card p-6 text-center"
          style={{
            background: `var(--surface-secondary)`,
            border: `1px solid var(--glass-border)`,
          }}
        >
          <p 
            className="text-base font-semibold"
            style={{ color: `var(--foreground-secondary)` }}
          >
            Your rank: <span style={{ color: `var(--primary)` }}>#{userRank}</span> with{" "}
            <span style={{ color: `var(--primary)` }}>
              {donors[userRank - 1]?.amount || "0"} {currency}
            </span>{" "}
            donated
          </p>
        </motion.div>
      )}
    </motion.div>
  );
}
