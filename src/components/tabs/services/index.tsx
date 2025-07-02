import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  PiggyBank,
  CreditCard,
  TrendingUp,
  Shield,
  ArrowRight,
  Percent,
  Calculator,
  Banknote,
} from "lucide-react";
import { useChainMode } from "~/app/chain-mode/context";
import SavingsModal from "./savings";
import LoansModal from "./loan";

interface ServiceCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  features: string[];
  onClick: () => void;
  gradient: string;
  iconBg: string;
}

const ServiceCard: React.FC<ServiceCardProps> = ({
  title,
  description,
  icon,
  features,
  onClick,
  gradient,
  iconBg,
}) => (
  <motion.div
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    className={`relative overflow-hidden rounded-2xl p-6 cursor-pointer ${gradient} shadow-lg`}
    onClick={onClick}
  >
    <div className="relative z-10">
      <div
        className={`w-12 h-12 ${iconBg} rounded-xl flex items-center justify-center mb-4`}
      >
        {icon}
      </div>

      <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
      <p className="text-white/80 text-sm mb-4">{description}</p>

      <div className="space-y-2 mb-4">
        {features.map((feature, index) => (
          <div key={index} className="flex items-center text-white/90 text-xs">
            <div className="w-1.5 h-1.5 bg-white/60 rounded-full mr-2" />
            {feature}
          </div>
        ))}
      </div>

      <div className="flex items-center text-white font-medium text-sm">
        Learn More
        <ArrowRight className="w-4 h-4 ml-1" />
      </div>
    </div>

    {/* Background Pattern */}
    <div className="absolute top-0 right-0 w-32 h-32 opacity-10">
      <div className="w-full h-full bg-white rounded-full transform translate-x-8 -translate-y-8" />
    </div>
  </motion.div>
);

interface ServicesTabProps {
  vaultBalance: string;
  isCorrectChain: boolean;
}

export default function ServicesTab({
  vaultBalance,
  isCorrectChain,
}: ServicesTabProps) {
  const { mode } = useChainMode();
  const isDegen = mode === "degen";
  
  const [activeSavingsModal, setSavingsModal] = useState(false);
  const [activeLoansModal, setLoansModal] = useState(false);

  const savingsFeatures = [
    "Up to 12% APY on deposits",
    "Instant withdrawals available",
    "No minimum balance required",
    "Compound interest daily",
  ];

  const loansFeatures = [
    "Competitive interest rates",
    "Flexible repayment terms",
    "Quick approval process",
    "Collateral-backed loans",
  ];

  // Dynamic colors based on mode
  // const primaryColor = isDegen ? "purple" : "emerald";
  // const secondaryColor = isDegen ? "pink" : "blue";
  
  // Background gradients
  const backgroundGradient = isDegen
    ? "from-purple-50 via-white to-pink-50"
    : "from-emerald-50 via-white to-blue-50";
  
  const headerGradient = isDegen
    ? "from-purple-500/5 to-transparent"
    : "from-emerald-500/5 to-transparent";

  // Service card gradients
  const savingsGradient = isDegen
    ? "bg-gradient-to-br from-purple-500 to-purple-600"
    : "bg-gradient-to-br from-emerald-500 to-emerald-600";
  
  const loansGradient = isDegen
    ? "bg-gradient-to-br from-pink-500 to-pink-600"
    : "bg-gradient-to-br from-blue-500 to-blue-600";

  // Icon colors
  const savingsIconColor = isDegen ? "text-purple-600" : "text-emerald-600";
  const loansIconColor = isDegen ? "text-pink-600" : "text-blue-600";
  
  // Stats colors
  const trendingColor = isDegen ? "text-purple-600" : "text-emerald-600";
  const shieldColor = isDegen ? "text-pink-600" : "text-blue-600";
  
  // Quick calculator colors
  const percentColor = isDegen ? "text-purple-600" : "text-emerald-600";
  const banknoteColor = isDegen ? "text-pink-600" : "text-blue-600";

  // Security notice colors
  const securityBg = isDegen ? "bg-purple-50" : "bg-amber-50";
  const securityBorder = isDegen ? "border-purple-200" : "border-amber-200";
  const securityIconColor = isDegen ? "text-purple-600" : "text-amber-600";
  const securityTextColor = isDegen ? "text-purple-800" : "text-amber-800";
  const securitySubTextColor = isDegen ? "text-purple-700" : "text-amber-700";

  return (
    <div className="min-h-screen bg-white text-gray-900 rounded-md relative overflow-hidden">
      {/* Background gradient */}
      <div className={`absolute inset-0 bg-gradient-to-br ${backgroundGradient}`} />
      <div className={`absolute top-0 left-0 w-full h-64 bg-gradient-to-b ${headerGradient}`} />

      <div className="relative z-1 p-6 pb-32">
        {/* Header */}
        <div className="mb-8">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl font-bold text-gray-900 mb-2"
          >
            Financial Services
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-gray-600 text-sm"
          >
            Grow your wealth with our savings and lending solutions
          </motion.p>
        </div>

        {/* Stats Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-2 gap-4 mb-8"
        >
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className={`w-5 h-5 ${trendingColor}`} />
              <span className={`text-xs ${trendingColor} font-medium`}>
                +5.2%
              </span>
            </div>
            <p className="text-xs text-gray-500 mb-1">Current APY</p>
            <p className="text-lg font-bold text-gray-900">8.5%</p>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <Shield className={`w-5 h-5 ${shieldColor}`} />
              <span className={`text-xs ${shieldColor} font-medium`}>Insured</span>
            </div>
            <p className="text-xs text-gray-500 mb-1">Total Secured</p>
            <p className="text-lg font-bold text-gray-900">$2.1M</p>
          </div>
        </motion.div>

        {/* Service Cards */}
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <ServiceCard
              title="Savings Account"
              description="Earn competitive interest on your crypto deposits with flexible terms"
              icon={<PiggyBank className={`w-6 h-6 ${savingsIconColor}`} />}
              features={savingsFeatures}
              onClick={() => setSavingsModal(true)}
              gradient={savingsGradient}
              iconBg="bg-white/20"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <ServiceCard
              title="Crypto Loans"
              description="Access instant liquidity without selling your crypto assets"
              icon={<CreditCard className={`w-6 h-6 ${loansIconColor}`} />}
              features={loansFeatures}
              onClick={() => setLoansModal(true)}
              gradient={loansGradient}
              iconBg="bg-white/20"
            />
          </motion.div>
        </div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-8 bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl p-6 border border-gray-200"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Calculator className="w-5 h-5 mr-2 text-gray-700" />
            Quick Calculator
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <Percent className={`w-6 h-6 ${percentColor} mx-auto mb-2`} />
                <p className="text-xs text-gray-500 mb-1">Monthly Interest</p>
                <p className={`text-lg font-bold ${percentColor}`}>$127.50</p>
                <p className="text-xs text-gray-400">On $18,000 deposit</p>
              </div>
            </div>

            <div className="text-center">
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <Banknote className={`w-6 h-6 ${banknoteColor} mx-auto mb-2`} />
                <p className="text-xs text-gray-500 mb-1">Available Credit</p>
                <p className={`text-lg font-bold ${banknoteColor}`}>$12,600</p>
                <p className="text-xs text-gray-400">70% of collateral</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Security Notice */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className={`mt-6 ${securityBg} border ${securityBorder} rounded-xl p-4`}
        >
          <div className="flex items-start">
            <Shield className={`w-5 h-5 ${securityIconColor} mr-3 mt-0.5 flex-shrink-0`} />
            <div>
              <p className={`text-sm font-medium ${securityTextColor} mb-1`}>
                Secured by Smart Contracts
              </p>
              <p className={`text-xs ${securitySubTextColor}`}>
                All funds are protected by audited smart contracts and backed by
                over-collateralization.
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Modals */}
      <SavingsModal
        isOpen={activeSavingsModal}
        onClose={() => setSavingsModal(false)}
        vaultBalance={vaultBalance}
        isCorrectChain={isCorrectChain}
      />

      <LoansModal
        isOpen={activeLoansModal}
        onClose={() => setLoansModal(false)}
        vaultBalance={vaultBalance}
        isCorrectChain={isCorrectChain}
      />
    </div>
  );
}