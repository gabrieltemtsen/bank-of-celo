import { useChainMode } from "~/app/chain-mode/context";

interface EarnItemProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

export const EarnItem: React.FC<EarnItemProps> = ({
  icon,
  title,
  description,
}) => {
  const { mode } = useChainMode();
  const isDegen = mode === "degen";
  return (
    <div className={isDegen ? "bg-gray-700/50 backdrop-blur-sm rounded-2xl p-6 mb-4 border border-gray-600/30" : "panel p-4 mb-3"}>
      <div className="flex items-start space-x-3 sm:space-x-4">
        <div className={isDegen ? "bg-emerald-500/20 p-3 rounded-xl" : "p-2 text-black"}>{icon}</div>
        <div className="flex-1">
          <h3 className={isDegen ? "text-white font-semibold text-lg mb-2" : "text-black font-[750] uppercase text-sm sm:text-base mb-1"}>{title}</h3>
          <p className={isDegen ? "text-gray-300 text-sm leading-relaxed" : "text-black text-xs sm:text-sm leading-relaxed"}>{description}</p>
        </div>
      </div>
    </div>
  );
};
