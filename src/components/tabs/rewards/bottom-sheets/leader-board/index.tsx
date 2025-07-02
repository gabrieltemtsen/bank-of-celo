import React, { useState } from "react";
import { BottomSheet } from "../../components/bottomSheet";
import DonorsLeaderBoard from "../../leader-board/DonorsLeaderBoard";
import RewardsLeaderBoard from "../../leader-board/RewardsLeaderBoard";
import { useChainMode } from "~/app/chain-mode/context";

interface LeaderboardSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

const LeaderboardSheet: React.FC<LeaderboardSheetProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeLeaderboardTab, setActiveLeaderboardTab] = useState<
    "donors" | "rewards"
  >("donors");

  const { mode } = useChainMode();
  const isDegen = mode === "degen";

  // Dynamic color classes based on mode
  const activeTabClasses = isDegen
    ? "bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg"
    : "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg";

  const inactiveTabClasses = isDegen
    ? "text-gray-300 hover:text-white hover:bg-purple-600/20"
    : "text-gray-300 hover:text-white hover:bg-emerald-600/20";

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Leaderboard">
      <div>
        {/* Tab Navigation */}
        <div className="flex bg-gray-700/50 rounded-xl p-1 mb-6">
          <button
            onClick={() => setActiveLeaderboardTab("donors")}
            className={`flex-1 py-3 px-4 rounded-lg font-medium text-sm transition-all duration-200 ${
              activeLeaderboardTab === "donors"
                ? activeTabClasses
                : inactiveTabClasses
            }`}
          >
            Donors
          </button>
          <button
            onClick={() => setActiveLeaderboardTab("rewards")}
            className={`flex-1 py-3 px-4 rounded-lg font-medium text-sm transition-all duration-200 ${
              activeLeaderboardTab === "rewards"
                ? activeTabClasses
                : inactiveTabClasses
            }`}
          >
            Rewards
          </button>
        </div>

        {/* Tab Content */}
        <div className="min-h-[400px]">
          {activeLeaderboardTab === "donors" ? (
            <DonorsLeaderBoard />
          ) : (
            <RewardsLeaderBoard />
          )}
        </div>
      </div>
    </BottomSheet>
  );
};

export default LeaderboardSheet;