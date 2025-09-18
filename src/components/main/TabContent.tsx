import { motion, AnimatePresence } from "framer-motion";
import { useChainMode } from "~/app/chain-mode/context";
import { cn } from "~/lib/utils";
import HomeTab from "~/components/tabs/HomeTab";
import TransactTab from "~/components/tabs/TransactTab";
import FxTab from "~/components/tabs/FxTab";
import Rewards from "~/components/tabs/rewards";
// import ServicesTab from "../tabs/services";
import JackPot from "../tabs/JackPot";

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
  const { mode } = useChainMode();
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
      >
        <div className={cn(mode === "celo" ? "panel p-4 md:p-6 border-2 my-2" : "")}>
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
          {activeTab === "fx" && (
            <FxTab isCorrectChain={isCorrectChain} />
          )}
          {activeTab === "jackpot" && (
            <JackPot isCorrectChain={isCorrectChain} />
          )}
          {activeTab === "rewards" && <Rewards />}
        </div>
        {/* {activeTab === "services" && (
          <ServicesTab
            vaultBalance={vaultBalance}
            isCorrectChain={isCorrectChain}
          />
        )} */}
      </motion.div>
    </AnimatePresence>
  );
}
