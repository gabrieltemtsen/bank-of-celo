/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  CreditCard,
  Shield,
  Clock,
  DollarSign,
  AlertTriangle,
  Calculator,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import { useChainMode } from "~/app/chain-mode/context";

interface LoansModalProps {
  isOpen: boolean;
  onClose: () => void;
  vaultBalance: string;
  isCorrectChain: boolean;
}

export default function LoansModal({
  isOpen,
  onClose,
  vaultBalance,
  isCorrectChain,
}: LoansModalProps) {
  const [loanAmount, setLoanAmount] = useState("");
  const [collateralAmount, setCollateralAmount] = useState("");
  const [selectedTerm, setSelectedTerm] = useState("30");
  const [isLoading, setIsLoading] = useState(false);
  const [isReady, setIsReady] = useState(false); // Added isReady state
  const { mode } = useChainMode();
  const currency = mode === "degen" ? "DEGEN" : "CELO";

  const loanTerms = [
    {
      id: "30",
      name: "30 Days",
      interestRate: "8.5%",
      description: "Short-term liquidity",
      color: "blue",
    },
    {
      id: "90",
      name: "90 Days",
      interestRate: "12.0%",
      description: "Medium-term financing",
      color: "indigo",
    },
    {
      id: "180",
      name: "180 Days",
      interestRate: "18.0%",
      description: "Long-term capital",
      color: "purple",
    },
  ];

  const selectedTermData = loanTerms.find((term) => term.id === selectedTerm);

  const calculateLoanDetails = () => {
    if (!loanAmount || !selectedTermData) return null;

    const principal = parseFloat(loanAmount);
    const rate = parseFloat(selectedTermData.interestRate) / 100;
    const term = parseInt(selectedTerm) / 365; // Convert days to years
    const interest = principal * rate * term;
    const totalRepayment = principal + interest;
    const requiredCollateral = principal * 1.5; // 150% collateralization

    return {
      principal,
      interest: interest.toFixed(2),
      totalRepayment: totalRepayment.toFixed(2),
      requiredCollateral: requiredCollateral.toFixed(2),
      dailyRate: ((rate * term) / parseInt(selectedTerm)).toFixed(4),
    };
  };

  const loanDetails = calculateLoanDetails();

  const handleApplyLoan = async () => {
    if (!isCorrectChain) {
      alert(`Please switch to ${mode === "degen" ? "Base" : "Celo"} Network`);
      return;
    }

    if (
      !loanDetails ||
      parseFloat(collateralAmount) < parseFloat(loanDetails.requiredCollateral)
    ) {
      toast.success("Insufficient collateral provided");
      return;
    }

    setIsLoading(true);
    try {
      // Simulate loan application
      await new Promise((resolve) => setTimeout(resolve, 2000));
      toast.success(`Loan application submitted for ${loanAmount} ${currency}`);
      setLoanAmount("");
      setCollateralAmount("");
      onClose();
    } catch (error) {
      console.log(error);
      toast.success("Loan application failed. Please try again.");
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
            className="bg-white rounded-t-3xl w-full max-w-md max-h-[90vh] overflow-hidden shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center mr-3">
                  <CreditCard className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Crypto Loans
                  </h2>
                  <p className="text-sm text-gray-500">Instant liquidity</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
              >
                <X className="w-4 h-4 text-gray-600" />
              </button>
            </div>

            {/* Scrollable Content Area */}
            <div className="overflow-y-auto flex-1 p-6">
              {!isReady ? (
                <div className="text-center py-10">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 mb-6">
                    <h3 className="text-xl font-bold text-yellow-800 mb-2">
                      Coming Soon!
                    </h3>
                    <p className="text-yellow-700">
                      Our crypto loan service is currently under development. We
                      are working to bring you secure, decentralized lending
                      options soon.
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
                  {/* Network Status */}
                  {!isCorrectChain && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4"
                    >
                      <div className="flex items-center">
                        <AlertTriangle className="w-5 h-5 text-amber-600 mr-3" />
                        <div>
                          <p className="text-sm font-medium text-amber-800">
                            Network Switch Required
                          </p>
                          <p className="text-xs text-amber-700">
                            Please switch to {mode === "degen" ? "Base" : "Celo"} Network to proceed
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Loan Terms Selection */}
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                      <Clock className="w-5 h-5 mr-2 text-gray-700" />
                      Loan Terms
                    </h3>
                    <div className="grid grid-cols-1 gap-3">
                      {loanTerms.map((term) => (
                        <motion.button
                          key={term.id}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setSelectedTerm(term.id)}
                          className={`p-4 rounded-xl border-2 transition-all text-left ${
                            selectedTerm === term.id
                              ? `border-${term.color}-500 bg-${term.color}-50`
                              : "border-gray-200 bg-white hover:border-gray-300"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-semibold text-gray-900">
                              {term.name}
                            </span>
                            <span
                              className={`text-sm font-medium ${
                                selectedTerm === term.id
                                  ? `text-${term.color}-600`
                                  : "text-gray-600"
                              }`}
                            >
                              {term.interestRate} APR
                            </span>
                          </div>
                          <p className="text-sm text-gray-500">
                            {term.description}
                          </p>
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  {/* Loan Amount Input */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Loan Amount ({currency})
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="number"
                        value={loanAmount}
                        onChange={(e) => setLoanAmount(e.target.value)}
                        placeholder="Enter amount"
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Available balance: {vaultBalance} {currency}
                    </p>
                  </div>

                  {/* Collateral Input */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Collateral Amount ({currency})
                    </label>
                    <div className="relative">
                      <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="number"
                        value={collateralAmount}
                        onChange={(e) => setCollateralAmount(e.target.value)}
                        placeholder="Enter collateral"
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
                      />
                    </div>
                    {loanDetails && (
                      <p className="text-xs text-gray-500 mt-1">
                        Required: {loanDetails.requiredCollateral} {currency} (150%
                        collateralization)
                      </p>
                    )}
                  </div>

                  {/* Loan Calculator */}
                  {loanDetails && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100 mb-4"
                    >
                      <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                        <Calculator className="w-4 h-4 mr-2 text-blue-600" />
                        Loan Summary
                      </h4>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">
                            Principal Amount
                          </span>
                          <span className="font-medium text-gray-900">
                            {loanAmount} {currency}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">
                            Interest ({selectedTermData?.interestRate})
                          </span>
                          <span className="font-medium text-red-600">
                            +{loanDetails.interest} {currency}
                          </span>
                        </div>
                        <div className="flex justify-between items-center pt-2 border-t border-blue-200">
                          <span className="text-sm font-medium text-gray-900">
                            Total Repayment
                          </span>
                          <span className="font-bold text-blue-600">
                            {loanDetails.totalRepayment} {currency}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">
                            Daily Interest Rate
                          </span>
                          <span className="text-sm text-gray-900">
                            {loanDetails.dailyRate}%
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Risk Warning */}
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
                    <div className="flex items-start">
                      <AlertTriangle className="w-5 h-5 text-red-600 mr-3 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-red-800 mb-1">
                          Liquidation Risk
                        </p>
                        <p className="text-xs text-red-700">
                          Your collateral may be liquidated if its value falls
                          below 130% of the loan amount.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Additional Info */}
                  <div className="bg-gray-50 rounded-xl p-4 mb-4">
                    <div className="flex items-start">
                      <Info className="w-5 h-5 text-gray-600 mr-3 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-gray-800 mb-1">
                          How it works
                        </p>
                        <ul className="text-xs text-gray-600 space-y-1">
                          <li>• Deposit collateral (150% of loan amount)</li>
                          <li>• Receive loan instantly to your wallet</li>
                          <li>• Repay within selected timeframe</li>
                          <li>• Retrieve your collateral upon repayment</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            {isReady && (
              <div className="p-6 border-t border-gray-100 bg-gray-50">
                <button
                  onClick={handleApplyLoan}
                  disabled={
                    !loanAmount ||
                    !collateralAmount ||
                    !isCorrectChain ||
                    isLoading
                  }
                  className={`w-full py-4 rounded-xl font-semibold text-white transition-all ${
                    !loanAmount ||
                    !collateralAmount ||
                    !isCorrectChain ||
                    isLoading
                      ? "bg-gray-300 cursor-not-allowed"
                      : "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg hover:shadow-xl"
                  }`}
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Processing...
                    </div>
                  ) : (
                    <>Apply for Loan</>
                  )}
                </button>
                <p className="text-xs text-gray-500 text-center mt-2">
                  By applying, you agree to our terms and conditions
                </p>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
