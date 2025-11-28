/* eslint-disable @typescript-eslint/no-unused-vars */
import { motion } from "framer-motion";
import { Home, Send, Trophy, Briefcase, TrendingUp } from "lucide-react";
import { useChainMode } from "~/app/chain-mode/context";
import { cn } from "~/lib/utils";

interface BottomNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const tabs = [
  { id: "home", icon: <Home className="w-5 h-5" />, label: "Home" },
  { id: "transact", icon: <Send className="w-5 h-5" />, label: "Transact" },
  { id: "fx", icon: <TrendingUp className="w-5 h-5" />, label: "Fx" },
  { id: "jackpot", icon: <Trophy className="w-5 h-5" />, label: "Jackpot" },
  { id: "rewards", icon: <Trophy className="w-5 h-5" />, label: "Rewards" },
];

export default function BottomNavigation({
  activeTab,
  onTabChange,
}: BottomNavigationProps) {
  const { mode } = useChainMode();
  const isDegen = mode === "degen";

  return (
    <motion.nav
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50 flex justify-around py-3 px-4 pb-safe transition-all duration-300",
        mode === "celo"
          ? "bg-white border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]"
          : "bg-[#0B0B15]/90 backdrop-blur-lg border-t border-white/10"
      )}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              "relative flex-1 min-w-0 flex flex-col items-center p-2 rounded-xl transition-all duration-200",
              isActive && mode === "celo" && "text-gray-900",
              !isActive && mode === "celo" && "text-gray-500 hover:text-gray-900 hover:bg-gray-50",
              isActive && isDegen && "text-white",
              !isActive && isDegen && "text-gray-500 hover:text-gray-300 hover:bg-white/5"
            )}
            aria-label={tab.label}
          >
            <div className={cn(
              "relative p-2 rounded-xl transition-all duration-300",
              isActive && mode === "celo" && "bg-[#FCFF52] text-black transform -translate-y-2 shadow-sm border border-gray-200",
              isActive && isDegen && "bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white shadow-[0_0_15px_rgba(168,85,247,0.5)] transform -translate-y-2"
            )}>
              {tab.icon}
            </div>

            <span className={cn(
              "text-[10px] mt-1 font-semibold transition-all duration-200 uppercase tracking-wide",
              isActive ? "opacity-100" : "opacity-0 h-0 overflow-hidden"
            )}>
              {tab.label}
            </span>

            {isActive && (
              <motion.div
                layoutId="activeTabIndicator"
                className={cn(
                  "absolute bottom-1 w-1 h-1 rounded-full",
                  mode === "celo" ? "bg-black" : "bg-fuchsia-400"
                )}
              />
            )}
          </button>
        );
      })}
    </motion.nav>
  );
}
