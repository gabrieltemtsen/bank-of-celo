"use client";
import React from "react";
import { motion } from "framer-motion";
import { useChainMode } from "~/app/chain-mode/context";
import { cn } from "~/lib/utils";
import { useChainId, useSwitchChain } from "wagmi";
import { base, celo } from "viem/chains";

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
    <div className="flex items-center gap-3">
      <button
        onClick={handleToggle}
        className={cn(
          "relative inline-flex h-9 w-20 items-center rounded-full transition-all duration-300 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
          mode === "celo"
            ? "bg-gray-200 hover:bg-gray-300 border border-gray-300"
            : "bg-purple-900/50 border border-purple-500/50 shadow-[0_0_15px_rgba(168,85,247,0.3)]"
        )}
        role="switch"
        aria-checked={mode === "degen"}
        aria-label={`Switch to ${mode === "celo" ? "Degen" : "Celo"} mode`}
      >
        <span className="sr-only">Toggle Chain Mode</span>

        {/* Track Labels */}
        <div className="absolute inset-0 flex items-center justify-between px-3 pointer-events-none">
          <span className={cn(
            "text-[10px] font-bold uppercase tracking-wider transition-all duration-300",
            mode === "celo" ? "opacity-100 text-gray-500" : "opacity-40 text-purple-300"
          )}>
            Celo
          </span>
          <span className={cn(
            "text-[10px] font-bold uppercase tracking-wider transition-all duration-300",
            mode === "degen" ? "opacity-100 text-white" : "opacity-40 text-gray-500"
          )}>
            Degen
          </span>
        </div>

        {/* Thumb */}
        <motion.div
          className={cn(
            "h-7 w-7 rounded-full shadow-sm pointer-events-none z-10 flex items-center justify-center",
            mode === "celo"
              ? "bg-white border border-gray-200"
              : "bg-gradient-to-r from-purple-500 to-fuchsia-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]"
          )}
          animate={{
            x: mode === "celo" ? 4 : 48,
          }}
          transition={{
            type: "spring",
            stiffness: 400,
            damping: 25,
          }}
        >
          {/* Optional Icon inside thumb */}
          <div className={cn(
            "w-2 h-2 rounded-full",
            mode === "celo" ? "bg-yellow-400" : "bg-white"
          )} />
        </motion.div>
      </button>

    </div>
  );
}
