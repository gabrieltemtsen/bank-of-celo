/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useRef } from "react";
import {
  Trophy,
  Users,
  Star,
  Calendar,
  Target,
  Shield,
  Flame,
  TrendingUp,
  Coins,
  Crown,
  Gift,
  CheckCircle2,
  Dice5,
} from "lucide-react";
import { RewardItemProps } from "./bottom-sheets/reward-tiers-sheet/reward-item/RewardItem";
import ScoreCard from "./components/score-card";
import MiniCards from "./components/mini-cards";
import ScoredLastWeek from "./bottom-sheets/scored-last-week";
import OGearningSheet from "./bottom-sheets/og-earning";
import RewardTiersSheet from "./bottom-sheets/reward-tiers-sheet";
import HowToEarnSheet from "./bottom-sheets/how-to-earn";
import LeaderboardSheet from "./bottom-sheets/leader-board";
import { ClaimsSheet } from "./bottom-sheets/claims";
import { DailyCheckinSheet } from "./bottom-sheets/daily-check-ins";
import SpinTheWheelSheet from "./bottom-sheets/spin-the-wheel";
import { toast } from "sonner";
import { useChainMode } from "~/app/chain-mode/context";
import { cn } from "~/lib/utils";

interface MiniCard {
  id: "scored" | "rewards" | "earn" | "leaderboard" | "og-earning";
  title: string;
  value: string;
  icon: React.ReactNode;
  bgColor: string;
  iconColor?: "purple" | "emerald" | "blue" | "gold";
}

type ActiveSheet =
  | "scored"
  | "rewards"
  | "earn"
  | "leaderboard"
  | "og-earning"
  | "claims"
  | "daily-checkin"
  | "spin-wheel"
  | null;

export default function Rewards(): JSX.Element {
  const [activeSheet, setActiveSheet] = useState<ActiveSheet>(null);
  const [isReady, setIsReady] = useState<boolean>(true); // Default to true for demo
  const { mode } = useChainMode();
  const isDegen = mode === "degen";

  const [rewardItems, setRewardItems] = useState<RewardItemProps[]>([
    {
      id: "1",
      title: "Weekly Bonus",
      amount: "$25 USDC",
      description: "Bonus reward for consistent weekly participation",
      status: "available",
      icon: <Coins className="w-6 h-6 text-emerald-400" />,
      rarity: "common",
    },
    {
      id: "2",
      title: "Engagement Master",
      amount: "$100 USDC",
      description: "Achieved 1000+ engagement points this week",
      status: "available",
      icon: <TrendingUp className="w-6 h-6 text-blue-400" />,
      rarity: "rare",
    },
    {
      id: "3",
      title: "Top Creator",
      amount: "$500 USDC",
      description: "Ranked in top 10 creators this month",
      status: "locked",
      icon: <Crown className="w-6 h-6 text-purple-400" />,
      rarity: "epic",
    },
    {
      id: "4",
      title: "Legend Status",
      amount: "$1000 USDC",
      description: "Exclusive reward for legendary contributors",
      status: "locked",
      icon: <Star className="w-6 h-6 text-yellow-400" />,
      rarity: "legendary",
    },
    {
      id: "5",
      title: "Daily Streak",
      amount: "$10 USDC",
      description: "Maintained 30-day posting streak",
      status: "claimed",
      icon: <Flame className="w-6 h-6 text-orange-400" />,
      rarity: "common",
    },
  ]);

  const scrollRef = useRef<HTMLDivElement>(null);

  const miniCards: MiniCard[] = [
    {
      id: "leaderboard",
      title: "Leaderboard",
      value: "",
      icon: <Users className={cn(isDegen ? "w-4 h-4" : "w-3 h-3", "text-blue-600")} />,
      bgColor: "bg-gray-100/80",
      iconColor: "blue",
    },
    {
      id: "og-earning",
      title: "O.G Earning",
      value: "",
      icon: <Shield className={cn(isDegen ? "w-4 h-4" : "w-3 h-3", "text-yellow-600")} />,
      bgColor: "bg-gray-100/80",
      iconColor: "gold",
    },
    {
      id: "rewards",
      title: "Reward Tiers",
      value: "",
      icon: <Trophy className={cn(isDegen ? "w-4 h-4" : "w-3 h-3", "text-purple-600")} />,
      bgColor: "bg-gray-100/80",
      iconColor: "purple",
    },
    {
      id: "earn",
      title: "How to Earn",
      value: "",
      icon: <Target className={cn(isDegen ? "w-4 h-4" : "w-3 h-3", "text-emerald-600")} />,
      bgColor: "bg-gray-100/80",
      iconColor: "emerald",
    },
    {
      id: "scored",
      title: "Scored last week",
      value: "500",
      icon: <Calendar className={cn(isDegen ? "w-4 h-4" : "w-3 h-3")} />,
      bgColor: "bg-gray-100/80",
    },
  ];

  const openSheet = (sheetId: ActiveSheet): void => {
    setActiveSheet(sheetId);
  };

  const closeSheet = (): void => {
    setActiveSheet(null);
  };

  const handleVerificationSuccess = (): void => {
    toast.success("Identity verified successfully!");
    closeSheet();
  };

  const handleRewardRedeem = (rewardId: string): void => {
    setRewardItems((prev) =>
      prev.map((item) =>
        item.id === rewardId ? { ...item, status: "claimed" as const } : item,
      ),
    );
  };

  return (
    <div className={cn(
      "min-h-screen text-gray-900 relative overflow-hidden",
      isDegen ? "bg-white rounded-md" : "panel border-2"
    )}>
      {/* Background gradient (Degen only) */}
      {isDegen && (
        <>
          <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-white to-gray-50" />
          <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-purple-500/10 to-transparent" />
        </>
      )}
      <div className={cn("relative z-1 pb-20 sm:pb-24", isDegen ? "p-6" : "p-3 sm:p-5")}>
        {/* Score Card */}
        <ScoreCard />

        {/* Action Buttons */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-6">
          <button
            disabled={!isReady}
            onClick={() => openSheet("claims")}
            className={cn(
              "px-2 py-2 sm:p-3 flex flex-col items-center justify-center gap-1 sm:gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-[10px] sm:text-xs",
              isDegen
                ? "bg-gradient-to-r from-purple-500/10 to-purple-600/10 border border-purple-500/20 rounded-xl hover:bg-purple-500/20"
                : "boc-btn flex-1"
            )}
          >
            <Gift className={cn("w-4 h-4 sm:w-5 sm:h-5", isDegen ? "text-purple-600" : "text-black")} />
            <span className={cn("font-bold", isDegen ? "text-purple-700" : "text-black")}>
              Claim
            </span>
          </button>

          <button
            onClick={() => openSheet("daily-checkin")}
            className={cn(
              "px-2 py-2 sm:p-3 flex flex-col items-center justify-center gap-1 sm:gap-2 transition-all text-[10px] sm:text-xs",
              isDegen
                ? "bg-gradient-to-r from-blue-500/10 to-blue-600/10 border border-blue-500/20 rounded-xl hover:bg-blue-500/20"
                : "boc-btn secondary flex-1"
            )}
          >
            <CheckCircle2 className={cn("w-4 h-4 sm:w-5 sm:h-5", isDegen ? "text-blue-600" : "text-white")} />
            <span className={cn("font-bold", isDegen ? "text-blue-700" : "text-white")}>
              Check In
            </span>
          </button>

          <button
            onClick={() => openSheet("spin-wheel")}
            className={cn(
              "px-2 py-2 sm:p-3 flex flex-col items-center justify-center gap-1 sm:gap-2 transition-all text-[10px] sm:text-xs",
              isDegen
                ? "bg-gradient-to-r from-fuchsia-500/10 to-pink-600/10 border border-fuchsia-500/20 rounded-xl hover:bg-fuchsia-500/20"
                : "boc-btn flex-1 bg-yellow-400 hover:bg-yellow-500 border-black text-black"
            )}
          >
            <Dice5 className={cn("w-4 h-4 sm:w-5 sm:h-5", isDegen ? "text-fuchsia-600" : "text-black")} />
            <span className={cn("font-bold", isDegen ? "text-fuchsia-700" : "text-black")}>
              Spin
            </span>
          </button>
        </div>

        {/* Mini Cards */}
        <MiniCards
          miniCards={miniCards}
          openSheet={openSheet}
          scrollRef={scrollRef}
        />
      </div>

      {/* Sheets */}
      <ScoredLastWeek
        isOpen={activeSheet === "scored"}
        onClose={closeSheet}
        title="Your weekly score"
      />
      <OGearningSheet
        isOpen={activeSheet === "og-earning"}
        onClose={closeSheet}
        onSuccess={handleVerificationSuccess}
      />
      <RewardTiersSheet
        isOpen={activeSheet === "rewards"}
        onClose={closeSheet}
      />
      <HowToEarnSheet isOpen={activeSheet === "earn"} onClose={closeSheet} />
      <LeaderboardSheet
        isOpen={activeSheet === "leaderboard"}
        onClose={closeSheet}
      />
      <ClaimsSheet
        isOpen={activeSheet === "claims"}
        onClose={closeSheet}
        rewardItems={rewardItems}
        onRedeem={handleRewardRedeem}
      />
      <DailyCheckinSheet
        isOpen={activeSheet === "daily-checkin"}
        onClose={closeSheet}
      />
      <SpinTheWheelSheet
        isOpen={activeSheet === "spin-wheel"}
        onClose={closeSheet}
      />

      <style jsx>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}
