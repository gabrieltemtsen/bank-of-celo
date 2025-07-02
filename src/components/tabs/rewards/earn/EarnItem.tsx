interface EarnItemProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

export const EarnItem: React.FC<EarnItemProps> = ({
  icon,
  title,
  description,
}) => (
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
