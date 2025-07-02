import { BottomSheet } from "../../components/bottomSheet";
import {
  RewardItem,
  RewardItemProps,
} from "../reward-tiers-sheet/reward-item/RewardItem";
import { useChainMode } from "~/app/chain-mode/context";

// Claims Sheet Component
export const ClaimsSheet: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  rewardItems: RewardItemProps[];
  onRedeem: (rewardId: string) => void;
}> = ({ isOpen, onClose, rewardItems, onRedeem }) => {
  const { mode } = useChainMode();
  const isDegen = mode === "degen";

  // Dynamic colors based on mode
  const headerGradient = isDegen
    ? "from-purple-500/20 to-purple-600/20"
    : "from-emerald-500/20 to-emerald-600/20";

  const headerBorder = isDegen
    ? "border-purple-500/30"
    : "border-emerald-500/30";

  const availableTextColor = isDegen ? "text-purple-400" : "text-emerald-400";
  const availableColor = isDegen ? "text-purple-300" : "text-emerald-300";

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Available Claims"
      className="max-h-screen"
    >
      <div className="space-y-4">
        {/* Stats Header */}
        <div className={`bg-gradient-to-r ${headerGradient} rounded-xl p-4 mb-6 border ${headerBorder}`}>
          <div className="flex items-center justify-between text-center">
            <div>
              <div className={`text-2xl font-bold ${availableTextColor}`}>
                {rewardItems.filter((r) => r.status === "available").length}
              </div>
              <div className={`text-xs ${availableColor}`}>Available</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-300">
                {rewardItems.filter((r) => r.status === "claimed").length}
              </div>
              <div className="text-xs text-gray-400">Claimed</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-400">
                {rewardItems.filter((r) => r.status === "locked").length}
              </div>
              <div className="text-xs text-orange-300">Locked</div>
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