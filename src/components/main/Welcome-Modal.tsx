import { Trophy } from "lucide-react";
import { Button } from "~/components/ui/Button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "~/components/ui/dialog";

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
  return (
    <Dialog open={showWelcome} onOpenChange={onClose}>
      <DialogContent className="bg-white dark:bg-gray-900 rounded-2xl border-0 shadow-xl p-6 max-w-md">
        <DialogHeader>
          <div className="flex justify-center mb-4">
          <div className="p-3 rounded-full bg-[var(--primary)]/20">
            <Trophy className="w-8 h-8" style={{ color: "var(--primary)" }} />
          </div>
          </div>
          <DialogTitle className="text-2xl font-bold text-center text-gray-900 dark:text-white">
            Welcome to Bank of Celo!
          </DialogTitle>
          <DialogDescription className="text-center text-gray-600 dark:text-gray-300 mt-2">
            The decentralized vault supporting the Celo ecosystem. Donate to
            help grow the community or claim {maxClaim} CELO to explore
            decentralized finance. Swap tokens seamlessly or check the
            leaderboard to see top contributors!
          </DialogDescription>
        </DialogHeader>
        <div className="mt-6 flex flex-col gap-3">
          <Button
            onClick={onClose}
            className="w-full bg-gradient-to-r from-[var(--gradient-from)] to-[var(--gradient-to)] hover:opacity-90 text-white rounded-lg py-3 shadow-md"
          >
            Get Started
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
