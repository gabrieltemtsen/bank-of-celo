import { motion } from "framer-motion";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  isLoading?: boolean;
  variant?: "primary" | "secondary" | "glass";
}

export function Button({
  children,
  className = "",
  isLoading = false,
  variant = "primary",
  ...props
}: ButtonProps) {
  const getButtonStyles = () => {
    switch (variant) {
      case "secondary":
        return "btn-secondary";
      case "glass":
        return "glass-card hover-lift";
      default:
        return "btn-primary";
    }
  };

  return (
    <motion.button
      className={`${getButtonStyles()} transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      style={{
        background: variant === "primary" ? `var(--gradient-primary)` : 
                   variant === "secondary" ? `var(--surface)` :
                   `var(--glass-bg)`,
        color: variant === "primary" ? "white" : `var(--foreground)`,
        border: variant !== "primary" ? `1px solid var(--border)` : "none",
        boxShadow: variant === "primary" ? `var(--glow-primary)` : 
                  variant === "glass" ? `var(--glass-shadow)` : 
                  `var(--shadow)`,
      }}
      whileHover={{ 
        scale: 1.02,
        y: -1,
      }}
      whileTap={{ scale: 0.98 }}
      {...props}
    >
      {isLoading ? (
        <div className="flex items-center justify-center">
          <motion.div 
            className="h-5 w-5 border-2 border-white border-t-transparent rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
        </div>
      ) : (
        children
      )}
    </motion.button>
  );
}
