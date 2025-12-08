import React, { useEffect, useRef, useState } from "react";

import { cn } from "~/lib/utils";

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


  const [showHint, setShowHint] = useState(true);
  const [active, setActive] = useState(0);
  const itemWidthRef = useRef<number | null>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    // Measure card width + gap once
    if (el.firstElementChild && itemWidthRef.current === null) {
      const first = el.firstElementChild as HTMLElement;
      const styles = window.getComputedStyle(first);
      const marginRight = parseFloat(styles.marginRight || "0");
      itemWidthRef.current = first.offsetWidth + marginRight;
    }
    const onScroll = () => {
      if (el.scrollLeft > 8) setShowHint(false);
      if (itemWidthRef.current) {
        const idx = Math.round(el.scrollLeft / itemWidthRef.current);
        setActive(Math.max(0, Math.min(miniCards.length - 1, idx)));
      }
    };
    const onPointer = () => setShowHint(false);
    el.addEventListener("scroll", onScroll, { passive: true });
    el.addEventListener("pointerdown", onPointer, { passive: true });
    const t = setTimeout(() => setShowHint(false), 3500);
    return () => {
      el.removeEventListener("scroll", onScroll);
      el.removeEventListener("pointerdown", onPointer);
      clearTimeout(t);
    };
  }, [scrollRef, miniCards.length]);

  return (
    <div className="relative">
      <div
        ref={scrollRef}
        role="region"
        aria-label="Swipe horizontally to view more cards"
        className="flex space-x-3 z-0 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {miniCards.map((card) => (
          <button
            key={card.id}
            onClick={() => openSheet(card.id)}
            className={cn(
              "p-2 sm:p-3 min-w-[5.5rem] sm:min-w-[7.5rem] flex-shrink-0 transition-all duration-200 snap-start",
              "bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-[var(--radius)] shadow-sm",
              "hover:border-[var(--accent-primary)] hover:scale-105 active:scale-95"
            )}
          >
            <div className="flex flex-col items-start">
              <div className="mb-1.5 sm:mb-2 text-[var(--text-primary)]">{card.icon}</div>
              <h3 className="text-[10px] sm:text-xs font-medium text-left leading-tight text-[var(--text-primary)] uppercase">
                {card.title}
              </h3>
              {card.value && (
                <p className="text-sm sm:text-lg font-bold text-left text-[var(--text-primary)]">
                  {card.value}
                </p>
              )}
            </div>
          </button>
        ))}
      </div>

      {showHint && (
        <div className="pointer-events-none absolute inset-y-0 right-0 w-10 flex items-center justify-center">
          <div className={cn(
            "h-10 px-2 flex items-center gap-1 rounded-lg",
            "bg-[var(--accent-primary)] text-[var(--accent-text)] border border-[var(--border-primary)]"
          )}>
            <span className="text-[10px] font-bold uppercase">Swipe</span>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="opacity-80">
              <path d="M8 4l8 8-8 8"></path>
            </svg>
          </div>
        </div>
      )}

      {/* Pagination dots */}
      <div className="mt-1 flex justify-center gap-1.5">
        {miniCards.map((_, i) => (
          <button
            key={i}
            aria-label={`Go to card ${i + 1}`}
            className={cn(
              "w-1.5 h-1.5 rounded-full transition-colors",
              i === active
                ? "bg-[var(--text-primary)]"
                : "bg-[var(--text-tertiary)]"
            )}
            onClick={() => {
              const el = scrollRef.current;
              if (!el) return;
              const w = itemWidthRef.current || 100;
              el.scrollTo({ left: i * w, behavior: "smooth" });
              setActive(i);
              setShowHint(false);
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default MiniCards;
