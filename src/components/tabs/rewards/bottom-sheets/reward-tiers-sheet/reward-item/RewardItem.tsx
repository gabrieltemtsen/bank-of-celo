import React, { useState } from "react";
import { Star, Gift, CheckCircle, Loader, Crown, Sparkles } from "lucide-react";

export interface RewardItemProps {
  id: string;
  title: string;
  amount: string;
  description: string;
  status: "available" | "claimed" | "locked";
  icon: React.ReactNode;
  rarity?: "common" | "rare" | "epic" | "legendary";
}
export const RewardItem: React.FC<
  RewardItemProps & { onRedeem: (id: string) => void }
> = ({
  id,
  title,
  amount,
  description,
  status,
  icon,
  rarity = "common",
  onRedeem,
}) => {
  const [isRedeeming, setIsRedeeming] = useState(false);

  const handleRedeem = async () => {
    if (status !== "available") return;

    setIsRedeeming(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsRedeeming(false);
    onRedeem(id);
  };

  const getRarityColors = (rarity: string) => {
    switch (rarity) {
      case "legendary":
        return {
          bg: "from-yellow-500/20 via-orange-500/20 to-red-500/20",
          border: "border-yellow-500/50",
          glow: "shadow-yellow-500/20",
          text: "text-yellow-400",
        };
      case "epic":
        return {
          bg: "from-purple-500/20 via-pink-500/20 to-purple-500/20",
          border: "border-purple-500/50",
          glow: "shadow-purple-500/20",
          text: "text-purple-400",
        };
      case "rare":
        return {
          bg: "from-blue-500/20 via-cyan-500/20 to-blue-500/20",
          border: "border-blue-500/50",
          glow: "shadow-blue-500/20",
          text: "text-blue-400",
        };
      default:
        return {
          bg: "from-emerald-500/20 to-emerald-600/20",
          border: "border-emerald-500/30",
          glow: "shadow-emerald-500/20",
          text: "text-emerald-400",
        };
    }
  };

  const colors = getRarityColors(rarity);

  return (
    <div
      className={`relative bg-gradient-to-br ${colors.bg} backdrop-blur-sm rounded-2xl p-6 mb-4 border ${colors.border} ${status === "available" ? `shadow-xl ${colors.glow}` : ""} transition-all duration-300 ${status === "available" ? "hover:scale-[1.02] hover:shadow-2xl" : ""}`}
    >
      {/* Rarity indicator */}
      {rarity !== "common" && (
        <div className="absolute top-3 right-3">
          <div
            className={`${colors.text} flex items-center gap-1 text-xs font-bold`}
          >
            {rarity === "legendary" && <Crown className="w-3 h-3" />}
            {rarity === "epic" && <Sparkles className="w-3 h-3" />}
            {rarity === "rare" && <Star className="w-3 h-3" />}
            {rarity.toUpperCase()}
          </div>
        </div>
      )}

      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-4 flex-1">
          <div
            className={`${colors.bg} p-3 rounded-xl ${colors.border} border backdrop-blur-sm`}
          >
            {icon}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-white font-semibold text-lg">{title}</h3>
              {status === "claimed" && (
                <CheckCircle className="w-5 h-5 text-emerald-400" />
              )}
            </div>
            <div className={`${colors.text} font-bold text-xl mb-2`}>
              {amount}
            </div>
            <p className="text-gray-300 text-sm leading-relaxed mb-4">
              {description}
            </p>

            {/* Status and action */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {status === "available" && (
                  <div className="bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                    Ready to claim
                  </div>
                )}
                {status === "claimed" && (
                  <div className="bg-gray-500/20 text-gray-400 px-3 py-1 rounded-full text-xs font-medium">
                    Claimed
                  </div>
                )}
                {status === "locked" && (
                  <div className="bg-orange-500/20 text-orange-400 px-3 py-1 rounded-full text-xs font-medium">
                    Requirements not met
                  </div>
                )}
              </div>

              {status === "available" && (
                <button
                  onClick={handleRedeem}
                  disabled={isRedeeming}
                  className={`${colors.bg} ${colors.border} border text-white font-semibold px-6 py-2 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2`}
                >
                  {isRedeeming ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      Claiming...
                    </>
                  ) : (
                    <>
                      <Gift className="w-4 h-4" />
                      Claim
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
