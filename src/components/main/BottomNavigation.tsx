/* eslint-disable @typescript-eslint/no-unused-vars */
import { motion } from "framer-motion";
import { Home, Send, Trophy, Briefcase, TrendingUp } from "lucide-react";
import { useChainMode } from "~/app/chain-mode/context";

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

  // Dynamic color classes based on mode
  const activeButtonClasses = isDegen
    ? "text-white bg-gradient-to-r from-purple-500 to-purple-600 shadow-md"
    : "celo-block-yellow border-2 border-black text-black font-[750] uppercase";

  const inactiveButtonClasses = isDegen
    ? "text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400"
    : "text-black hover:bg-black hover:text-[color:var(--celo-yellow)] border-2 border-transparent";

  const indicatorClasses = isDegen
    ? "bg-purple-300"
    : "bg-black";

  return (
    <motion.nav
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
      className={
        mode === "celo"
          ? "fixed bottom-0 left-0 right-0 z-50 bg-[color:var(--celo-lt-tan)] border-t-2 border-[#CCCCCC] flex justify-around py-2 px-4"
          : "fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-lg shadow-t-lg border-t border-gray-200 dark:border-gray-700 flex justify-around py-2 px-4"
      }
    >
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`relative flex-1 min-w-0 flex flex-col items-center p-2 rounded-xl transition-all ${
            activeTab === tab.id
              ? activeButtonClasses
              : inactiveButtonClasses
          }`}
          aria-label={tab.label}
        >
          {tab.icon}
          <span className="text-xs mt-1 font-[750] uppercase tracking-tight">{tab.label}</span>
          {activeTab === tab.id && (
            <motion.div
              layoutId="activeTabIndicator"
              className={`absolute bottom-0 w-1/2 h-1 ${indicatorClasses}`}
            />
          )}
        </button>
      ))}
    </motion.nav>
  );
}
