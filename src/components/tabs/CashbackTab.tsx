"use client";

import { Gift, DollarSign, Plus } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "~/components/ui/Button";
import { useCashback } from "~/components/providers/CashbackProvider";

export default function CashbackTab() {
  const { optedIn, cashback, optIn, claim, addCashback } = useCashback();

  return (
    <div className="min-h-screen bg-white text-gray-900 rounded-md relative overflow-hidden p-6 pb-32">
      {!optedIn ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4"
        >
          <h2 className="text-xl font-semibold">Cashback Rewards</h2>
          <p className="text-sm text-gray-600">
            Opt in to start earning cashback on your transactions.
          </p>
          <Button
            onClick={() => optIn()}
            className="mx-auto flex items-center gap-2 px-6"
          >
            <Gift className="w-4 h-4" /> Opt In
          </Button>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="text-center">
            <p className="text-sm text-gray-500">Claimable Cashback</p>
            <p className="text-3xl font-bold mt-1">
              {cashback.toFixed(2)} CELO
            </p>
          </div>
          <Button
            onClick={() => claim()}
            className="w-full flex items-center justify-center gap-2"
          >
            <DollarSign className="w-4 h-4" /> Claim
          </Button>
          <Button
            variant="outline"
            onClick={() => addCashback(0.1)}
            className="w-full flex items-center justify-center gap-2 text-xs"
          >
            <Plus className="w-4 h-4" /> Add Dummy Cashback
          </Button>
        </motion.div>
      )}
    </div>
  );
}
