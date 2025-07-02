import { Trophy, Sparkles, Gift } from "lucide-react";
import { Button } from "~/components/ui/Button";
import { motion } from "framer-motion";
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
      <DialogContent 
        className="glass-card-lg max-w-lg mx-4 p-0 border-0 overflow-hidden"
        style={{
          background: `var(--surface)`,
          border: `1px solid var(--glass-border)`,
          boxShadow: `var(--shadow-xl)`,
        }}
      >
        {/* Animated Background */}
        <motion.div
          className="absolute inset-0 opacity-10"
          style={{ background: `var(--gradient-primary)` }}
          animate={{
            opacity: [0.05, 0.15, 0.05],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        
        {/* Floating Elements */}
        <motion.div
          className="absolute top-4 right-4 opacity-20"
          animate={{
            y: [0, -10, 0],
            rotate: [0, 5, -5, 0],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <Sparkles 
            className="w-6 h-6" 
            style={{ color: `var(--primary)` }}
          />
        </motion.div>
        
        <motion.div
          className="absolute bottom-6 left-6 opacity-15"
          animate={{
            y: [0, 8, 0],
            rotate: [0, -3, 3, 0],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1,
          }}
        >
          <Gift 
            className="w-5 h-5" 
            style={{ color: `var(--secondary)` }}
          />
        </motion.div>

        <DialogHeader className="relative z-10 p-8 pb-6">
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ 
              duration: 0.6, 
              type: "spring", 
              stiffness: 300,
              delay: 0.2 
            }}
            className="flex justify-center mb-6"
          >
            <motion.div
              className="p-4 rounded-3xl relative"
              style={{ 
                background: `var(--gradient-primary)`,
                boxShadow: `var(--glow-primary)`,
              }}
              whileHover={{ 
                scale: 1.1,
                rotate: [0, 5, -5, 0],
              }}
              transition={{ duration: 0.4 }}
            >
              <Trophy className="w-10 h-10 text-white" />
              
              {/* Sparkle effects */}
              {[...Array(3)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-1 h-1 bg-white rounded-full"
                  style={{
                    top: `${20 + i * 15}%`,
                    right: `${10 + i * 20}%`,
                  }}
                  animate={{
                    scale: [0, 1, 0],
                    opacity: [0, 1, 0],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    delay: i * 0.5,
                  }}
                />
              ))}
            </motion.div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            <DialogTitle 
              className="text-3xl font-bold text-center mb-4 gradient-text"
              style={{ 
                background: `var(--gradient-primary)`, 
                WebkitBackgroundClip: 'text', 
                WebkitTextFillColor: 'transparent' 
              }}
            >
              Welcome to Bank of {mode === "degen" ? "Degen" : "Celo"}!
            </DialogTitle>
            
            <DialogDescription 
              className="text-center text-base leading-relaxed font-medium"
              style={{ color: `var(--foreground-secondary)` }}
            >
              The decentralized vault supporting the{" "}
              <span 
                className="font-bold"
                style={{ color: `var(--primary)` }}
              >
                {mode === "degen" ? "Degen" : "Celo"}
              </span>{" "}
              ecosystem. Donate to help grow the community or claim{" "}
              <span 
                className="font-bold"
                style={{ color: `var(--secondary)` }}
              >
                {dynamicMaxClaim} {currency}
              </span>{" "}
              to explore decentralized finance. Swap tokens seamlessly or check the
              leaderboard to see top contributors!
            </DialogDescription>
          </motion.div>
        </DialogHeader>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="relative z-10 p-8 pt-0"
        >
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button
              onClick={onClose}
              className="w-full py-4 text-lg font-bold rounded-2xl"
              style={{
                background: `var(--gradient-primary)`,
                boxShadow: `var(--glow-primary)`,
              }}
            >
              <motion.span
                className="flex items-center justify-center gap-3"
                animate={{
                  x: [0, 2, 0],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                Get Started
                <motion.div
                  animate={{ rotate: [0, 15, -15, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <Sparkles className="w-5 h-5" />
                </motion.div>
              </motion.span>
            </Button>
          </motion.div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
