import React from "react";

interface MiniCard {
  id: "scored" | "rewards" | "earn" | "leaderboard" | "og-earning";
  title: string;
  value: string;
  icon: React.ReactNode;
  bgColor: string;
  iconColor?: "purple" | "emerald" | "blue" | "gold";
}

interface MiniCardsProps {
  miniCards: MiniCard[];
  openSheet: (sheetId: MiniCard["id"]) => void;
  scrollRef: React.RefObject<HTMLDivElement>;
}

const MiniCards: React.FC<MiniCardsProps> = ({
  miniCards,
  openSheet,
  scrollRef,
}) => {
  return (
    <div
      ref={scrollRef}
      className="flex space-x-3 z-0 overflow-x-auto pb-4 scrollbar-hide"
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
              className={`p-2 rounded-lg mb-2 ${
                card.iconColor === "purple"
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
  );
};

export default MiniCards;
