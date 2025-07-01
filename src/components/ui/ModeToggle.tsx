"use client";

import { useChain } from "~/components/providers/ChainContext";

export default function ModeToggle() {
  const { mode, toggleMode } = useChain();
  return (
    <button
      onClick={toggleMode}
      className="px-2 py-1 text-xs font-medium rounded-full border"
    >
      {mode === "celo" ? "Celo" : "Degen"}
    </button>
  );
}
