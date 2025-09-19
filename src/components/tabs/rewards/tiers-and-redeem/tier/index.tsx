import { useChainMode } from "~/app/chain-mode/context";

interface TierItemProps {
  tier: string;
  prize: string;
  winners: string;
  isLast?: boolean;
}

export const TierItem: React.FC<TierItemProps> = ({
  tier,
  prize,
  winners,
  isLast = false,
}) => {
  const { mode } = useChainMode();
  const currency = mode === "degen" ? "DEGEN" : "CELO";
  const isDegen = mode === "degen";

  // Dynamic color classes based on mode
  const containerClasses = isDegen
    ? "bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800 rounded-lg"
    : "panel border-2";

  const tierTextClasses = isDegen
    ? "text-purple-800 dark:text-purple-200"
    : "text-emerald-800 dark:text-emerald-200";

  const prizeTextClasses = isDegen
    ? "text-purple-600 dark:text-purple-300"
    : "text-emerald-600 dark:text-emerald-300";

  const winnersTextClasses = isDegen
    ? "text-purple-700 dark:text-purple-300"
    : "text-emerald-700 dark:text-emerald-300";

  return (
    <div className={`p-3 sm:p-4 ${containerClasses} ${!isLast ? 'mb-3' : ''}`}>
      <div className="flex justify-between items-center">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className={`font-semibold text-sm sm:text-base ${isDegen ? tierTextClasses : 'uppercase font-[750] text-black'}`}>
              {tier} ~ {prize} ${currency}
            </span>
          </div>
          <div className={`text-xs sm:text-sm mt-1 ${isDegen ? winnersTextClasses : 'text-black'}`}>
            {winners}
          </div>
        </div>
        <div className="text-right">
          <div className={`font-bold text-base sm:text-xl ${isDegen ? prizeTextClasses : 'text-black'}`}>
            {prize} ${currency.toLowerCase()}
          </div>
        </div>
      </div>
    </div>
  );
};
