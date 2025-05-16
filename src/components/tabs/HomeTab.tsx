import { motion, Variants } from "framer-motion";
import { Info, Gift, HandCoins, Clock, TrendingUp, ShieldCheck, Droplet } from "lucide-react";
import { Button } from "~/components/ui/Button";
import { formatDistanceToNow } from "date-fns";

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

// Animation variants
const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (custom:  number) => ({
    opacity: 1,
    y: 0,
    transition: { 
      delay: custom * 0.1,
      type: "spring", 
      stiffness: 300, 
      damping: 24 
    }
  })
};

const pulseVariants = {
  pulse: {
    scale: [1, 1.03, 1],
    opacity: [1, 0.9, 1],
    transition: {
      duration: 2,
      repeat: Infinity,
      repeatType: "reverse"
    }
  }
};

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
      transition={{ duration: 0.7 }}
      className="space-y-5"
    >
      {/* Vault Balance Card */}
      <motion.div
        custom={0}
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        whileHover={{ scale: 1.01 }}
        className="relative overflow-hidden p-6 bg-gradient-to-br from-emerald-50 to-cyan-50 dark:from-gray-800 dark:to-gray-900 rounded-3xl shadow-lg border border-emerald-100/50 dark:border-emerald-800/30"
      >
        {/* Background decoration elements */}
        <motion.div 
          className="absolute top-0 right-0 w-32 h-32 rounded-full bg-emerald-300/10 dark:bg-emerald-700/10"
          animate={{
            scale: [1, 1.2, 1],
            x: [0, 10, 0],
            opacity: [0.3, 0.2, 0.3],
          }}
          transition={{ duration: 8, repeat: Infinity }}
        />
        <motion.div 
          className="absolute bottom-0 left-0 w-20 h-20 rounded-full bg-cyan-300/10 dark:bg-cyan-700/10"
          animate={{
            scale: [1, 1.3, 1],
            y: [0, -5, 0],
            opacity: [0.2, 0.3, 0.2],
          }}
          transition={{ duration: 7, repeat: Infinity, delay: 1 }}
        />

        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Droplet className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Vault Balance</p>
          </div>
          <motion.div 
            className="flex items-center bg-emerald-100 dark:bg-emerald-800/60 px-2 py-1 rounded-full"
            whileHover={{ scale: 1.05 }}
          >
            <ShieldCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400 mr-1" />
            <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300">Secured</span>
          </motion.div>
        </div>

        {isLoading ? (
          <div className="h-14 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <motion.div
            key={vaultBalance}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 15 }}
            className="flex items-center justify-center my-4"
          >
            <motion.div
              variants={pulseVariants as Variants}
              animate="pulse"
              className="relative flex items-baseline"
            >
              <span className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500 dark:from-emerald-400 dark:to-teal-300">
                {parseFloat(vaultBalance).toFixed(2)}
              </span>
              <span className="ml-2 text-lg font-semibold text-gray-600 dark:text-gray-300">
                CELO
              </span>
            </motion.div>
          </motion.div>
        )}

        <div className="mt-4 flex justify-between items-center px-2 py-3 bg-white/60 dark:bg-gray-800/40 rounded-xl backdrop-blur-sm">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Available for Claims</p>
            <motion.p 
              className="text-sm font-medium text-emerald-700 dark:text-emerald-300"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              {parseFloat(vaultStatus.availableForClaims).toFixed(2)} CELO
            </motion.p>
          </div>
          <motion.div 
            whileHover={{ rotate: 15 }}
            className="flex items-center gap-1"
          >
            <TrendingUp className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
            <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">+2.5%</span>
          </motion.div>
        </div>
      </motion.div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4">
        <motion.div
          custom={1}
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.98 }}
        >
          <Button
            onClick={() => onNavigate?.("transact")}
            className="flex flex-col items-center justify-center p-5 h-full w-full bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/30 dark:to-emerald-800/50 rounded-2xl border border-emerald-100 dark:border-emerald-800/50 shadow-md shadow-emerald-100/20 dark:shadow-emerald-900/20"
            disabled={!isCorrectChain}
            aria-label="Donate to the vault"
          >
            <motion.div 
              whileHover={{ 
                rotate: [0, -10, 10, -10, 0],
                transition: { duration: 0.5 }
              }}
              className="mb-3 p-3 bg-white dark:bg-gray-800 rounded-full shadow-md"
            >
              <Gift className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </motion.div>
            <span className="font-medium text-emerald-800 dark:text-emerald-200">Donate</span>
            <span className="text-xs text-emerald-600/70 dark:text-emerald-400/70 mt-1">Support Ecosystem</span>
          </Button>
        </motion.div>

        <motion.div
          custom={2}
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.98 }}
        >
          <Button
            onClick={() => onNavigate?.("transact")}
            disabled={!canClaim() || !isCorrectChain}
            className={`flex flex-col items-center justify-center p-5 h-full w-full bg-gradient-to-br ${
              canClaim() 
                ? "from-amber-50 to-orange-50 dark:from-amber-900/30 dark:to-amber-800/50 shadow-md shadow-amber-100/20 dark:shadow-amber-900/20" 
                : "from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-700/50"
            } rounded-2xl border ${
              canClaim() 
                ? "border-amber-100 dark:border-amber-800/50" 
                : "border-gray-200 dark:border-gray-700/50"
            }`}
            aria-label={`Claim ${maxClaim} CELO`}
          >
            <motion.div 
              whileHover={canClaim() ? { 
                y: [0, -5, 0],
                transition: { duration: 0.5 }
              } : {}}
              className={`mb-3 p-3 bg-white dark:bg-gray-800 rounded-full shadow-md ${
                !canClaim() && "opacity-60"
              }`}
            >
              <HandCoins className={`w-6 h-6 ${
                canClaim() ? "text-amber-600 dark:text-amber-400" : "text-gray-400 dark:text-gray-500"
              }`} />
            </motion.div>
            <span className={`font-medium ${
              canClaim() ? "text-amber-800 dark:text-amber-200" : "text-gray-500 dark:text-gray-400"
            }`}>
              Claim {maxClaim} CELO
            </span>
            
            {!canClaim() && nextClaimTime && (
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center">
                <Clock className="w-3 h-3 mr-1" />
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  {formatDistanceToNow(nextClaimTime, { addSuffix: true })}
                </motion.span>
              </div>
            )}
          </Button>
        </motion.div>
      </div>

      {/* About Card */}
      <motion.div
        custom={3}
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        whileHover={{ scale: 1.01 }}
        className="relative overflow-hidden p-5 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-3xl shadow-lg border border-gray-100 dark:border-gray-700/50"
      >
        {/* Background decoration */}
        <motion.div 
          className="absolute -bottom-6 -right-6 w-32 h-32 rounded-full bg-emerald-100/30 dark:bg-emerald-900/20"
          animate={{
            scale: [1, 1.1, 1],
            rotate: [0, 10, 0],
          }}
          transition={{ duration: 10, repeat: Infinity }}
        />

        <div className="flex items-center gap-3 mb-4">
          <motion.div 
            whileHover={{ rotate: 360 }}
            transition={{ duration: 0.5 }}
            className="bg-gradient-to-br from-emerald-400 to-teal-500 dark:from-emerald-500 dark:to-teal-600 p-2.5 rounded-xl shadow-md"
          >
            <Info className="w-5 h-5 text-white" />
          </motion.div>
          <h2 className="text-lg font-semibold text-transparent bg-clip-text bg-gradient-to-r from-emerald-700 to-teal-600 dark:from-emerald-300 dark:to-teal-200">
            About Bank of Celo
          </h2>
        </div>

        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="relative z-10 text-sm leading-relaxed text-gray-600 dark:text-gray-300"
        >
          Support the Celo ecosystem by donating CELO or claim {maxClaim} CELO (once per day) 
          to explore the blockchain. Swap tokens to Celo using our bridge and track top 
          contributors on the leaderboard!
        </motion.p>
      </motion.div>
    </motion.div>
  )}