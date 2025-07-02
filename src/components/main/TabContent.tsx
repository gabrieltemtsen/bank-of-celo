import { motion, AnimatePresence } from "framer-motion";
import HomeTab from "~/components/tabs/HomeTab";
import TransactTab from "~/components/tabs/TransactTab";
import Rewards from "~/components/tabs/rewards";
import ServicesTab from "../tabs/services";

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
  onDonate: (amount: string) => Promise<void>;
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
  onDonate,
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
        {activeTab === "transact" && (
          <TransactTab
            vaultBalance={vaultBalance}
            onDonate={onDonate}
            maxClaim={maxClaim}
            availableForClaim={vaultStatus.availableForClaims}
            claimCooldown={claimCooldown}
            lastClaimAt={lastClaimAt}
            isCorrectChain={isCorrectChain}
            isPending={isPending}
          />
        )}
        {activeTab === "services" && (
          <ServicesTab
            vaultBalance={vaultBalance}
            isCorrectChain={isCorrectChain}
          />
        )}
        {activeTab === "rewards" && <Rewards />}
      </motion.div>
    </AnimatePresence>
  );
}
