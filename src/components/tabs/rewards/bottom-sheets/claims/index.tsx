import { BottomSheet } from "../../components/bottomSheet";
import {
  RewardItem,
  RewardItemProps,
} from "../reward-tiers-sheet/reward-item/RewardItem";

import { cn } from "~/lib/utils";

// Claims Sheet Component
export const ClaimsSheet: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  rewardItems: RewardItemProps[];
  onRedeem: (rewardId: string) => void;
}> = ({ isOpen, onClose, rewardItems, onRedeem }) => {



  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Available Claims"
      className="max-h-screen"
    >
      <div className="space-y-4">
        {/* Stats Header */}
        <div className={cn(
          "rounded-xl p-4 mb-6 border",
          "bg-[var(--bg-secondary)] border-[var(--border-primary)] shadow-sm"
        )}>
          <div className="flex items-center justify-between text-center">
            <div>
              <div className="text-2xl font-bold text-[var(--text-primary)]">
                {rewardItems.filter((r) => r.status === "available").length}
              </div>
              <div className="text-xs text-[var(--text-secondary)]">Available</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-[var(--text-tertiary)]">
                {rewardItems.filter((r) => r.status === "claimed").length}
              </div>
              <div className="text-xs text-[var(--text-tertiary)]">Claimed</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-500">
                {rewardItems.filter((r) => r.status === "locked").length}
              </div>
              <div className="text-xs text-orange-400">Locked</div>
            </div>
          </div>
        </div>

        {/* Reward Items */}
        {rewardItems.map((reward) => (
          <RewardItem key={reward.id} {...reward} onRedeem={onRedeem} />
        ))}
      </div>
    </BottomSheet>
  );
};