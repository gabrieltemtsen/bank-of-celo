import { motion, AnimatePresence } from "framer-motion";
import HomeTab from "~/components/tabs/HomeTab";
import DonateTab from "~/components/tabs/DonateTab";
import JackpotsTab from "~/components/tabs/JackpotsTab";
import Rewards from "~/components/tabs/rewards";

interface VaultStatus {
  currentBalance: string;
  minReserve: string;
  availableForClaims: string;
}

interface TabContentProps {
  activeTab: string;
  vaultBalance: string;
  vaultStatus: VaultStatus;
  isLoading: boolean;
  maxClaim: string;
  claimCooldown: number;
  lastClaimAt: number;
  isCorrectChain: boolean;
  isPending: boolean;
  onNavigate: (tab: string) => void;
}

export default function TabContent({
  activeTab,
  vaultBalance,
  vaultStatus,
  isLoading,
  maxClaim,
  claimCooldown,
  lastClaimAt,
  isCorrectChain,
  isPending,
  onNavigate,
}: TabContentProps) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
      >
        {activeTab === "home" && (
          <HomeTab
            vaultBalance={vaultBalance}
            vaultStatus={vaultStatus}
            isLoading={isLoading}
            onNavigate={onNavigate}
            maxClaim={maxClaim}
            claimCooldown={claimCooldown}
            lastClaimAt={lastClaimAt}
            isCorrectChain={isCorrectChain}
          />
        )}
        {activeTab === "donate" && (
          <DonateTab
            isCorrectChain={isCorrectChain}
            isPending={isPending}
          />
        )}
        {activeTab === "jackpots" && (
          <JackpotsTab
            isCorrectChain={isCorrectChain}
          />
        )}
        {activeTab === "rewards" && <Rewards />}
      </motion.div>
    </AnimatePresence>
  );
}
