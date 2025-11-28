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
        "sticky top-0 z-50 transition-all duration-300",
        showSwitchNetworkBanner ? "pt-6" : "py-4 px-6",
        mode === "celo"
          ? "bg-white border-b border-gray-200 shadow-sm"
          : "backdrop-blur-xl bg-[#0B0B15]/80 border-b border-white/5"
      )}
    >
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        {/* Title */}
        {mode === "celo" ? (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#FCFF52] flex items-center justify-center border border-gray-200">
              <span className="font-bold text-lg text-black">B</span>
            </div>
            <span className="text-xl font-semibold tracking-tight text-gray-900">
              Bank of Celo
            </span>
          </div>
        ) : (
          <h1 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-fuchsia-400 truncate">
            {title}
          </h1>
        )}

        <div className="flex items-center gap-4">
          {isConnected ? (
            <>
              {/* Wallet Address Button */}
              <Button
                onClick={onDisconnect}
                className={cn(
                  "text-sm font-medium flex items-center transition-all duration-200",
                  "px-4 py-2 rounded-lg",
                  mode === "celo"
                    ? "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200"
                    : "bg-purple-900/30 border border-purple-500/30 text-purple-100 hover:bg-purple-800/50"
                )}
                aria-label="Disconnect wallet"
              >
                <Wallet className="w-4 h-4 mr-2 opacity-70" />
                <span className="hidden sm:inline">
                  {truncateAddress(address!)}
                </span>
                <span className="sm:hidden">
                  {truncateAddress(address!, 3, 3)}
                </span>
              </Button>

              {/* Sign Out Button */}
              {status === "authenticated" && (
                <Button
                  onClick={onSignOut}
                  className={cn(
                    "text-sm font-medium rounded-lg transition-all duration-200 p-2",
                    mode === "celo"
                      ? "bg-white border border-gray-200 text-red-600 hover:bg-red-50"
                      : "bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30"
                  )}
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
                "text-sm font-semibold flex items-center transition-all duration-200",
                "px-5 py-2.5 rounded-lg shadow-sm",
                mode === "celo"
                  ? "bg-[#FCFF52] text-black border border-gray-200 hover:bg-[#F0F340] hover:shadow-md"
                  : "bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white hover:shadow-[0_0_15px_rgba(168,85,247,0.5)]"
              )}
              aria-label="Connect wallet"
            >
              <Wallet className="w-4 h-4 mr-2" />
              <span>Connect Wallet</span>
            </Button>
          )}

          {/* Chain Mode Toggle */}
          <div className="pl-4 border-l border-gray-200 dark:border-white/10 ml-2">
            <ChainModeToggle />
          </div>
        </div>
      </div>

      {/* Network Warning Banner */}
      {isConnected && !isCorrectChain && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className={cn(
            "mt-4 p-3 text-center flex flex-col sm:flex-row items-center justify-center gap-3 rounded-lg text-sm font-medium",
            mode === "celo"
              ? "bg-red-50 text-red-700 border border-red-200"
              : "bg-red-900/20 text-red-200 border border-red-500/30"
          )}
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <span>Wrong network. Please switch to {targetChain.name}.</span>
          </div>

          <Button
            onClick={onSwitchChain}
            disabled={isSwitchChainPending}
            className={cn(
              "text-xs py-1.5 px-3 rounded-md flex items-center gap-2 font-semibold transition-all",
              mode === "celo"
                ? "bg-white text-red-700 border border-red-200 hover:bg-red-50"
                : "bg-red-500/20 text-red-100 hover:bg-red-500/30"
            )}
          >
            {isSwitchChainPending ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                className="w-3 h-3 border-2 border-current border-t-transparent rounded-full"
              />
            ) : (
              <ArrowLeftRight className="w-3 h-3" />
            )}
            <span>Switch Network</span>
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
}
