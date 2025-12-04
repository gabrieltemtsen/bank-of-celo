// ScoreCardsComponent with dynamic colors
import React, { useState, useEffect } from "react";
import {
  Zap,
  Star,
  Flame,
  Award,
  Clock,
  Share2,
  Copy,
  X,
  MessageCircle,
  Send,
  Twitter,
} from "lucide-react";
import Image from "next/image";
import { farcasterIcon } from "~/constants/images";
import { useChainMode } from "~/app/chain-mode/context";
import { cn } from "~/lib/utils";

// Enhanced ScoreCard with Share functionality
type ScoreCardProps = {
  onShare: () => void;
};

const ScoreCard = ({ onShare }: ScoreCardProps) => {
  const { mode } = useChainMode();
  const isDegen = mode === "degen";

  return (
    <div className={cn(
      "relative overflow-hidden mb-6 sm:mb-8 p-4 sm:p-6 lg:p-8 transition-all duration-300",
      "bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-[var(--radius)] shadow-lg"
    )}>
      {/* Background decorative elements (Degen only - simplified) */}
      {isDegen && (
        <>
          <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--accent-primary)] opacity-10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-[var(--accent-primary)] opacity-10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
        </>
      )}

      {/* Floating icons */}
      <div className="absolute top-3 right-3 sm:top-4 sm:right-4 text-[var(--text-tertiary)] opacity-50">
        <Zap className="w-4 h-4 sm:w-6 sm:h-6" />
      </div>
      <div className="absolute bottom-3 left-3 sm:bottom-4 sm:left-4 text-[var(--text-tertiary)] opacity-50">
        <Star className="w-4 h-4 sm:w-5 sm:h-5" />
      </div>

      {/* Share Button */}
      <div className="relative z-10">
        {isDegen && (
          <button
            onClick={onShare}
            className="absolute top-0 right-0 sm:top-4 sm:left-0 p-2 rounded-full transition-all duration-200 hover:scale-110 bg-[var(--bg-tertiary)] text-[var(--accent-primary)]"
            aria-label="Share your score"
          >
            <Share2 className="w-5 h-5 sm:w-7 sm:h-7" />
          </button>
        )}

        {/* Main score */}
        <div className="text-center mb-3 sm:mb-5 pt-4 sm:pt-0">
          <div className="relative inline-block">
            <div className="text-2xl sm:text-4xl font-bold text-[var(--text-primary)] mb-1 sm:mb-2 relative">
              &lt; 500
              <div className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2">
                <div className="w-3 h-3 sm:w-4 sm:h-4 bg-[var(--accent-primary)] rounded-full animate-pulse" />
              </div>
            </div>

            {/* Score status indicator */}
            <div className="flex items-center justify-center mt-2 sm:mt-3 mb-4 sm:mb-6">
              <div className={cn(
                "px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-semibold flex items-center gap-1.5 sm:gap-2",
                "bg-[var(--bg-tertiary)] text-[var(--text-primary)] border border-[var(--border-primary)]"
              )}>
                <Flame className="w-3 h-3 sm:w-4 sm:h-4 text-[var(--accent-primary)]" />
                Growing
              </div>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-[var(--border-primary)] my-4 sm:my-6 relative">
          <div className="absolute left-1/2 top-0 transform -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-[var(--accent-primary)]" />
        </div>

        {/* Bottom info */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-1.5 sm:gap-2 text-[var(--text-secondary)]">
            <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="text-xs sm:text-sm font-medium">Round ends</span>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className={cn(
              "px-2 sm:px-3 py-0.5 sm:py-1 text-xs sm:text-sm rounded-full font-bold flex items-center gap-1",
              "bg-[var(--bg-tertiary)] text-[var(--text-primary)] border border-[var(--border-primary)]"
            )}>
              <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent-primary)] animate-pulse" />
              5d 17h
            </div>
          </div>
        </div>

        {/* Additional stats row */}
        <div className="mt-3 sm:mt-5 pt-3 sm:pt-5 border-t border-[var(--border-primary)]">
          <div className="flex justify-between items-center text-[11px] sm:text-sm">
            <div className="flex items-center gap-1.5 sm:gap-2 text-[var(--text-secondary)]">
              <Award className="w-3 h-3 sm:w-4 sm:h-4 text-[var(--accent-primary)]" />
              <span>Current Rank</span>
            </div>
            <span className="text-[var(--text-primary)] font-semibold">Unranked</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Share Modal/Drawer Component
type ShareDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
  userProfile: {
    username?: string;
    profileImage?: string | null;
  };
};

const ShareDrawer = ({ isOpen, onClose, userProfile }: ShareDrawerProps) => {
  const { mode } = useChainMode();
  const isDegen = mode === "degen";

  const [copied, setCopied] = useState(false);
  const shareUrl = "https://bank-of-celo.vercel.app/?tab=rewards";
  const shareText = `Check out my progress on Bank of Celo! Join me in exploring DeFi on Celo 🌱`;

  // Dynamic colors
  // const primaryColor = isDegen ? "purple" : "emerald";
  // const secondaryColor = isDegen ? "pink" : "teal";

  const profileGradient = isDegen
    ? "from-purple-50 to-pink-50"
    : "from-emerald-50 to-teal-50";

  const avatarGradient = isDegen
    ? "from-purple-400 to-pink-500"
    : "from-emerald-400 to-teal-500";

  const flameIconColor = isDegen ? "text-purple-500" : "text-emerald-500";
  const statusTextColor = isDegen ? "text-purple-600" : "text-emerald-600";

  const copyButtonBg = isDegen
    ? "bg-purple-500 hover:bg-purple-600"
    : "bg-emerald-500 hover:bg-emerald-600";

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy: ", err);
    }
  };

  const shareOptions = [
    {
      name: "Farcaster",
      image: farcasterIcon,
      color: "bg-purple-600",
      action: () => {
        // Farcaster cast intent URL
        const castText = `${shareText}\n\n${shareUrl}`;
        const farcasterUrl = `https://warpcast.com/~/compose?text=${encodeURIComponent(castText)}`;
        window.open(farcasterUrl, "_blank");
      },
    },
    {
      name: "WhatsApp",
      icon: MessageCircle,
      color: "bg-green-500",
      action: () => {
        window.open(
          `https://wa.me/?text=${encodeURIComponent(shareText + " " + shareUrl)}`,
          "_blank",
        );
      },
    },
    {
      name: "Telegram",
      icon: Send,
      color: "bg-blue-500",
      action: () => {
        window.open(
          `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`,
          "_blank",
        );
      },
    },
    {
      name: "Twitter",
      icon: Twitter,
      color: "bg-sky-500",
      action: () => {
        window.open(
          `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`,
          "_blank",
        );
      },
    },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-10 flex items-end justify-center">
      <div className="bg-white rounded-t-3xl w-full max-w-md max-h-[80vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">
            Share Your Progress
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* User Profile Section */}
        <div className={`p-6 bg-gradient-to-r ${profileGradient} border-b border-gray-100`}>
          <div className="flex items-center gap-4">
            <div className={`w-16 h-16 bg-gradient-to-br ${avatarGradient} rounded-full flex items-center justify-center`}>
              {userProfile?.profileImage ? (
                <Image
                  src={userProfile.profileImage}
                  alt="Profile"
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <div className="text-white font-bold text-xl">
                  {userProfile?.username?.[0]?.toUpperCase() || "U"}
                </div>
              )}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">
                {userProfile?.username || "Anonymous User"}
              </h3>
              <p className="text-sm text-gray-600">Score: &lt; 500</p>
              <div className="flex items-center gap-1 mt-1">
                <Flame className={`w-4 h-4 ${flameIconColor}`} />
                <span className={`text-sm ${statusTextColor} font-medium`}>
                  Growing
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Share URL */}
        <div className="p-6 border-b border-gray-100">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Share Link
          </label>
          <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-3">
            <input
              type="text"
              value={shareUrl}
              readOnly
              className="flex-1 bg-transparent text-sm text-gray-600 outline-none"
            />
            <button
              onClick={copyToClipboard}
              className={`flex items-center gap-1 ${copyButtonBg} text-white px-3 py-1 rounded-md text-sm transition-colors`}
            >
              <Copy className="w-4 h-4" />
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
        </div>

        {/* Share Options */}
        <div className="p-6">
          <h3 className="text-sm font-medium text-gray-700 mb-4">Share to</h3>
          <div className="grid grid-cols-2 gap-3">
            {shareOptions.map((option) => (
              <button
                key={option.name}
                onClick={option.action}
                className="flex items-center gap-3 p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors"
              >
                {option.image ? (
                  <Image
                    src={option.image}
                    alt={option.name}
                    width={40}
                    height={40}
                    className="rounded-full w-10 h-10 object-cover"
                  />
                ) : (
                  <div
                    className={`w-10 h-10 ${option.color} rounded-full flex items-center justify-center`}
                  >
                    {option.icon && (
                      <option.icon className="w-5 h-5 text-white" />
                    )}
                  </div>
                )}
                <span className="text-gray-800 text-sm font-medium">
                  {option.name}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 bg-gray-50 text-center">
          <p className="text-xs text-gray-500">
            Invite friends to join Bank of Celo and explore DeFi together!
          </p>
        </div>
      </div>
    </div>
  );
};

// Main App Component with URL handling
const ScoreCardsComponent = () => {
  const [showShareDrawer, setShowShareDrawer] = useState(false);
  const [, setActiveTab] = useState("rewards");
  const [, setShowWelcome] = useState(true);

  // Mock user profile - replace with actual user data
  const userProfile = {
    username: "celobuilder",
    profileImage: null, // Replace with actual Farcaster profile image URL
  };

  // Handle URL parameters for deep linking
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tabParam = urlParams.get("tab");

    if (tabParam === "rewards") {
      // Close welcome modal and navigate to rewards tab
      setShowWelcome(false);
      setActiveTab("rewards");
    }
  }, []);

  const handleShare = () => {
    setShowShareDrawer(true);
  };

  return (
    <div className="bg-white text-gray-900">
      <ScoreCard onShare={handleShare} />

      {/* Share Drawer */}
      <ShareDrawer
        isOpen={showShareDrawer}
        onClose={() => setShowShareDrawer(false)}
        userProfile={userProfile}
      />
    </div>
  );
};

export default ScoreCardsComponent;
