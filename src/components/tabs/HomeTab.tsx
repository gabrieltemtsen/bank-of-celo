import { motion } from "framer-motion";
import { Info, Gift, HandCoins, Clock } from "lucide-react";
import { Button } from "~/components/ui/Button";
import { formatDistanceToNow } from "date-fns";
import { celoImage } from "~/constants/images";

interface HomeTabProps {
  vaultBalance: string;
  vaultStatus: {
    currentBalance: string;
    minReserve: string;
    availableForClaims: string;
  };
  isLoading?: boolean;
  onNavigate?: (tab: string) => void;
  maxClaim?: string;
  claimCooldown?: number;
  lastClaimAt?: number;
  isCorrectChain: boolean;
}

export default function HomeTab({
  vaultBalance,
  vaultStatus,
  isLoading,
  onNavigate,
  maxClaim = "0.5",
  claimCooldown = 86400,
  lastClaimAt = 0,
  isCorrectChain,
}: HomeTabProps) {
  const canClaim = () => {
    if (!lastClaimAt) return true;
    const now = Math.floor(Date.now() / 1000);
    return now >= lastClaimAt + claimCooldown;
  };

  const nextClaimTime = lastClaimAt ? new Date((lastClaimAt + claimCooldown) * 1000) : null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="space-y-4"
      
    >
      {/* Vault Balance Card */}
      <div className="p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 text-center">
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Vault Balance</p>
        {isLoading ? (
          <div className="h-10 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <motion.div
            key={vaultBalance}
            initial={{ scale: 0.9, opacity: 0.5 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 300 }}
            className="flex items-center justify-center gap-1"
          >
            <span className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
              {parseFloat(vaultBalance).toFixed(2)}
            </span>
            <span className="text-lg text-gray-600 dark:text-gray-300">CELO</span>
          </motion.div>
        )}
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          Available for Claims: {parseFloat(vaultStatus.availableForClaims).toFixed(2)} CELO
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        <Button
          onClick={() => onNavigate?.("transact")}
          className="flex flex-col items-center justify-center p-4 h-full bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:hover:bg-emerald-900/50 rounded-xl border border-emerald-100 dark:border-emerald-800"
          disabled={!isCorrectChain}
          aria-label="Donate to the vault"
        >
          <Gift className="w-6 h-6 text-emerald-600 dark:text-emerald-400 mb-2" />
          <span className="font-medium text-emerald-700 dark:text-emerald-300">Donate</span>
        </Button>
        <Button
          onClick={() => onNavigate?.("transact")}
          disabled={!canClaim() || !isCorrectChain}
          className="flex flex-col items-center justify-center p-4 h-full bg-amber-50 hover:bg-amber-100 dark:bg-amber-900/30 dark:hover:bg-amber-900/50 rounded-xl border border-amber-100 dark:border-amber-800"
          aria-label={`Claim ${maxClaim} CELO`}
        >
          <HandCoins className="w-6 h-6 text-amber-600 dark:text-amber-400 mb-2" />
          <span className="font-medium text-amber-700 dark:text-amber-300">{maxClaim} CELO</span>
          {!canClaim() && nextClaimTime && (
            <span className="text-xs text-amber-600 dark:text-amber-400 mt-1 flex items-center">
              <Clock className="w-3 h-3 mr-1" />
              {formatDistanceToNow(nextClaimTime, { addSuffix: true })}
            </span>
          )}
        </Button>
      </div>

      {/* About Card */}
      <div className="p-5 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-3 mb-3">
          <div className="bg-emerald-100 dark:bg-emerald-900 p-2 rounded-lg">
            <Info className="w-5 h-5 text-emerald-600 dark:text-emerald-300" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">About Bank of Celo</h2>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Support the Celo ecosystem by donating CELO or claim {maxClaim} CELO (once per day) to explore the blockchain.
          Swap tokens to Celo using our bridge and track top contributors on the leaderboard!
        </p>
      </div>
    </motion.div>
  );
}