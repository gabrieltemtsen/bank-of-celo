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
    <div className="flex items-center gap-2">
      {/* Toggle Switch */}
      <button
        onClick={handleToggle}
        className={cn(
          "relative inline-flex items-center rounded-full transition-all duration-300 ease-in-out shadow-lg border-2",
          mode === "celo" ? "h-7 w-14" : "h-8 w-16",
          mode === "celo"
            ? "bg-emerald-100 dark:bg-emerald-900 border-emerald-300 dark:border-emerald-700"
            : "bg-purple-100 dark:bg-purple-900 border-purple-300 dark:border-purple-700"
        )}
        role="switch"
        aria-checked={mode === "degen"}
        aria-label={`Switch to ${mode === "celo" ? "Degen" : "Celo"} mode`}
      >
        {/* Animated Toggle Ball */}
        <motion.div
          className={cn(
            "inline-block transform rounded-full shadow-lg ring-2 ring-white transition-all duration-300 ease-in-out",
            mode === "celo" ? "h-5 w-5" : "h-6 w-6",
            mode === "celo"
              ? "bg-gradient-to-r from-emerald-500 to-emerald-600"
              : "bg-gradient-to-r from-purple-500 to-purple-600"
          )}
          animate={{
            x: mode === "celo" ? 2 : 34, // Move right for degen, left for celo (approx)
          }}
          transition={{
            type: "spring",
            stiffness: 500,
            damping: 30,
          }}
        />
        
        {/* Background Icons/Labels */}
        <div className="absolute inset-0 flex items-center justify-between px-2 pointer-events-none">
          <span className={cn(
            "text-[10px] sm:text-xs font-bold transition-all duration-300",
            mode === "celo" 
              ? "text-white dark:text-white-40 opacity-100" 
              : "text-emerald-400 dark:text-emerald-600 opacity-40"
          )}>
            C
          </span>
          <span className={cn(
            "text-[10px] sm:text-xs font-bold transition-all duration-300",
            mode === "degen" 
              ? "text-white dark:text-white-40 opacity-100" 
              : "text-purple-400 dark:text-purple-600 opacity-40"
          )}>
            D
          </span>
        </div>
      </button>

      {/* Mode Label */}
      <span className={cn(
        "text-xs sm:text-sm font-semibold transition-all duration-300 capitalize",
        mode === "celo"
          ? "text-emerald-700 dark:text-emerald-300"
          : "text-purple-700 dark:text-purple-300"
      )}>
        {mode}
      </span>
    </div>
  );
}
