import { motion } from "framer-motion";
import { Home, Sparkles } from "lucide-react";

interface LoadingSpinnerProps {
  isSDKLoading?: boolean;
  size?: "sm" | "md" | "lg";
  message?: string;
}

export default function LoadingSpinner({
  isSDKLoading = false,
  size = "md",
  message,
}: LoadingSpinnerProps) {
  const sizes = {
    sm: { spinner: "w-6 h-6", icon: "w-8 h-8" },
    md: { spinner: "w-8 h-8", icon: "w-12 h-12" },
    lg: { spinner: "w-12 h-12", icon: "w-16 h-16" },
  };

  if (isSDKLoading) {
    return (
      <div 
        className="flex flex-col items-center justify-center min-h-screen relative overflow-hidden"
        style={{ background: `var(--background)` }}
      >
        {/* Animated background */}
        <motion.div
          className="absolute inset-0 opacity-5"
          style={{ background: `var(--gradient-primary)` }}
          animate={{
            opacity: [0.02, 0.08, 0.02],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        
        {/* Floating elements */}
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute opacity-10"
            style={{
              left: `${20 + i * 15}%`,
              top: `${30 + i * 8}%`,
            }}
            animate={{
              y: [0, -20, 0],
              x: [0, 10, 0],
              rotate: [0, 180, 360],
            }}
            transition={{
              duration: 4 + i,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.5,
            }}
          >
            <Sparkles 
              className="w-4 h-4" 
              style={{ color: `var(--primary)` }}
            />
          </motion.div>
        ))}

        <motion.div
          className="relative flex flex-col items-center"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, type: "spring", stiffness: 300 }}
        >
          <motion.div
            animate={{ 
              rotate: [0, 360],
              scale: [1, 1.1, 1],
            }}
            transition={{ 
              rotate: { repeat: Infinity, duration: 2, ease: "linear" },
              scale: { repeat: Infinity, duration: 1.5, ease: "easeInOut" },
            }}
            className="mb-6 p-4 rounded-3xl"
            style={{ 
              background: `var(--gradient-primary)`,
              boxShadow: `var(--glow-primary)`,
            }}
          >
            <Home className={`${sizes.lg.icon} text-white`} />
          </motion.div>
          
          <motion.div
            className="text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            <h2 
              className="text-2xl font-bold mb-2 gradient-text"
              style={{ 
                background: `var(--gradient-primary)`, 
                WebkitBackgroundClip: 'text', 
                WebkitTextFillColor: 'transparent' 
              }}
            >
              Bank of Celo
            </h2>
            <p 
              className="text-base font-medium"
              style={{ color: `var(--foreground-secondary)` }}
            >
              {message || "Loading your DeFi experience..."}
            </p>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  return (
    <div 
      className="absolute inset-0 backdrop-blur-lg flex items-center justify-center z-20 rounded-xl"
      style={{ background: `rgba(var(--background), 0.8)` }}
    >
      <motion.div
        className="flex flex-col items-center"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className={`${sizes[size].spinner} border-4 border-t-transparent rounded-full mb-3`}
          style={{ borderColor: `var(--primary)`, borderTopColor: 'transparent' }}
        />
        
        {message && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-sm font-medium text-center"
            style={{ color: `var(--foreground-secondary)` }}
          >
            {message}
          </motion.p>
        )}
      </motion.div>
    </div>
  );
}
