import { motion } from "framer-motion";
import { Wallet, LogOut, AlertCircle, ArrowLeftRight } from "lucide-react";
import { Button } from "~/components/ui/Button";
import { truncateAddress } from "~/lib/truncateAddress";
import { cn } from "~/lib/utils";
import ChainModeToggle from "../chain/ChainModeToggle";
import { useChainMode } from "~/app/chain-mode/context";
import { celo, base } from "wagmi/chains";

interface HeaderProps {
  title: string;
  isConnected: boolean;
  address?: string;
  status: string;
  showSwitchNetworkBanner: boolean;
  isCorrectChain: boolean;
  isSwitchChainPending: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
  onSignOut: () => void;
  onSwitchChain: () => void;
}

export default function Header({
  title,
  isConnected,
  address,
  status,
  showSwitchNetworkBanner,
  isCorrectChain,
  isSwitchChainPending,
  onConnect,
  onDisconnect,
  onSignOut,
  onSwitchChain,
}: HeaderProps) {
  const { mode } = useChainMode();
  const targetChain = mode === "degen" ? base : celo;
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={cn(
        "sticky top-0 z-50 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-b border-gray-200 dark:border-gray-700",
        showSwitchNetworkBanner ? "pt-7" : "p-4",
      )}
    >
      <div className="flex items-center justify-between mx-0 md:mx-20">
        <h1 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[var(--gradient-from)] to-[var(--gradient-to)]">
          {title}
        </h1>
        <div className="flex items-center gap-2">
          {isConnected ? (
            <>
              <Button
                onClick={onDisconnect}
                className="text-xs text-black font-medium flex hover:bg-gray-200 bg-gradient-to-r from-[var(--gradient-from)] to-[var(--gradient-to)] rounded-full px-3 py-1.5"
                aria-label="Disconnect wallet"
              >
                <Wallet className="w-4 h-4 mr-1" />
                {truncateAddress(address!)}
              </Button>
              {status === "authenticated" && (
                <Button
                  onClick={onSignOut}
                  className="text-xs font-medium bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white rounded-full p-1.5 shadow-sm"
                  aria-label="Sign out from Farcaster"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              )}
            </>
          ) : (
            <Button
              onClick={onConnect}
              className="text-xs text-black font-medium flex hover:bg-gray-200 bg-gradient-to-r from-[var(--gradient-from)] to-[var(--gradient-to)] rounded-full px-3 py-1.5"
              aria-label="Connect wallet"
            >
              <Wallet className="w-4 h-4 mr-1" /> Connect
            </Button>
          )}
          <ChainModeToggle />
        </div>
      </div>

      {/* Network Warning Banner */}
      {isConnected && !isCorrectChain && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ zIndex: 10000 }}
          className="bg-amber-100 mt-5 dark:bg-amber-900/50 border-l-4 border-amber-500 dark:border-amber-400 p-3 text-center flex flex-col sm:flex-row items-center justify-center gap-3"
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-300" />
            <span className="text-amber-800 dark:text-amber-100 font-medium">
              You are on the wrong network
            </span>
          </div>
          <Button
            onClick={onSwitchChain}
            disabled={isSwitchChainPending}
            className="bg-amber-600 hover:bg-amber-700 text-white text-sm py-1 px-4 rounded-full flex items-center gap-1"
          >
            {isSwitchChainPending ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
              />
            ) : (
              <ArrowLeftRight className="w-4 h-4" />
            )}
            Switch to {targetChain.name}
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
}
