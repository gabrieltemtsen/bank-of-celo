
import { cn } from "~/lib/utils";

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



  return (
    <div className={cn(
      "rounded-2xl p-4 sm:p-6 mb-3 sm:mb-4 border",
      "bg-[var(--bg-secondary)] border-[var(--border-primary)] shadow-sm"
    )}>
      <div className="flex items-start space-x-3 sm:space-x-4">
        <div className={cn(
          "p-2 sm:p-3 rounded-xl",
          "bg-[var(--bg-tertiary)] text-[var(--accent-primary)]"
        )}>
          {icon}
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-lg mb-1 sm:mb-2 text-[var(--text-primary)]">
            {title}
          </h3>
          <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
};
