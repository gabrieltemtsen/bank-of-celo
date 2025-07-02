"use client";
import { useSwitchChain, useChainId } from "wagmi";
import { base, celo } from "wagmi/chains";
import { useChainMode } from "~/app/chain-mode/context";
import { motion } from "framer-motion";
import { cn } from "~/lib/utils";

export default function ChainModeToggle() {
  const { mode, toggleMode } = useChainMode();
  const { switchChain } = useSwitchChain();
  const chainId = useChainId();

  const handleToggle = () => {
    const next = mode === "celo" ? "degen" : "celo";
    toggleMode();
    const target = next === "degen" ? base : celo;
    if (chainId !== target.id) {
      try {
        switchChain({ chainId: target.id });
      } catch (err) {
        console.error("Failed to switch chain", err);
      }
    }
  };

  return (
    <motion.button
      onClick={handleToggle}
      className="relative flex items-center w-36 h-10 rounded-2xl p-1 glass-card"
      style={{
        background: `var(--surface-secondary)`,
        border: `1px solid var(--glass-border)`,
        boxShadow: `var(--shadow)`,
      }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      transition={{ duration: 0.2 }}
    >
      <motion.div
        layout
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        className="absolute flex items-center justify-center w-1/2 h-full rounded-xl shadow-lg z-0"
        style={{
          background: mode === "celo" ? `var(--gradient-primary)` : `var(--gradient-secondary)`,
          boxShadow: mode === "celo" ? `var(--glow-primary)` : `var(--glow-secondary)`,
          left: mode === "celo" ? "4px" : "calc(50% - 4px)",
        }}
      />
      
      <div className="flex justify-between w-full z-10 relative px-2">
        <motion.span
          className="text-sm font-black px-3 py-1 rounded-lg transition-colors duration-200"
          style={{
            color: mode === "celo" ? "white" : `var(--foreground)`,
            textShadow: mode === "celo" ? "0 2px 4px rgba(0,0,0,0.6)" : "0 1px 2px rgba(0,0,0,0.4)",
          }}
          animate={{
            scale: mode === "celo" ? 1.05 : 1,
          }}
          transition={{ duration: 0.2 }}
        >
          🟢 Celo
        </motion.span>
        
        <motion.span
          className="text-sm font-black px-3 py-1 rounded-lg transition-colors duration-200"
          style={{
            color: mode === "degen" ? "white" : `var(--foreground)`,
            textShadow: mode === "degen" ? "0 2px 4px rgba(0,0,0,0.6)" : "0 1px 2px rgba(0,0,0,0.4)",
          }}
          animate={{
            scale: mode === "degen" ? 1.05 : 1,
          }}
          transition={{ duration: 0.2 }}
        >
          🟣 Degen
        </motion.span>
      </div>
      
      {/* Subtle glow effect */}
      <motion.div
        className="absolute inset-0 rounded-2xl opacity-20"
        style={{
          background: mode === "celo" ? `var(--gradient-primary)` : `var(--gradient-secondary)`,
        }}
        animate={{
          opacity: [0.1, 0.3, 0.1],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </motion.button>
  );
}