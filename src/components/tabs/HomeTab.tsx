import { motion, Variants } from "framer-motion";
import {
  Info,
  Gift,
  HandCoins,
  Clock,
  TrendingUp,
  ShieldCheck,
  Droplet,
} from "lucide-react";
import { Button } from "~/components/ui/Button";
import { formatDistanceToNow } from "date-fns";
import { useChainMode } from "~/app/chain-mode/context";

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
  visible: (custom: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: custom * 0.1,
      type: "spring",
      stiffness: 300,
      damping: 24,
    },
  }),
};

const pulseVariants = {
  pulse: {
    scale: [1, 1.03, 1],
    opacity: [1, 0.9, 1],
    transition: {
      duration: 2,
      repeat: Infinity,
      repeatType: "reverse",
    },
  },
};

export default function HomeTab({
  vaultBalance,
  vaultStatus,
  isLoading,
  onNavigate,
  maxClaim: initialMaxClaim = "0.5",
  claimCooldown = 86400,
  lastClaimAt = 0,
  isCorrectChain,
}: HomeTabProps) {
  const { mode } = useChainMode();
  const maxClaim = mode === "degen" ? "100" : initialMaxClaim;
  const currency = mode === "degen" ? "DEGEN" : "CELO";

  const canClaim = () => {
    if (!lastClaimAt) return true;
    const now = Math.floor(Date.now() / 1000);
    return now >= lastClaimAt + claimCooldown;
  };

  const nextClaimTime = lastClaimAt
    ? new Date((lastClaimAt + claimCooldown) * 1000)
    : null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.7 }}
      className="space-y-6"
    >
      {/* Vault Balance Card - Enhanced with new theme system */}
      <motion.div
        custom={0}
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        whileHover={{ scale: 1.01 }}
        className="relative overflow-hidden glass-card-lg p-8 modern-card hover-lift floating-element"
        style={{
          background: `var(--surface-primary)`,
          border: `1px solid var(--glass-border)`,
        }}
      >
        {/* Enhanced Background decoration elements */}
        <motion.div
          className="absolute top-0 right-0 w-40 h-40 rounded-full opacity-20"
          style={{ background: `var(--gradient-secondary)` }}
          animate={{
            scale: [1, 1.2, 1],
            x: [0, 15, 0],
            opacity: [0.1, 0.2, 0.1],
          }}
          transition={{ duration: 8, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-0 left-0 w-24 h-24 rounded-full opacity-15"
          style={{ background: `var(--gradient-primary)` }}
          animate={{
            scale: [1, 1.4, 1],
            y: [0, -8, 0],
            opacity: [0.1, 0.15, 0.1],
          }}
          transition={{ duration: 7, repeat: Infinity, delay: 1 }}
        />

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <motion.div
              whileHover={{ rotate: 10 }}
              className="p-2 rounded-xl"
              style={{ background: `var(--surface-secondary)` }}
            >
              <Droplet className="w-5 h-5" style={{ color: `var(--primary)` }} />
            </motion.div>
            <p className="text-sm font-bold text-glass-readable">
              💰 Vault Balance
            </p>
          </div>
          <motion.div
            className="flex items-center px-3 py-2 rounded-full glass-card"
            whileHover={{ scale: 1.05 }}
            style={{ background: `var(--surface-secondary)` }}
          >
            <ShieldCheck className="w-4 h-4 mr-2" style={{ color: `var(--success)` }} />
            <span className="text-xs font-bold text-shadow-sm" style={{ color: `var(--success)` }}>
              🔒 Secured
            </span>
          </motion.div>
        </div>

        {isLoading ? (
          <div className="h-16 flex items-center justify-center">
            <div 
              className="w-10 h-10 border-3 border-t-transparent rounded-full animate-spin"
              style={{ borderColor: `var(--primary)` }}
            />
          </div>
        ) : (
          <motion.div
            key={vaultBalance}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 15 }}
            className="flex items-center justify-center my-6"
          >
            <motion.div
              variants={pulseVariants as Variants}
              animate="pulse"
              className="relative flex items-baseline"
            >
              <span 
                className="text-5xl font-black gradient-text text-shadow-lg"
                style={{ background: `var(--gradient-primary)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
              >
                {parseFloat(vaultBalance).toFixed(2)}
              </span>
              <span className="ml-3 text-xl font-bold text-high-contrast">
                {currency}
              </span>
            </motion.div>
          </motion.div>
        )}

        <div className="mt-6 flex justify-between items-center p-4 glass-card rounded-xl">
          <div>
            <p className="label-enhanced">
              💵 Available for Claims
            </p>
            <motion.p
              className="text-sm font-bold mt-1 text-shadow-sm"
              style={{ color: `var(--primary)` }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              {parseFloat(vaultStatus.availableForClaims).toFixed(2)} {currency}
            </motion.p>
          </div>
          <motion.div
            whileHover={{ rotate: 15, scale: 1.1 }}
            className="flex items-center gap-2 px-3 py-2 rounded-lg"
            style={{ background: `var(--surface-secondary)` }}
          >
            <TrendingUp className="w-4 h-4" style={{ color: `var(--success)` }} />
            <span className="text-sm font-bold text-shadow-sm" style={{ color: `var(--success)` }}>
              📈 +2.5%
            </span>
          </motion.div>
        </div>
      </motion.div>

      {/* Quick Actions - Enhanced with modern Web3 design */}
      <div className="grid grid-cols-2 gap-5">
        <motion.div
          custom={1}
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.98 }}
          className="floating-element"
        >
          <Button
            onClick={() => onNavigate?.("transact")}
            className="flex flex-col items-center justify-center p-6 h-full w-full glass-card-lg modern-card hover-lift"
            style={{
              background: `var(--surface-secondary)`,
              border: `1px solid var(--glass-border)`,
            }}
            disabled={!isCorrectChain}
            aria-label="Donate to the vault"
          >
            <motion.div
              whileHover={{
                rotate: [0, -10, 10, -10, 0],
                scale: [1, 1.1, 1],
                transition: { duration: 0.6 },
              }}
              className="mb-4 p-4 rounded-2xl glass-card"
              style={{ 
                background: `var(--gradient-primary)`,
                boxShadow: `var(--glow-primary)`,
              }}
            >
              <Gift className="w-7 h-7 text-white" />
            </motion.div>
            <span className="font-black text-glass-readable text-base mb-1">
              🎁 Donate
            </span>
            <span className="label-enhanced">
              Support Ecosystem
            </span>
          </Button>
        </motion.div>

        <motion.div
          custom={2}
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.98 }}
          className="floating-element"
        >
          <Button
            onClick={() => onNavigate?.("transact")}
            disabled={!canClaim() || !isCorrectChain}
            className="flex flex-col items-center justify-center p-6 h-full w-full glass-card-lg modern-card hover-lift"
            style={{
              background: canClaim() ? `var(--surface-secondary)` : `var(--surface)`,
              border: `1px solid ${canClaim() ? `var(--glass-border)` : `var(--border)`}`,
              opacity: canClaim() ? 1 : 0.6,
            }}
            aria-label={`Claim ${maxClaim} ${currency}`}
          >
            <motion.div
              whileHover={
                canClaim()
                  ? {
                      y: [0, -8, 0],
                      scale: [1, 1.1, 1],
                      transition: { duration: 0.6 },
                    }
                  : {}
              }
              className="mb-4 p-4 rounded-2xl glass-card"
              style={{
                background: canClaim() ? `var(--gradient-secondary)` : `var(--surface)`,
                boxShadow: canClaim() ? `var(--glow-secondary)` : 'none',
              }}
            >
              <HandCoins
                className="w-7 h-7"
                style={{
                  color: canClaim() ? 'white' : `var(--foreground-muted)`,
                }}
              />
            </motion.div>
            <span
              className="font-black text-base mb-1 text-shadow"
              style={{
                color: canClaim() ? `var(--foreground)` : `var(--foreground-subtle)`,
              }}
            >
              💰 Claim {maxClaim} {currency}
            </span>

            {!canClaim() && nextClaimTime ? (
              <div className="text-xs text-medium-contrast mt-1 flex items-center">
                <Clock className="w-3 h-3 mr-1" />
                <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  ⏰ {formatDistanceToNow(nextClaimTime, { addSuffix: true })}
                </motion.span>
              </div>
            ) : (
              <span className="label-enhanced">
                ✅ Available Now
              </span>
            )}
          </Button>
        </motion.div>
      </div>

      {/* About Card - Enhanced with modern Web3 design */}
      <motion.div
        custom={3}
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        whileHover={{ scale: 1.01 }}
        className="relative overflow-hidden glass-card-lg p-6 modern-card hover-lift floating-element"
        style={{
          background: `var(--surface)`,
          border: `1px solid var(--glass-border)`,
        }}
      >
        {/* Enhanced background decoration */}
        <motion.div
          className="absolute -bottom-8 -right-8 w-36 h-36 rounded-full opacity-10"
          style={{ background: `var(--gradient-accent)` }}
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 15, 0],
          }}
          transition={{ duration: 12, repeat: Infinity }}
        />

        <div className="flex items-center gap-4 mb-5">
          <motion.div
            whileHover={{ rotate: 360, scale: 1.1 }}
            transition={{ duration: 0.6 }}
            className="p-3 rounded-2xl glass-card"
            style={{
              background: `var(--gradient-primary)`,
              boxShadow: `var(--glow-primary)`,
            }}
          >
            <Info className="w-6 h-6 text-white" />
          </motion.div>
          <h2 
            className="text-xl font-black gradient-text text-shadow-lg"
            style={{ 
              background: `var(--gradient-primary)`, 
              WebkitBackgroundClip: 'text', 
              WebkitTextFillColor: 'transparent' 
            }}
          >
            ℹ️ About Bank of {mode === "degen" ? "Degen" : "Celo"}
          </h2>
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="relative z-10 text-sm leading-relaxed text-glass-readable"
        >
          🚀 Support the {mode === "degen" ? "Degen" : "Celo"} ecosystem by donating {currency} or claim {maxClaim} {currency}{" "}
          to explore the blockchain. 🔄 Swap tokens to {mode === "degen" ? "Degen" : "Celo"} using our bridge and
          🏆 track top contributors on the leaderboard!
        </motion.p>

        {/* Additional modern elements */}
        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-glass-border">
          <motion.div
            className="flex items-center gap-2 px-3 py-2 rounded-lg glass-card"
            whileHover={{ scale: 1.05 }}
          >
            <div 
              className="w-2 h-2 rounded-full"
              style={{ background: `var(--success)` }}
            />
            <span className="text-xs font-bold text-shadow-sm text-success">
              🟢 Live Network
            </span>
          </motion.div>
          <motion.div
            className="flex items-center gap-2 px-3 py-2 rounded-lg glass-card"
            whileHover={{ scale: 1.05 }}
          >
            <div 
              className="w-2 h-2 rounded-full animate-pulse"
              style={{ background: `var(--primary)` }}
            />
            <span className="text-xs font-bold text-shadow-sm" style={{ color: `var(--primary)` }}>
              {mode === "degen" ? "🟣 Degen Mode" : "🟢 Celo Mode"}
            </span>
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
}
