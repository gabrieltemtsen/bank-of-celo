import React, { useState } from "react";
import { BottomSheet } from "../../components/bottomSheet";
import DonorsLeaderBoard from "../../leader-board/DonorsLeaderBoard";
import RewardsLeaderBoard from "../../leader-board/RewardsLeaderBoard";

import { cn } from "~/lib/utils";

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




  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Leaderboard">
      <div>
        {/* Tab Navigation */}
        <div className={cn(
          "flex rounded-xl p-1 mb-6",
          "bg-[var(--bg-tertiary)] border border-[var(--border-primary)]"
        )}>
          <button
            onClick={() => setActiveLeaderboardTab("donors")}
            className={cn(
              "flex-1 py-3 px-4 rounded-lg font-medium text-sm transition-all duration-200",
              activeLeaderboardTab === "donors"
                ? "bg-[var(--bg-secondary)] text-[var(--text-primary)] shadow-sm"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]/50"
            )}
          >
            Donors
          </button>
          <button
            onClick={() => setActiveLeaderboardTab("rewards")}
            className={cn(
              "flex-1 py-3 px-4 rounded-lg font-medium text-sm transition-all duration-200",
              activeLeaderboardTab === "rewards"
                ? "bg-[var(--bg-secondary)] text-[var(--text-primary)] shadow-sm"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]/50"
            )}
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