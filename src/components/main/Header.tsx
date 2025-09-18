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
        "sticky top-0 z-50 border-b transition-all duration-300",
        showSwitchNetworkBanner ? "pt-7" : "p-3 md:p-4",
        mode === "celo"
          ? "bg-[color:var(--celo-lt-tan)] border-[#CCCCCC]"
          : "backdrop-blur-xl bg-purple-50/95 dark:bg-purple-950/95 border-purple-200/50 dark:border-purple-800/50"
      )}
    >
      <div className="flex items-center justify-between mx-0 md:mx-20">
        {/* Title with responsive sizing */}
        {mode === "celo" ? (
          <div className="truncate max-w-[70%] md:max-w-none">
            <h3 className="inline-block celo-block-yellow border-2 border-black px-2 py-1 leading-none tracking-tight">
              <span className="font-[250]">{title}</span>
            </h3>
          </div>
        ) : (
          <h1 className={cn(
            "text-lg md:text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r transition-all duration-300 truncate max-w-[40%] md:max-w-none",
            "from-purple-600 to-purple-800 dark:from-purple-400 dark:to-purple-600"
          )}>
            {title}
          </h1>
        )}
        
        <div className="flex items-center gap-1.5 md:gap-3">
          {isConnected ? (
            <>
              {/* Wallet Address Button - Compact on mobile */}
              <Button
                onClick={onDisconnect}
                className={cn(
                  "text-xs font-medium flex items-center rounded-full shadow-lg transition-all duration-300 ease-in-out transform hover:scale-105 border",
                  "px-2.5 py-1.5 md:px-4 md:py-2.5",
                  mode === "celo" ? "" : "bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 border-purple-400 hover:shadow-purple-200/50 text-white"
                )}
                aria-label="Disconnect wallet"
              >
                <Wallet className="w-3.5 h-3.5 md:w-4 md:h-4 mr-1.5 md:mr-2" />
                <span className="hidden sm:inline">
                  {truncateAddress(address!)}
                </span>
                <span className="sm:hidden">
                  {truncateAddress(address!, 3, 3)}
                </span>
              </Button>
              
              {/* Sign Out Button - Icon only on mobile */}
              {status === "authenticated" && (
                <Button
                  onClick={onSignOut}
                  className={cn(
                    "text-xs font-medium rounded-full shadow-lg transition-all duration-300 ease-in-out transform hover:scale-105 border p-1.5 md:p-2.5",
                    mode === "celo" ? "" : "bg-red-500 hover:bg-red-600 text-white border-red-400 hover:shadow-red-200/50"
                  )}
                  aria-label="Sign out from Farcaster"
                >
                  <LogOut className="w-3.5 h-3.5 md:w-4 md:h-4" />
                </Button>
              )}
            </>
          ) : (
            /* Connect Wallet Button - Compact on mobile */
            <Button
              onClick={onConnect}
              className={cn(
                "text-xs font-medium flex items-center rounded-full shadow-lg transition-all duration-300 ease-in-out transform hover:scale-105 border",
                "px-3 py-1.5 md:px-5 md:py-2.5",
                mode === "celo" ? "" : "bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 border-purple-400 hover:shadow-purple-200/50 text-white"
              )}
              aria-label="Connect wallet"
            >
              <Wallet className="w-3.5 h-3.5 md:w-4 md:h-4 mr-1.5 md:mr-2" /> 
              <span className="hidden sm:inline">Connect Wallet</span>
              <span className="sm:hidden">Connect</span>
            </Button>
          )}
          
          {/* Chain Mode Toggle - Compact wrapper */}
          <div className="ml-0.5 md:ml-2">
            <ChainModeToggle />
          </div>
        </div>
      </div>

      {/* Network Warning Banner - Mobile optimized */}
      {isConnected && !isCorrectChain && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ zIndex: 10000 }}
          className={cn(
            "mt-3 md:mt-5 border-l-4 p-3 md:p-4 text-center flex flex-col sm:flex-row items-center justify-center gap-2 md:gap-3 rounded-r-lg shadow-lg",
            mode === "celo"
              ? "bg-amber-50 dark:bg-amber-900/50 border-amber-500 dark:border-amber-400"
              : "bg-orange-50 dark:bg-orange-900/50 border-orange-500 dark:border-orange-400"
          )}
        >
          <div className="flex items-center gap-2">
            <AlertCircle className={cn(
              "w-4 h-4 md:w-5 md:h-5",
              mode === "celo"
                ? "text-amber-600 dark:text-amber-300"
                : "text-orange-600 dark:text-orange-300"
            )} />
            <span className={cn(
              "font-medium text-sm md:text-base",
              mode === "celo"
                ? "text-amber-800 dark:text-amber-100"
                : "text-orange-800 dark:text-orange-100"
            )}>
              Wrong network
            </span>
          </div>
          
          <Button
            onClick={onSwitchChain}
            disabled={isSwitchChainPending}
            className={cn(
              "text-xs md:text-sm py-1.5 md:py-2 px-3 md:px-4 rounded-full flex items-center gap-2 text-white font-medium shadow-md transition-all duration-300 transform hover:scale-105",
              mode === "celo"
                ? "bg-amber-600 hover:bg-amber-700 disabled:bg-amber-400"
                : "bg-orange-600 hover:bg-orange-700 disabled:bg-orange-400"
            )}
          >
            {isSwitchChainPending ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                className="w-3.5 h-3.5 md:w-4 md:h-4 border-2 border-white border-t-transparent rounded-full"
              />
            ) : (
              <ArrowLeftRight className="w-3.5 h-3.5 md:w-4 md:h-4" />
            )}
            <span className="hidden sm:inline">Switch to {targetChain.name}</span>
            <span className="sm:hidden">Switch</span>
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
}
