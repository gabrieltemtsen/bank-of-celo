"use client";

import React, { useState, useEffect, useCallback, useContext } from "react";

interface CashbackContextProps {
  optedIn: boolean;
  cashback: number;
  optIn: () => void;
  addCashback: (amount: number) => void;
  claim: () => void;
}

const CashbackContext = React.createContext<CashbackContextProps | undefined>(
  undefined,
);

export const useCashback = () => {
  const ctx = useContext(CashbackContext);
  if (!ctx) {
    throw new Error("useCashback must be used within CashbackProvider");
  }
  return ctx;
};

export function CashbackProvider({ children }: { children: React.ReactNode }) {
  const [optedIn, setOptedIn] = useState(false);
  const [cashback, setCashback] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const storedOpt = localStorage.getItem("cashbackOptIn");
    const storedBal = localStorage.getItem("cashbackBalance");
    setOptedIn(storedOpt === "true");
    setCashback(storedBal ? parseFloat(storedBal) : 0);
  }, []);

  const persist = useCallback((opt: boolean, bal: number) => {
    if (typeof window === "undefined") return;
    localStorage.setItem("cashbackOptIn", String(opt));
    localStorage.setItem("cashbackBalance", bal.toString());
  }, []);

  const optIn = useCallback(() => {
    setOptedIn(true);
    persist(true, cashback);
  }, [persist, cashback]);

  const addCashback = useCallback(
    (amount: number) => {
      setCashback((prev) => {
        const val = prev + amount;
        persist(true, val);
        return val;
      });
    },
    [persist],
  );

  const claim = useCallback(() => {
    setCashback(0);
    persist(true, 0);
  }, [persist]);

  const value = { optedIn, cashback, optIn, addCashback, claim };

  return (
    <CashbackContext.Provider value={value}>{children}</CashbackContext.Provider>
  );
}
