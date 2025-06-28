"use client";
import React, { createContext, useContext, useEffect, useState } from "react";

type Mode = "celo" | "degen";

interface ChainModeContextValue {
  mode: Mode;
  toggleMode: () => void;
  setMode: (m: Mode) => void;
}

const ChainModeContext = createContext<ChainModeContextValue | undefined>(undefined);

export function ChainModeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<Mode>("celo");

  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem("chainMode") : null;
    if (stored === "celo" || stored === "degen") setModeState(stored);
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("chainMode", mode);
      document.documentElement.classList.toggle("degen-mode", mode === "degen");
      document.documentElement.classList.toggle("celo-mode", mode === "celo");
    }
  }, [mode]);

  const setMode = (m: Mode) => setModeState(m);
  const toggleMode = () => setModeState((p) => (p === "celo" ? "degen" : "celo"));

  return (
    <ChainModeContext.Provider value={{ mode, toggleMode, setMode }}>
      {children}
    </ChainModeContext.Provider>
  );
}

export function useChainMode() {
  const ctx = useContext(ChainModeContext);
  if (!ctx) throw new Error("useChainMode must be used within ChainModeProvider");
  return ctx;
}
