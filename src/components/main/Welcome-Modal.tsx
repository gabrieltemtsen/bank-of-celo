import { Trophy } from "lucide-react";
import { Button } from "~/components/ui/Button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "~/components/ui/dialog";
import { useChainMode } from "~/app/chain-mode/context";

interface WelcomeModalProps {
  showWelcome: boolean;
  maxClaim: string;
  onClose: () => void;
}

export default function WelcomeModal({
  showWelcome,
  maxClaim,
  onClose,
}: WelcomeModalProps) {
  const { mode } = useChainMode();
  const currency = mode === "degen" ? "DEGEN" : "CELO";
  const dynamicMaxClaim = mode === "degen" ? "250" : maxClaim;

  return (
    <Dialog open={showWelcome} onOpenChange={onClose}>
      <DialogContent className="bg-white dark:bg-gray-900 rounded-2xl border-0 shadow-xl p-6 max-w-md">
        <DialogHeader>
          <div className="flex justify-center mb-4">
            <div className="bg-emerald-100 dark:bg-emerald-900 p-3 rounded-full">
              <Trophy className="w-8 h-8 text-emerald-600 dark:text-emerald-300" />
            </div>
          </div>
          <DialogTitle className="text-2xl font-bold text-center text-gray-900 dark:text-white">
            Welcome to Bank of {mode === "degen" ? "Degen" : "Celo"}!
          </DialogTitle>
          <DialogDescription className="text-center text-gray-600 dark:text-gray-300 mt-2">
            The decentralized vault supporting the {mode === "degen" ? "Degen" : "Celo"} ecosystem. Donate to
            help grow the community or claim {dynamicMaxClaim} {currency} to explore
            decentralized finance. Swap tokens seamlessly or check the
            leaderboard to see top contributors!
          </DialogDescription>
        </DialogHeader>
        <div className="mt-6 flex flex-col gap-3">
          <Button
            onClick={onClose}
            className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white rounded-lg py-3 shadow-md"
          >
            Get Started
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
