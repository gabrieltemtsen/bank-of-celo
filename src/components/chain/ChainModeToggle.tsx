"use client";
import { useSwitchChain, useChainId } from "wagmi";
import { base } from "wagmi/chains";
import { celo } from "wagmi/chains";
import { useChainMode } from "~/app/chain-mode/context";

export default function ChainModeToggle() {
  const { mode, toggleMode } = useChainMode();
  const { switchChain } = useSwitchChain();
  const chainId = useChainId();

  const handleToggle = () => {
    const next = mode === "celo" ? "degen" : "celo";
    toggleMode();
    const target = next === "degen" ? base : celo;
    if (chainId !== target.id) {
      try {
        switchChain({ chainId: target.id });
      } catch (err) {
        console.error("Failed to switch chain", err);
      }
    }
  };

  return (
    <button
      onClick={handleToggle}
      className="text-xs px-2 py-1 rounded-full border border-gray-300 dark:border-gray-600"
    >
      {mode === "celo" ? "Celo Mode" : "Degen Mode"}
    </button>
  );
}
