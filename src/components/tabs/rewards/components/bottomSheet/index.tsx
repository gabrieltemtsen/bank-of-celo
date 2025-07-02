import React, { useEffect } from "react";
import { X } from "lucide-react";

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({
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
