


import React from "react";
import { Edit3, Trophy, DollarSign } from "lucide-react";
import { BottomSheet } from "../../components/bottomSheet";
import { EarnItem } from "../../earn/EarnItem";
import { useChainMode } from "~/app/chain-mode/context";

interface HowToEarnSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

const HowToEarnSheet: React.FC<HowToEarnSheetProps> = ({ isOpen, onClose }) => {
  const { mode } = useChainMode();
  const isDegen = mode === "degen";

  // Dynamic color classes based on mode
  const containerClasses = isDegen
    ? "bg-purple-50 dark:bg-purple-900/20"
    : "bg-emerald-50 dark:bg-emerald-900/20";

  const iconClasses = isDegen
    ? "text-purple-600 dark:text-purple-400"
    : "text-emerald-600 dark:text-emerald-400";

  return (
    <BottomSheet
     isOpen={isOpen} onClose={onClose}
      title="How to Earn"
    >
      <div className={`p-6 space-y-4 ${containerClasses}`}>
        <EarnItem
          icon={<Edit3 className={`w-6 h-6 ${iconClasses}`} />}
          title="Cast and Engage"
          description="Your score is based on the engagement your casts receive, adjusted by the number of followers."
        />
        <EarnItem
          icon={<Trophy className={`w-6 h-6 ${iconClasses}`} />}
          title="Get Ranked → Top 2530"
          description="Each week, the top 2530 accounts with the highest scores receive USDC rewards."
        />
        <EarnItem
          icon={<DollarSign className={`w-6 h-6 ${iconClasses}`} />}
          title="Receive USDC"
          description="Rewards are sent to your connected Ethereum address on Base."
        />
      </div>
    </BottomSheet>
  );
};

export default HowToEarnSheet;