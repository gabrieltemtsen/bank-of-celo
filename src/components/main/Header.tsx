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
        "sticky top-0 z-50 backdrop-blur-xl border-b transition-all duration-300",
        showSwitchNetworkBanner ? "pt-7" : "p-4",
        // Celo mode styling
        mode === "celo" 
          ? "bg-emerald-50/95 dark:bg-emerald-950/95 border-emerald-200/50 dark:border-emerald-800/50"
          : "bg-purple-50/95 dark:bg-purple-950/95 border-purple-200/50 dark:border-purple-800/50"
      )}
    >
      <div className="flex items-center justify-between mx-0 md:mx-20">
        {/* Title with proper gradient theming */}
        <h1 className={cn(
          "text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r transition-all duration-300",
          mode === "celo"
            ? "from-emerald-600 to-emerald-800 dark:from-emerald-400 dark:to-emerald-600"
            : "from-purple-600 to-purple-800 dark:from-purple-400 dark:to-purple-600"
        )}>
          {title}
        </h1>
        
        <div className="flex items-center gap-3">
          {isConnected ? (
            <>
              {/* Wallet Address Button */}
              <Button
                onClick={onDisconnect}
                className={cn(
                  "text-xs font-medium flex items-center rounded-full px-4 py-2.5 shadow-lg transition-all duration-300 ease-in-out transform hover:scale-105 border",
                  mode === "celo"
                    ? "text-xs text-black font-medium flex hover:bg-gray-200 bg-gradient-to-r from-emerald-600 to-amber-500 rounded-full px-3 py-1.5"
                    :"text-xs text-black font-medium flex hover:bg-gray-200 bg-gradient-to-r from-purple-600 to-purple-300 rounded-full px-3 py-1.5"
                )}
                aria-label="Disconnect wallet"
              >
                <Wallet className="w-4 h-4 mr-2" />
                {truncateAddress(address!)}
              </Button>
              
              {/* Sign Out Button */}
              {status === "authenticated" && (
                <Button
                  onClick={onSignOut}
                  className="text-xs font-medium bg-red-500 hover:bg-red-600 text-white rounded-full p-2.5 shadow-lg transition-all duration-300 ease-in-out transform hover:scale-105 border border-red-400 hover:shadow-red-200/50"
                  aria-label="Sign out from Farcaster"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              )}
            </>
          ) : (
            /* Connect Wallet Button */
            <Button
              onClick={onConnect}
              className={cn(
                "text-xs font-medium flex items-center rounded-full px-5 py-2.5 shadow-lg transition-all duration-300 ease-in-out transform hover:scale-105 border text-white",
                mode === "celo"
                  ? "bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 border-emerald-400 hover:shadow-emerald-200/50"
                  : "bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 border-purple-400 hover:shadow-purple-200/50"
              )}
              aria-label="Connect wallet"
            >
              <Wallet className="w-4 h-4 mr-2" /> 
              Connect Wallet
            </Button>
          )}
          
          {/* Chain Mode Toggle */}
          <div className="ml-2">
            <ChainModeToggle />
          </div>
        </div>
      </div>

      {/* Network Warning Banner */}
      {isConnected && !isCorrectChain && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ zIndex: 10000 }}
          className={cn(
            "mt-5 border-l-4 p-4 text-center flex flex-col sm:flex-row items-center justify-center gap-3 rounded-r-lg shadow-lg",
            mode === "celo"
              ? "bg-amber-50 dark:bg-amber-900/50 border-amber-500 dark:border-amber-400"
              : "bg-orange-50 dark:bg-orange-900/50 border-orange-500 dark:border-orange-400"
          )}
        >
          <div className="flex items-center gap-2">
            <AlertCircle className={cn(
              "w-5 h-5",
              mode === "celo"
                ? "text-amber-600 dark:text-amber-300"
                : "text-orange-600 dark:text-orange-300"
            )} />
            <span className={cn(
              "font-medium",
              mode === "celo"
                ? "text-amber-800 dark:text-amber-100"
                : "text-orange-800 dark:text-orange-100"
            )}>
              You are on the wrong network
            </span>
          </div>
          
          <Button
            onClick={onSwitchChain}
            disabled={isSwitchChainPending}
            className={cn(
              "text-sm py-2 px-4 rounded-full flex items-center gap-2 text-white font-medium shadow-md transition-all duration-300 transform hover:scale-105",
              mode === "celo"
                ? "bg-amber-600 hover:bg-amber-700 disabled:bg-amber-400"
                : "bg-orange-600 hover:bg-orange-700 disabled:bg-orange-400"
            )}
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