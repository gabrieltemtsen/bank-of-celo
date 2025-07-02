import { motion } from "framer-motion";
import { Home, Send, Trophy, Briefcase } from "lucide-react";

interface BottomNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const tabs = [
  { id: "home", icon: <Home className="w-5 h-5" />, label: "Home" },
  { id: "transact", icon: <Send className="w-5 h-5" />, label: "Transact" },
  {
    id: "services",
    icon: <Briefcase className="w-5 h-5" />,
    label: "Services",
  },
  { id: "rewards", icon: <Trophy className="w-5 h-5" />, label: "Rewards" },
];

export default function BottomNavigation({
  activeTab,
  onTabChange,
}: BottomNavigationProps) {
  return (
    <motion.nav
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, type: "spring", stiffness: 300, damping: 25 }}
      className="fixed bottom-0 left-0 right-0 z-50 glass-card backdrop-blur-xl border-t border-glass-border flex justify-around p-2"
      style={{
        background: `var(--glass-bg)`,
        borderColor: `var(--glass-border)`,
        boxShadow: `var(--shadow-xl)`,
      }}
    >
      {tabs.map((tab, index) => (
        <motion.button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className="relative flex flex-col items-center p-3 rounded-2xl min-w-[70px] group"
          style={{
            background: activeTab === tab.id ? `var(--gradient-primary)` : 'transparent',
            boxShadow: activeTab === tab.id ? `var(--glow-primary)` : 'none',
          }}
          whileHover={{ 
            scale: 1.05,
            y: -2,
          }}
          whileTap={{ scale: 0.95 }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1, duration: 0.3 }}
          aria-label={tab.label}
        >
          <motion.div
            className="mb-1 relative z-10"
            animate={{
              scale: activeTab === tab.id ? 1.1 : 1,
              rotate: activeTab === tab.id ? [0, 3, -3, 0] : 0,
            }}
            transition={{ duration: 0.4 }}
            style={{
              color: activeTab === tab.id ? 'white' : `var(--foreground)`,
              filter: activeTab === tab.id ? 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))' : 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))',
            }}
          >
            {tab.icon}
          </motion.div>
          <motion.span 
            className="text-2xs font-bold relative z-10"
            style={{
              color: activeTab === tab.id ? 'white' : `var(--foreground)`,
              textShadow: activeTab === tab.id ? '0 2px 4px rgba(0,0,0,0.6)' : '0 1px 2px rgba(0,0,0,0.4)',
            }}
            animate={{
              opacity: activeTab === tab.id ? 1 : 0.9,
            }}
          >
            {tab.label}
          </motion.span>
          
          {activeTab === tab.id && (
            <motion.div
              layoutId="activeTabIndicator"
              className="absolute -bottom-1 w-12 h-1 rounded-full"
              style={{ 
                background: `var(--secondary)`,
                boxShadow: `0 0 8px var(--secondary)`,
              }}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, type: "spring", stiffness: 400 }}
            />
          )}
        </motion.button>
      ))}
    </motion.nav>
  );
}
