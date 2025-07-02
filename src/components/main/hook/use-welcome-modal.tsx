import { useCallback, useState } from "react";

export function useWelcomeModal() {
  const [showWelcome, setShowWelcome] = useState(() => {
    if (typeof window !== "undefined") {
      return !localStorage.getItem("hasSeenWelcome");
    }
    return false;
  });

  const handleCloseWelcome = useCallback(() => {
    setShowWelcome(false);
    if (typeof window !== "undefined") {
      localStorage.setItem("hasSeenWelcome", "true");
    }

    // Check if we should navigate to rewards tab after closing welcome
    const urlParams = new URLSearchParams(window.location.search);
    const tabParam = urlParams.get("tab");

    if (tabParam === "rewards") {
      return "rewards";
    }
    return null;
  }, []);

  return {
    showWelcome,
    setShowWelcome,
    handleCloseWelcome,
  };
}
