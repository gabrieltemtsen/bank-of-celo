"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { celo, base, type Chain } from "wagmi/chains";

export type ChainMode = "celo" | "degen";

interface ChainContextValue {
  mode: ChainMode;
  chain: Chain;
  toggleMode: () => void;
}

const ChainContext = createContext<ChainContextValue | undefined>(undefined);

export function ChainProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<ChainMode>("celo");

  useEffect(() => {
    const stored = window.localStorage.getItem("chainMode");
    if (stored === "degen" || stored === "celo") {
      setMode(stored);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem("chainMode", mode);
  }, [mode]);

  const toggleMode = () => setMode((m) => (m === "celo" ? "degen" : "celo"));

  const chain = mode === "celo" ? celo : base;

  return (
    <ChainContext.Provider value={{ mode, chain, toggleMode }}>
      {children}
    </ChainContext.Provider>
  );
}

export function useChain() {
  const ctx = useContext(ChainContext);
  if (!ctx) throw new Error("useChain must be used within ChainProvider");
  return ctx;
}
