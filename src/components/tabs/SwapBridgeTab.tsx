/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react/no-unescaped-entities */
import { useState, useEffect, useCallback } from "react";
import { useAccount, useSwitchChain } from "wagmi";
import { Button } from "~/components/ui/Button";
import { ArrowLeftRight, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { celo } from "viem/chains";
import { toast } from "sonner";
import { SquidWidget } from "@0xsquid/widget";
import { useTheme } from "next-themes";

interface SwapBridgeTabProps {
  isCorrectChain: boolean;
}

export default function SwapBridgeTab({ isCorrectChain }: SwapBridgeTabProps) {
  const { isConnected } = useAccount();
  const { switchChain, isPending: isSwitching } = useSwitchChain();
  const { theme, resolvedTheme } = useTheme();
  const [isWidgetReady, setIsWidgetReady] = useState(false);
  const chainId = celo.id;

  const handleSwitchToCelo = useCallback(() => {
    switchChain(
      { chainId: celo.id },
      {
        onSuccess: () => {
          toast.success("Switched to Celo Network");
        },
        onError: (error) => {
          toast.error(`Failed to switch to Celo: ${error.message}`);
          console.log("Switch chain error:", error);
        },
      },
    );
  }, [switchChain]);

  useEffect(() => {
    const timer = setTimeout(() => setIsWidgetReady(true), 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.7 }}
      className="space-y-8"
    >
      <div className="space-y-6">
        {!isConnected ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card-lg modern-card p-8 text-center floating-element"
            style={{
              background: `var(--surface-secondary)`,
              border: `1px solid var(--glass-border)`,
            }}
          >
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="mb-4 p-4 rounded-full mx-auto w-fit"
              style={{ background: `var(--gradient-primary)` }}
            >
              <ArrowLeftRight className="w-8 h-8 text-white" />
            </motion.div>
            <p 
              className="text-lg font-semibold"
              style={{ color: `var(--foreground-secondary)` }}
            >
              Connect your wallet to swap or bridge tokens
            </p>
          </motion.div>
        ) : !isCorrectChain ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button
              onClick={handleSwitchToCelo}
              disabled={isSwitching}
              className="w-full py-4 text-lg font-bold"
              style={{
                background: `var(--gradient-primary)`,
                boxShadow: `var(--glow-primary)`,
              }}
              aria-label="Switch to Celo Network"
            >
              {isSwitching ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="mr-3"
                >
                  <Loader2 className="w-6 h-6" />
                </motion.div>
              ) : (
                <motion.div
                  animate={{ x: [-3, 3, -3] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="mr-3"
                >
                  <ArrowLeftRight className="w-6 h-6" />
                </motion.div>
              )}
              Switch to Celo Network
            </Button>
          </motion.div>
        ) : !isWidgetReady ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="glass-card-lg p-8 text-center"
            style={{
              background: `var(--surface)`,
              border: `1px solid var(--border)`,
            }}
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="mb-4 mx-auto w-fit"
            >
              <Loader2 
                className="w-8 h-8"
                style={{ color: `var(--primary)` }}
              />
            </motion.div>
            <span 
              className="text-lg font-semibold"
              style={{ color: `var(--foreground-secondary)` }}
            >
              Loading widget...
            </span>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="w-full max-w-3xl glass-card-lg modern-card p-6"
            style={{
              background: `var(--surface)`,
              border: `1px solid var(--glass-border)`,
            }}
          >
            <SquidWidget
              config={{
                integratorId: "bankofcelo-752296ef-d9ff-4804-90a5-fab73df78117",
                apiUrl: "https://v2.api.squidrouter.com",
              }}
            />
          </motion.div>
        )}
      </div>

      {/* Enhanced Bridge Information */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="glass-card-lg modern-card hover-lift p-8"
        style={{
          background: `var(--surface)`,
          border: `1px solid var(--glass-border)`,
        }}
      >
        <div className="flex items-center gap-3 mb-6">
          <motion.div
            whileHover={{ rotate: 360 }}
            transition={{ duration: 0.6 }}
            className="p-3 rounded-2xl"
            style={{ 
              background: `var(--gradient-primary)`,
              boxShadow: `var(--glow-primary)`,
            }}
          >
            <ArrowLeftRight className="w-6 h-6 text-white" />
          </motion.div>
          <h3 
            className="text-xl font-bold gradient-text"
            style={{ 
              background: `var(--gradient-primary)`, 
              WebkitBackgroundClip: 'text', 
              WebkitTextFillColor: 'transparent' 
            }}
          >
            How to Bridge
          </h3>
        </div>
        
        <div className="space-y-4">
          {[
            "Connect your wallet and ensure you're on the Celo network",
            "Select the 'Bridge' or 'Swap' tab in the widget",
            "Choose tokens and networks, then confirm the transaction",
          ].map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 + index * 0.1 }}
              className="flex items-start gap-4"
            >
              <motion.div
                whileHover={{ scale: 1.1 }}
                className="rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mt-1"
                style={{
                  background: `var(--gradient-primary)`,
                  color: 'white',
                  boxShadow: `var(--glow-primary)`,
                }}
              >
                {index + 1}
              </motion.div>
              <p 
                className="text-base font-medium leading-relaxed"
                style={{ color: `var(--foreground-secondary)` }}
              >
                {step}
              </p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
