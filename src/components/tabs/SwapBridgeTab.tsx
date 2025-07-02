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
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <div className="space-y-4">
        {!isConnected ? (
          <div className="p-4 text-center bg-gray-50 dark:bg-gray-700 rounded-lg">
            <p className="text-gray-600 dark:text-gray-300">
              Connect your wallet to swap or bridge tokens
            </p>
          </div>
        ) : !isCorrectChain ? (
          <Button
            onClick={handleSwitchToCelo}
            disabled={isSwitching}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            aria-label="Switch to Celo Network"
          >
            {isSwitching ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <ArrowLeftRight className="w-4 h-4 mr-2" />
            )}
            Switch to Celo Network
          </Button>
        ) : !isWidgetReady ? (
          <div className="flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <Loader2 className="w-5 h-5 animate-spin text-blue-500 mr-2" />
            <span className="text-gray-600 dark:text-gray-300">
              Loading widget...
            </span>
          </div>
        ) : (
          <div className="w-full max-w-3xl">
            <SquidWidget
              config={{
                integratorId: "bankofcelo-752296ef-d9ff-4804-90a5-fab73df78117",
                apiUrl: "https://v2.api.squidrouter.com",
              }}
            />
          </div>
        )}
      </div>

      {/* Bridge Information */}
      <div className="p-5 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
        <h3 className="font-medium text-gray-900 dark:text-white mb-3">
          How to Bridge
        </h3>
        <div className="space-y-3">
          {[
            "Connect your wallet and ensure you're on the Celo network",
            "Select the 'Bridge' or 'Swap' tab in the widget",
            "Choose tokens and networks, then confirm the transaction",
          ].map((step, index) => (
            <div key={index} className="flex items-start gap-3">
              <div className="bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mt-0.5">
                {index + 1}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300">{step}</p>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
