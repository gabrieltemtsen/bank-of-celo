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
      transition={{ duration: 0.5, type: "spring", stiffness: 300 }}
      className={cn(
        "sticky top-0 z-50 glass-card backdrop-blur-xl border-b",
        showSwitchNetworkBanner ? "pt-7" : "p-4",
      )}
      style={{
        background: `var(--glass-bg)`,
        borderColor: `var(--glass-border)`,
        boxShadow: `var(--shadow-lg)`,
      }}
    >
      <div className="flex items-center justify-between mx-0 md:mx-20">
        <motion.h1 
          className="text-2xl font-bold gradient-text"
          style={{ 
            background: `var(--gradient-primary)`, 
            WebkitBackgroundClip: 'text', 
            WebkitTextFillColor: 'transparent' 
          }}
          whileHover={{ scale: 1.05 }}
          transition={{ duration: 0.2 }}
        >
          {title}
        </motion.h1>
        
        <div className="flex items-center gap-3">
          {isConnected ? (
            <>
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  onClick={onDisconnect}
                  variant="glass"
                  className="text-sm font-semibold flex items-center px-4 py-2 rounded-xl"
                  style={{
                    background: `var(--surface-secondary)`,
                    border: `1px solid var(--glass-border)`,
                    color: `var(--foreground)`,
                  }}
                  aria-label="Disconnect wallet"
                >
                  <motion.div
                    animate={{ rotate: [0, 5, -5, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="mr-2"
                  >
                    <Wallet className="w-4 h-4" />
                  </motion.div>
                  {truncateAddress(address!)}
                </Button>
              </motion.div>
              
              {status === "authenticated" && (
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    onClick={onSignOut}
                    className="text-sm font-semibold rounded-xl p-3"
                    style={{
                      background: `var(--error)`,
                      color: 'white',
                      boxShadow: `0 0 20px rgba(239, 68, 68, 0.3)`,
                    }}
                    aria-label="Sign out from Farcaster"
                  >
                    <LogOut className="w-4 h-4" />
                  </Button>
                </motion.div>
              )}
            </>
          ) : (
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                onClick={onConnect}
                className="text-sm font-bold flex items-center px-6 py-3 rounded-xl"
                style={{
                  background: `var(--gradient-primary)`,
                  color: 'white',
                  boxShadow: `var(--glow-primary)`,
                }}
                aria-label="Connect wallet"
              >
                <motion.div
                  animate={{ 
                    rotate: [0, 10, -10, 0],
                    scale: [1, 1.1, 1] 
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="mr-2"
                >
                  <Wallet className="w-5 h-5" />
                </motion.div>
                Connect Wallet
              </Button>
            </motion.div>
          )}
          
          <motion.div
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.2 }}
          >
            <ChainModeToggle />
          </motion.div>
        </div>
      </div>

      {/* Enhanced Network Warning Banner */}
      {isConnected && !isCorrectChain && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className="mt-4 p-4 glass-card rounded-2xl border-l-4"
          style={{
            zIndex: 10000,
            background: `var(--surface-secondary)`,
            borderLeftColor: `var(--warning)`,
            border: `1px solid var(--glass-border)`,
            boxShadow: `var(--shadow-lg)`,
          }}
        >
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <div className="flex items-center gap-3">
              <motion.div
                animate={{ 
                  scale: [1, 1.2, 1],
                  rotate: [0, 5, -5, 0] 
                }}
                transition={{ duration: 2, repeat: Infinity }}
                className="p-2 rounded-xl"
                style={{ background: `rgba(245, 158, 11, 0.2)` }}
              >
                <AlertCircle 
                  className="w-6 h-6" 
                  style={{ color: `var(--warning)` }} 
                />
              </motion.div>
              <span 
                className="font-semibold text-base"
                style={{ color: `var(--warning)` }}
              >
                You are on the wrong network
              </span>
            </div>
            
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                onClick={onSwitchChain}
                disabled={isSwitchChainPending}
                className="text-sm font-bold py-3 px-6 rounded-xl flex items-center gap-2"
                style={{
                  background: `var(--warning)`,
                  color: 'white',
                  boxShadow: `0 0 20px rgba(245, 158, 11, 0.4)`,
                }}
              >
                {isSwitchChainPending ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                    className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                  />
                ) : (
                  <motion.div
                    animate={{ x: [-2, 2, -2] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <ArrowLeftRight className="w-5 h-5" />
                  </motion.div>
                )}
                Switch to {targetChain.name}
              </Button>
            </motion.div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}