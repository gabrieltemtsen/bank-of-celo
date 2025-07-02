import React from "react";
import Image from "next/image";
import { BottomSheet } from "../../components/bottomSheet";

interface ScoredLastWeekProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
}

const ScoredLastWeek: React.FC<ScoredLastWeekProps> = ({
  isOpen,
  onClose,
  title,
}) => {
  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title={title}>
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
  );
};

export default ScoredLastWeek;
