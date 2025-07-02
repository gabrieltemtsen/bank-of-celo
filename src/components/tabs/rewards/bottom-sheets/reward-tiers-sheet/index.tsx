import React from "react";
import { BottomSheet } from "../../components/bottomSheet";
import { TierItem } from "../../tiers-and-redeem/tier";

interface RewardTiersSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

const RewardTiersSheet: React.FC<RewardTiersSheetProps> = ({
  isOpen,
  onClose,
}) => {
  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Reward Tiers"
      className="max-h-screen"
    >
      <div className="space-y-2">
        <TierItem tier="Tier 1" prize="10" winners="Top 5 winners" />
        <TierItem tier="Tier 2" prize="5" winners="Next 20 winners" />
        <TierItem
          tier="Tier 3"
          prize="1"
          winners="Next 25 winners"
          isLast={true}
        />
      </div>
    </BottomSheet>
  );
};

export default RewardTiersSheet;
