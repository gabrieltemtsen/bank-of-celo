import React from "react";
import { Star } from "lucide-react";
import SelfProtocolComponent from "~/app/services/self-protocol/self";
import { BottomSheet } from "../../components/bottomSheet";
import { useChainMode } from "~/app/chain-mode/context";

interface OGearningSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const OGearningSheet: React.FC<OGearningSheetProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { mode } = useChainMode();
  const isDegen = mode === "degen";

  // Dynamic color classes based on mode
  const gradientClasses = isDegen
    ? "from-gray-900 via-gray-900 to-purple-900"
    : "from-gray-900 via-gray-900 to-emerald-900";

  const iconGradientClasses = isDegen
    ? "from-purple-400 to-purple-600"
    : "from-emerald-400 to-emerald-600";

  const accentTextClasses = isDegen
    ? "text-purple-400"
    : "text-emerald-400";

  const benefitsBgClasses = isDegen
    ? "bg-purple-500/10"
    : "bg-emerald-500/10";

  const benefitsBorderClasses = isDegen
    ? "border-purple-500/20"
    : "border-emerald-500/20";

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="O.G Earning"
      className="max-h-screen"
    >
      <div className={`bg-gradient-to-br ${gradientClasses} p-6 rounded-t-3xl`}>
        <div className="text-center max-w-md mx-auto">
          <div className="mb-6">
            <div className={`w-16 h-16 bg-gradient-to-br ${iconGradientClasses} rounded-full mx-auto mb-4 flex items-center justify-center`}>
              <Star className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">
              Unlock Exceptional Earning
            </h3>
            <p className="text-gray-300 text-sm leading-relaxed">
              Verified O.G users receive up to 2x multiplier on their weekly
              scores and exclusive access to premium reward tiers.
            </p>
          </div>
        </div>

        <div className={`${benefitsBgClasses} rounded-xl p-4 ${benefitsBorderClasses} border mb-6`}>
          <h4 className={`${accentTextClasses} font-medium text-sm mb-3`}>
            O.G Benefits:
          </h4>
          <ul className="text-gray-300 text-xs space-y-2">
            <li>• 2x score multiplier</li>
            <li>• Exclusive premium tiers</li>
            <li>• Priority reward distribution</li>
            <li>• Early access to new features</li>
          </ul>
        </div>

        <SelfProtocolComponent onSuccess={onSuccess} />
      </div>
    </BottomSheet>
  );
};

export default OGearningSheet;