/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, PiggyBank, Info, Calculator } from "lucide-react";
import { toast } from "sonner";
import { useChainMode } from "~/app/chain-mode/context";

interface SavingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  vaultBalance: string;
  isCorrectChain: boolean;
}

export default function SavingsModal({
  isOpen,
  onClose,
  vaultBalance,
  isCorrectChain,
}: SavingsModalProps) {
  const [depositAmount, setDepositAmount] = useState("");
  const [selectedTerm, setSelectedTerm] = useState("flexible");
  const [isLoading, setIsLoading] = useState(false);
  const [isReady, setIsReady] = useState(false); // Added isReady state cause the feature is not ready yet
  const { mode } = useChainMode();
  const currency = mode === "degen" ? "DEGEN" : "CELO";

  const savingsPlans = [
    {
      id: "flexible",
      name: "Flexible Savings",
      apy: "6.5%",
      minDeposit: mode === "degen" ? "5000 DEGEN" : "10 CELO",
      withdrawal: "Anytime",
      description: "Earn interest with full flexibility",
      color: "emerald",
    },
    {
      id: "30day",
      name: "30-Day Lock",
      apy: "8.5%",
      minDeposit: mode === "degen" ? "50000 DEGEN" : "100 CELO",
      withdrawal: "After 30 days",
      description: "Higher returns for short-term commitment",
      color: "blue",
    },
    {
      id: "90day",
      name: "90-Day Lock",
      apy: "12.0%",
      minDeposit: mode === "degen" ? "250000 DEGEN" : "500 CELO",
      withdrawal: "After 90 days",
      description: "Maximum returns for patient savers",
      color: "purple",
    },
  ];

  const selectedPlan = savingsPlans.find((plan) => plan.id === selectedTerm);

  const calculateEarnings = () => {
    if (!depositAmount || !selectedPlan) return "0";
    const amount = parseFloat(depositAmount);
    const apy = parseFloat(selectedPlan.apy) / 100;
    const monthlyReturn = (amount * apy) / 12;
    return monthlyReturn.toFixed(2);
  };

  const handleDeposit = async () => {
    if (!isCorrectChain) {
      alert(`Please switch to ${mode === "degen" ? "Base" : "Celo"} Network`);
      return;
    }

    setIsLoading(true);
    try {
      // Simulate deposit transaction
      await new Promise((resolve) => setTimeout(resolve, 2000));
      toast.success(
        `Successfully deposited ${depositAmount} ${currency} to ${selectedPlan?.name}`,
      );
      setDepositAmount("");
      onClose();
    } catch (error) {
      console.log(error);
      toast.success("Deposit failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 500 }}
            className="bg-white rounded-t-3xl w-full max-w-md max-h-[90vh] overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center mr-3">
                  <PiggyBank className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Savings Account
                  </h2>
                  <p className="text-sm text-gray-500">
                    Start earning interest today
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
              >
                <X className="w-4 h-4 text-gray-600" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
              {!isReady ? (
                <div className="text-center py-10">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 mb-6">
                    <h3 className="text-xl font-bold text-yellow-800 mb-2">
                      Coming Soon!
                    </h3>
                    <p className="text-yellow-700">
                      We are working hard to bring you this feature. Our savings
                      contracts are currently in development and will be
                      available soon.
                    </p>
                  </div>
                  <button
                    onClick={onClose}
                    className="w-full py-3 px-4 rounded-xl font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
                  >
                    Got it
                  </button>
                </div>
              ) : (
                <>
                  {/* Savings Plans */}
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Choose Your Plan
                    </h3>
                    <div className="space-y-3">
                      {savingsPlans.map((plan) => (
                        <motion.div
                          key={plan.id}
                          whileTap={{ scale: 0.98 }}
                          className={`border-2 rounded-xl p-4 cursor-pointer transition-all ${
                            selectedTerm === plan.id
                              ? `border-${plan.color}-500 bg-${plan.color}-50`
                              : "border-gray-200 bg-white hover:border-gray-300"
                          }`}
                          onClick={() => setSelectedTerm(plan.id)}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-semibold text-gray-900">
                              {plan.name}
                            </h4>
                            <span
                              className={`text-lg font-bold ${
                                selectedTerm === plan.id
                                  ? `text-${plan.color}-600`
                                  : "text-gray-900"
                              }`}
                            >
                              {plan.apy}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">
                            {plan.description}
                          </p>
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <span>Min: {plan.minDeposit}</span>
                            <span>Withdrawal: {plan.withdrawal}</span>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {/* Deposit Amount */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Deposit Amount
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={depositAmount}
                        onChange={(e) => setDepositAmount(e.target.value)}
                        placeholder={`Enter amount in ${currency}`}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none pr-16"
                      />
                      <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                        {currency}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Available Balance: {vaultBalance} {currency}
                    </p>
                  </div>

                  {/* Earnings Calculator */}
                  {depositAmount && selectedPlan && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="bg-gradient-to-r from-emerald-50 to-emerald-100 rounded-xl p-4 mb-6"
                    >
                      <div className="flex items-center mb-3">
                        <Calculator className="w-5 h-5 text-emerald-600 mr-2" />
                        <h4 className="font-semibold text-emerald-800">
                          Estimated Earnings
                        </h4>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-emerald-600 mb-1">
                            Monthly Interest
                          </p>
                          <p className="text-lg font-bold text-emerald-800">
                            {calculateEarnings()} {currency}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-emerald-600 mb-1">
                            Annual Yield
                          </p>
                          <p className="text-lg font-bold text-emerald-800">
                            {selectedPlan.apy}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Information */}
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
                    <div className="flex items-start">
                      <Info className="w-5 h-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-blue-800 mb-2">
                          Important Information
                        </p>
                        <ul className="text-xs text-blue-700 space-y-1">
                          <li>
                            • Interest is compounded daily and paid monthly
                          </li>
                          <li>
                            • Early withdrawal may incur penalties for locked
                            terms
                          </li>
                          <li>• All deposits are secured by smart contracts</li>
                          <li>• Minimum deposit requirements apply</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-3">
                    <button
                      onClick={handleDeposit}
                      disabled={!depositAmount || isLoading || !isCorrectChain}
                      className={`w-full py-3 px-4 rounded-xl font-semibold text-white transition-all ${
                        !depositAmount || isLoading || !isCorrectChain
                          ? "bg-gray-300 cursor-not-allowed"
                          : "bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-lg hover:shadow-xl"
                      }`}
                    >
                      {isLoading ? (
                        <div className="flex items-center justify-center">
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                          Processing...
                        </div>
                      ) : (
                        <div className="flex items-center justify-center">
                          <PiggyBank className="w-5 h-5 mr-2" />
                          Start Saving
                        </div>
                      )}
                    </button>

                    <button
                      onClick={onClose}
                      className="w-full py-3 px-4 rounded-xl font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
