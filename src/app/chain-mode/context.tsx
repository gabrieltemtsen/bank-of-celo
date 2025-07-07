"use client";
import React, { createContext, useContext, useEffect, useState } from "react";
import { toast } from "sonner";
import { DEGEN_DEV_MODE } from "~/lib/constants";

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

  useEffect(() => {
    if (DEGEN_DEV_MODE && mode === "degen") {
      toast.info("Degen mode is in development.");
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
  if (!ctx) {
    // Return default values or handle the case where provider isn't available
    return {
      mode: "celo" as Mode,
      toggleMode: () => console.warn("ChainModeProvider not available"),
      setMode: () => console.warn("ChainModeProvider not available"),
    };
  }
  return ctx;
}