import { useState } from "react";
import { motion } from "framer-motion";
import { Zap, Ticket, Star } from "lucide-react";
import { useChainMode } from "~/app/chain-mode/context";
import JackPot from "./JackPot";
import JackPotV2 from "./JackPotV2";

interface JackpotsTabProps {
  isCorrectChain: boolean;
}

export default function JackpotsTab({ isCorrectChain }: JackpotsTabProps) {
  const [activeJackpot, setActiveJackpot] = useState<"v1" | "v2">("v2");
  const { mode } = useChainMode();
  const isDegen = mode === "degen";

  const activeButtonClasses = isDegen
    ? "text-white bg-gradient-to-r from-purple-500 to-purple-600 shadow-md"
    : "text-white bg-gradient-to-r from-emerald-500 to-emerald-600 shadow-md";

  const inactiveButtonClasses = isDegen
    ? "text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400"
    : "text-gray-600 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400";

  const indicatorClasses = isDegen ? "bg-purple-300" : "bg-emerald-300";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6 w-full p-4"
    >
      <div className="text-center space-y-2">
        <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${isDegen ? 'bg-purple-100 dark:bg-purple-900/30' : 'bg-emerald-100 dark:bg-emerald-900/30'}`}>
          <Zap className={`w-8 h-8 ${isDegen ? 'text-purple-600 dark:text-purple-400' : 'text-emerald-600 dark:text-emerald-400'}`} />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Jackpots
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Try your luck and win big prizes!
        </p>
      </div>

      <div className="flex flex-col gap-4 w-full">
        <div className="flex bg-white/95 dark:bg-gray-900/95 backdrop-blur-lg rounded-xl p-1 gap-1 w-full border border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveJackpot("v2")}
            className={`relative flex-1 py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
              activeJackpot === "v2" ? activeButtonClasses : inactiveButtonClasses
            }`}
            aria-label="Jackpot V2 tab"
            role="tab"
            aria-selected={activeJackpot === "v2"}
          >
            <Star className="w-4 h-4" />
            <span>Current Jackpot</span>
            {activeJackpot === "v2" && (
              <motion.div
                layoutId="activeJackpotIndicator"
                className={`absolute bottom-0 w-1/2 h-1 ${indicatorClasses} rounded-full`}
              />
            )}
          </button>
          <button
            onClick={() => setActiveJackpot("v1")}
            className={`relative flex-1 py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
              activeJackpot === "v1" ? activeButtonClasses : inactiveButtonClasses
            }`}
            aria-label="Jackpot V1 tab"
            role="tab"
            aria-selected={activeJackpot === "v1"}
          >
            <Ticket className="w-4 h-4" />
            <span>Legacy Jackpot</span>
            {activeJackpot === "v1" && (
              <motion.div
                layoutId="activeJackpotIndicator"
                className={`absolute bottom-0 w-1/2 h-1 ${indicatorClasses} rounded-full`}
              />
            )}
          </button>
        </div>
      </div>

      <motion.div
        key={activeJackpot}
        initial={{ opacity: 0, x: activeJackpot === "v2" ? 20 : -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
      >
        {activeJackpot === "v2" ? (
          <JackPotV2 isCorrectChain={isCorrectChain} />
        ) : (
          <JackPot isCorrectChain={isCorrectChain} />
        )}
      </motion.div>
    </motion.div>
  );
}