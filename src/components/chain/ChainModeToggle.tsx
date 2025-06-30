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
    <button
      onClick={handleToggle}
      className={cn(
        "relative flex items-center w-32 h-8 rounded-full p-1 transition-colors duration-300",
        "focus:outline-none focus:ring-2 focus:ring-opacity-50",
        mode === "celo" 
          ? "bg-yellow-500 focus:ring-green-200" 
          : "bg-purple-600 focus:ring-purple-100"
      )}
    >
      <motion.div
        layout
        transition={{ type: "spring", stiffness: 600, damping: 30 }}
        className="absolute flex items-center justify-center w-1/2 h-full rounded-full bg-green-400 shadow-sm"
      />
      <div className="flex justify-around w-full z-10">
        <span className={cn(
          "text-xs font-medium px-3",
          mode === "celo" ? "text-white" : "text-white"
        )}>
          Celo
        </span>
        <span className={cn(
          "text-xs font-medium px-3",
          mode === "degen" ? "text-white" : "text-gray-100"
        )}>
          Degen
        </span>
      </div>
    </button>
  );
}