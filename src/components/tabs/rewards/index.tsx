import React, { useState, useRef, useEffect } from "react";
import {
  Zap,
  Trophy,
  Users,
  Star,
  Calendar,
  Target,
  Edit3,
  DollarSign,
  X,
  Shield,
  Flame,
  TrendingUp,
  Award,
  Clock,
} from "lucide-react";
import SelfProtocolComponent from "~/app/services/self-protocol/self";
import DonorsLeaderBoard from "./leader-board/DonorsLeaderBoard";
import Image from "next/image";
import RewardsLeaderBoard from "./leader-board/RewardsLeaderBoard";

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
}

interface TierItemProps {
  tier: string;
  prize: string;
  winners: string;
  isLast?: boolean;
}

interface EarnItemProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

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
  | null;

const BottomSheet: React.FC<BottomSheetProps> = ({
  isOpen,
  onClose,
  title,
  children,
  className = "",
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 ">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Sheet - Increased height to extend above middle */}
      <div
        className={`absolute bottom-0  left-1/2 transform -translate-x-1/2 w-96 max-w-[90vw] h-3/4 rounded-t-3xl bg-gray-800/95 backdrop-blur-xl transition-transform duration-300 ${className}`}
      >
        <div className="w-12 h-1.5 bg-gray-400 rounded-full mx-auto mt-4 mb-6" />
        <div className="px-6 pb-8 h-full overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">{title}</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-700/50 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>
          <div className="mb-10 pb-12">{children}</div>
        </div>
      </div>
    </div>
  );
};

const TierItem: React.FC<TierItemProps> = ({
  tier,
  prize,
  winners,
  isLast = false,
}) => (
  <div className={`py-6 ${!isLast ? "border-b border-gray-500/50" : ""}`}>
    <div className="flex justify-between items-start">
      <div>
        <h3 className="text-white font-semibold text-lg mb-1">
          {tier} – ${prize} Prize
        </h3>
        <p className="text-gray-300 text-sm">{winners}</p>
      </div>
      <div className="bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full text-xs font-medium">
        ${prize}
      </div>
    </div>
  </div>
);

const EarnItem: React.FC<EarnItemProps> = ({ icon, title, description }) => (
  <div className="bg-gray-700/50 backdrop-blur-sm rounded-2xl p-6 mb-4 border border-gray-600/30">
    <div className="flex items-start space-x-4">
      <div className="bg-emerald-500/20 p-3 rounded-xl">{icon}</div>
      <div className="flex-1">
        <h3 className="text-white font-semibold text-lg mb-2">{title}</h3>
        <p className="text-gray-300 text-sm leading-relaxed">{description}</p>
      </div>
    </div>
  </div>
);

export default function WarpcastWalletApp(): JSX.Element {
  const [activeSheet, setActiveSheet] = useState<ActiveSheet>(null);
  const [activeLeaderboardTab, setActiveLeaderboardTab] = useState<'donors' | 'rewards'>('donors');
  const scrollRef = useRef<HTMLDivElement>(null);

  const miniCards: MiniCard[] = [
    {
      id: "leaderboard",
      title: "Leaderboard",
      value: "",
      icon: <Users className="w-4 h-4 text-blue-600" />,
      bgColor: "bg-gray-100/80",
      iconColor: "blue",
    },
    {
      id: "og-earning",
      title: "O.G Earning",
      value: "",
      icon: <Shield className="w-4 h-4 text-yellow-600" />,
      bgColor: "bg-gray-100/80",
      iconColor: "gold",
    },
    {
      id: "rewards",
      title: "Reward Tiers",
      value: "",
      icon: <Trophy className="w-4 h-4 text-purple-600" />,
      bgColor: "bg-gray-100/80",
      iconColor: "purple",
    },
    {
      id: "earn",
      title: "How to Earn",
      value: "",
      icon: <Target className="w-4 h-4 text-emerald-600" />,
      bgColor: "bg-gray-100/80",
      iconColor: "emerald",
    },
    {
      id: "scored",
      title: "Scored last week",
      value: "500",
      icon: <Calendar className="w-4 h-4" />,
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
    closeSheet();
    // Handle successful verification - could update user state, show success message, etc.
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 rounded-md relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-white to-gray-50" />
      <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-emerald-500/10 to-transparent" />

      <div className="relative z-1 p-6 pb-32">

        {/* Score Card */}
        <div className="relative bg-gradient-to-br from-emerald-500/20 via-emerald-400/15 to-teal-500/20 backdrop-blur-xl rounded-3xl p-8 mb-8 border border-emerald-200/50 shadow-xl overflow-hidden">
          {/* Background decorative elements */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-emerald-300/20 to-transparent rounded-full -translate-y-16 translate-x-16" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-teal-300/20 to-transparent rounded-full translate-y-12 -translate-x-12" />

          {/* Floating icons */}
          <div className="absolute top-4 right-4 text-emerald-400/30">
            <Zap className="w-6 h-6" />
          </div>
          <div className="absolute bottom-4 left-4 text-teal-400/30">
            <Star className="w-5 h-5" />
          </div>

          <div className="relative z-10">
            {/* Header with icon */}
            <div className="flex items-center justify-center mb-6">
              <div className="bg-emerald-500/20 p-3 rounded-full mr-3">
                <TrendingUp className="w-6 h-6 text-emerald-600" />
              </div>
              <p className="text-gray-600 text-lg font-medium">Your Score</p>
            </div>

            {/* Main score with decorative elements */}
            <div className="text-center mb-8">
              <div className="relative inline-block">
                <div className="text-7xl font-bold text-gray-900 mb-2 relative">
                  &lt; 500
                  <div className="absolute -top-2 -right-2">
                    <div className="w-4 h-4 bg-emerald-500 rounded-full animate-pulse" />
                  </div>
                </div>

                {/* Score status indicator */}
                <div className="flex items-center justify-center mt-3 mb-6">
                  <div className="bg-emerald-100 text-emerald-700 px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2">
                    <Flame className="w-4 h-4" />
                    Growing
                  </div>
                </div>
              </div>
            </div>

            {/* Enhanced divider */}
            <div className="relative mb-6">
              <div className="h-px bg-gradient-to-r from-transparent via-emerald-300/50 to-transparent" />
              <div className="absolute left-1/2 top-0 transform -translate-x-1/2 -translate-y-1/2">
                <div className="w-2 h-2 bg-emerald-400 rounded-full" />
              </div>
            </div>

            {/* Bottom info with enhanced styling */}
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2 text-gray-600">
                <Clock className="w-4 h-4 text-emerald-500" />
                <span className="text-sm font-medium">Round ends</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1">
                  <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
                  5d 17h
                </div>
              </div>
            </div>

            {/* Additional stats row */}
            <div className="mt-6 pt-6 border-t border-emerald-200/30">
              <div className="flex justify-between items-center text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <Award className="w-4 h-4 text-purple-500" />
                  <span>Current Rank</span>
                </div>
                <span className="text-gray-700 font-semibold">Unranked</span>
              </div>
            </div>
          </div>
        </div>

        {/* Mini Cards */}
        <div
          ref={scrollRef}
          className="flex space-x-3 overflow-x-auto pb-4 scrollbar-hide"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {miniCards.map((card) => (
            <button
              key={card.id}
              onClick={() => openSheet(card.id)}
              className={`${card.bgColor} backdrop-blur-sm rounded-xl p-4 min-w-32 flex-shrink-0 border border-gray-200/50 hover:border-emerald-500/50 transition-all duration-300 hover:scale-105 active:scale-95 shadow-sm`}
            >
              <div className="flex flex-col items-start">
                <div
                  className={`p-2 rounded-lg mb-2 ${card.iconColor === "purple"
                    ? "bg-purple-100"
                    : card.iconColor === "emerald"
                      ? "bg-emerald-100"
                      : card.iconColor === "blue"
                        ? "bg-blue-100"
                        : card.iconColor === "gold"
                          ? "bg-yellow-100"
                          : "bg-gray-200"
                    }`}
                >
                  {card.icon}
                </div>
                <h3 className="text-gray-900 font-medium text-xs text-left mb-1 leading-tight">
                  {card.title}
                </h3>
                {card.value && (
                  <p className="text-lg font-bold text-gray-900 text-left">
                    {card.value}
                  </p>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Bottom Sheets */}

      {/* Scored Last Week Sheet */}
      <BottomSheet
        isOpen={activeSheet === "scored"}
        onClose={closeSheet}
        title="Your weekly score"
      >
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full mx-auto mb-6 flex items-center justify-center">
            <Image
              src="/api/placeholder/60/60"
              alt="Profile"
              width={20}
              height={20}
              className="w-16 h-16 rounded-full object-cover border-2 border-white/20"
            />
          </div>
          <div className="text-5xl font-bold text-white mb-8">500</div>
        </div>

        <div className="space-y-6">
          <div className="flex justify-between items-center py-4 border-b border-gray-500/50">
            <span className="text-gray-300">Your rank</span>
            <span className="text-white font-semibold">None</span>
          </div>
          <div className="flex justify-between items-center py-4">
            <span className="text-gray-300">Week</span>
            <span className="text-white font-semibold">May 13 - 20</span>
          </div>
        </div>
      </BottomSheet>

      {/* O.G Earning Sheet */}
      <BottomSheet
        isOpen={activeSheet === "og-earning"}
        onClose={closeSheet}
        title="O.G Earning"
        className="max-h-screen"
      >
        <div className="mb-6">
          <div className="bg-gradient-to-r from-yellow-500/20 to-yellow-600/20 rounded-xl p-4 mb-4 border border-yellow-500/30">
            <div className="flex items-start gap-3">
              <div className="bg-yellow-500/30 p-2 rounded-lg">
                <Star className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <h3 className="text-white font-semibold mb-1">
                  Unlock Exceptional Earning
                </h3>
                <p className="text-gray-300 text-sm leading-relaxed">
                  Verified O.G users receive up to 10x multiplier on their
                  weekly scores and exclusive access to premium reward tiers.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-emerald-500/10 rounded-xl p-4 border border-emerald-500/20 mb-6">
            <h4 className="text-emerald-400 font-medium text-sm mb-2">
              O.G Benefits:
            </h4>
            <ul className="text-gray-300 text-sm space-y-1">
              <li>• 10x score multiplier</li>
              <li>• Exclusive premium tiers</li>
              <li>• Priority reward distribution</li>
              <li>• Early access to new features</li>
            </ul>
          </div>
        </div>
        <SelfProtocolComponent onSuccess={handleVerificationSuccess} />
        {/* <SelfProtocolVerification onSuccess={handleVerificationSuccess} /> */}
      </BottomSheet>

      {/* Reward Tiers Sheet */}
      <BottomSheet
        isOpen={activeSheet === "rewards"}
        onClose={closeSheet}
        title="Reward Tiers"
        className="max-h-screen"
      >
        <div className="space-y-2">
          <TierItem tier="Tier 1" prize="300" winners="Top 10 winners" />
          <TierItem tier="Tier 2" prize="100" winners="Next 20 winners" />
          <TierItem tier="Tier 3" prize="25" winners="Next 200 winners" />
          <TierItem tier="Tier 4" prize="10" winners="Next 300 winners" />
          <TierItem tier="Tier 5" prize="5" winners="Next 500 winners" />
          <TierItem
            tier="Tier 6"
            prize="3"
            winners="Next 1500 winners"
            isLast={true}
          />
        </div>
      </BottomSheet>

      {/* How to Earn Sheet */}
      <BottomSheet
        isOpen={activeSheet === "earn"}
        onClose={closeSheet}
        title="How to Earn"
        className="max-h-screen"
      >
        <div className="space-y-4">
          <EarnItem
            icon={<Edit3 className="w-6 h-6 text-emerald-400" />}
            title="Cast and Engage"
            description="Your score is based on the engagement your casts receive, adjusted by the number of followers."
          />
          <EarnItem
            icon={<Trophy className="w-6 h-6 text-emerald-400" />}
            title="Get Ranked → Top 2530"
            description="Each week, the top 2530 accounts with the highest scores receive USDC rewards."
          />
          <EarnItem
            icon={<DollarSign className="w-6 h-6 text-emerald-400" />}
            title="Receive USDC"
            description="Rewards are sent to your connected Ethereum address on Base."
          />
        </div>
      </BottomSheet>

      {/* Leaderboard Sheet */}
      <BottomSheet
        isOpen={activeSheet === "leaderboard"}
        onClose={closeSheet}
        title="Leaderboard"
      >
        <div>
          {/* Tab Navigation */}
          <div className="flex bg-gray-700/50 rounded-xl p-1 mb-6">
            <button
              onClick={() => setActiveLeaderboardTab('donors')}
              className={`flex-1 py-3 px-4 rounded-lg font-medium text-sm transition-all duration-200 ${activeLeaderboardTab === 'donors'
                ? 'bg-emerald-600 text-white shadow-lg'
                : 'text-gray-300 hover:text-white hover:bg-gray-600/50'
                }`}
            >
              Donors
            </button>
            <button
              onClick={() => setActiveLeaderboardTab('rewards')}
              className={`flex-1 py-3 px-4 rounded-lg font-medium text-sm transition-all duration-200 ${activeLeaderboardTab === 'rewards'
                ? 'bg-emerald-600 text-white shadow-lg'
                : 'text-gray-300 hover:text-white hover:bg-gray-600/50'
                }`}
            >
              Rewards
            </button>
          </div>

          {/* Tab Content */}
          <div className="min-h-[400px]">
            {activeLeaderboardTab === 'donors' ? (
              <DonorsLeaderBoard />
            ) : (
              <RewardsLeaderBoard />
            )}
          </div>
        </div>
      </BottomSheet>

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
};;