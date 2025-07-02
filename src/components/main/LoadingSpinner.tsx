import { motion } from "framer-motion";
import { Home } from "lucide-react";
import { useChainMode } from "~/app/chain-mode/context";

interface LoadingSpinnerProps {
  isSDKLoading?: boolean;
}

export default function LoadingSpinner({
  isSDKLoading = false,
}: LoadingSpinnerProps) {
  const { mode } = useChainMode();
  const isDegen = mode === "degen";

  // Dynamic color classes based on mode
  const spinnerClasses = isDegen
    ? "text-purple-600"
    : "text-emerald-600";

  const bgClasses = isDegen
    ? "bg-purple-50 dark:bg-purple-900/20"
    : "bg-emerald-50 dark:bg-emerald-900/20";

  if (isSDKLoading) {
    return (
      <div className={`flex items-center justify-center min-h-screen ${bgClasses}`}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className={`w-8 h-8 ${spinnerClasses}`}
        >
          <Home size={32} />
        </motion.div>
      </div>
    );
  }

  return (
    <div className={`flex items-center justify-center p-8 ${bgClasses}`}>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        className={`w-6 h-6 ${spinnerClasses}`}
      />
    </div>
  );
}