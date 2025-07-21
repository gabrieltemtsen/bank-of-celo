/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { motion } from "framer-motion";
import { Loader2, Send, Gift } from "lucide-react";
import { Button } from "~/components/ui/Button";
import { toast } from "sonner";
import { Input } from "../ui/input";
import {
  useAccount,
  usePublicClient,
  useSendTransaction,
  useWriteContract,
  useBalance,
} from "wagmi";
import { ERC20_ABI, useBankContract } from "~/hooks/contracts";
import { useChainMode } from "~/app/chain-mode/context";
import { getDataSuffix, submitReferral } from "@divvi/referral-sdk";
import { encodeFunctionData, formatEther, parseEther, parseUnits } from "viem";
import { base, celo } from "wagmi/chains";

interface DonateTabProps {
  isCorrectChain: boolean;
  isPending: boolean;
}

export default function DonateTab({
  isCorrectChain,
  isPending,
}: DonateTabProps) {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { sendTransactionAsync } = useSendTransaction();
  const { writeContractAsync } = useWriteContract();
  
  const { address: bankAddress, abi: bankAbi } = useBankContract();
  const [amount, setAmount] = useState("");
  const { mode } = useChainMode();
  const currency = mode === "degen" ? "DEGEN" : "CELO";
  
  const { data: tokenBalance } = useBalance({
    address,
    token: mode === "degen" ? "0x4ed4E862860beD51a9570b96d89aF5E1B0Efefed" : undefined,
    chainId: mode === "degen" ? base.id : undefined,
  });

  const targetChain = mode === "degen" ? base : celo;
  const isDegen = mode === "degen";

  const getDonateButtonClasses = () => {
    return isDegen
      ? "w-full py-4 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-xl font-medium transition-all transform hover:scale-105 shadow-lg"
      : "w-full py-4 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-xl font-medium transition-all transform hover:scale-105 shadow-lg";
  };

  const handleDonate = async (amount: string) => {
    if (!isCorrectChain) {
      toast.error(`Please switch to ${targetChain.name} Network`);
      return;
    }
  
    if (!address) {
      toast.error("Please connect your wallet");
      return;
    }
  
    if (!publicClient) {
      toast.error("Public client is not available. Please try again.");
      return;
    }
  
    if (Number(amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
  
    try {
      let donateData: `0x${string}`;
      let transactionParams: Parameters<typeof sendTransactionAsync>[0];
  
      if (mode === "degen") {
        const degenAmount = parseUnits(amount, 18);
        const degenTokenAddress = "0x4ed4E862860beD51a9570b96d89aF5E1B0Efefed";
        const bankContractAddress = bankAddress as `0x${string}`;
  
        const balance = await publicClient.readContract({
          address: degenTokenAddress as `0x${string}`,
          abi: ERC20_ABI,
          functionName: "balanceOf",
          args: [address],
        }) as bigint;
        if (balance < degenAmount) {
          toast.error(`Insufficient DEGEN balance. Available: ${formatEther(balance)} DEGEN`);
          return;
        }
  
        const allowance = await publicClient.readContract({
          address: degenTokenAddress as `0x${string}`,
          abi: ERC20_ABI,
          functionName: "allowance",
          args: [address, bankContractAddress],
        }) as bigint;
        if (allowance < degenAmount) {
          toast.info("Approving DEGEN tokens for donation...");
          const approveHash = await writeContractAsync({
            address: degenTokenAddress as `0x${string}`,
            abi: ERC20_ABI,
            functionName: "approve",
            args: [bankContractAddress, degenAmount],
            chainId: targetChain.id,
          });
          await publicClient.waitForTransactionReceipt({ hash: approveHash });
          toast.success("DEGEN token approval successful!");
        }
  
        const updatedAllowance = await publicClient.readContract({
          address: degenTokenAddress as `0x${string}`,
          abi: ERC20_ABI,
          functionName: "allowance",
          args: [address, bankContractAddress],
        }) as bigint;
        if (updatedAllowance < degenAmount) {
          throw new Error("Approval amount insufficient after update");
        }
  
        donateData = encodeFunctionData({
          abi: bankAbi,
          functionName: "donate",
          args: [degenAmount],
        });
  
        transactionParams = {
          to: bankContractAddress,
          data: donateData,
          chainId: targetChain.id,
          maxFeePerGas: parseUnits("100", 9),
          maxPriorityFeePerGas: parseUnits("100", 9),
        };
      } else {
        const celoAmount = parseEther(amount);
        donateData = encodeFunctionData({
          abi: bankAbi,
          functionName: "donate",
          args: [],
        });
        transactionParams = {
          to: bankAddress as `0x${string}`,
          data: donateData,
          value: celoAmount,
          chainId: targetChain.id,
          maxFeePerGas: parseUnits("100", 9),
          maxPriorityFeePerGas: parseUnits("100", 9),
        };
      }
  
      const dataSuffix = getDataSuffix({
        consumer: "0xC5337CeE97fF5B190F26C4A12341dd210f26e17c",
        providers: [
          "0x0423189886d7966f0dd7e7d256898daeee625dca",
          "0xc95876688026be9d6fa7a7c33328bd013effa2bb",
          "0x5f0a55fad9424ac99429f635dfb9bf20c3360ab8",
        ],
      });
  
      const combinedData = dataSuffix
        ? donateData + (dataSuffix.startsWith("0x") ? dataSuffix.slice(2) : dataSuffix)
        : donateData;
  
      transactionParams.data = combinedData as `0x${string}`;
  
      const hash = await sendTransactionAsync(transactionParams);
  
      // Wait for transaction confirmation before showing success message
      await publicClient.waitForTransactionReceipt({ hash });

      toast.success(`Donation successful! Transaction hash: ${hash.slice(0, 6)}...`);
  
      try {
        await submitReferral({
          txHash: hash,
          chainId: targetChain.id,
        });
      } catch (diviError) {
        console.error("Divi submitReferral error:", diviError);
        toast.warning(
          "Donation succeeded, but referral tracking failed. We're looking into it.",
        );
      }
    } catch (error: any) {
      console.error("Donation error:", error);
      toast.error(
        `Donation failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      if (error.cause) console.error("Detailed error cause:", error.cause);
    }
  };

  const handleSubmit = () => {
    if (!isCorrectChain) {
      toast.error(`Please switch to ${mode === "degen" ? "Base" : "Celo"} Network`);
      return;
    }

    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    handleDonate(amount);
    setAmount("");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6 w-full p-4"
    >
      <div className="text-center space-y-2">
        <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${isDegen ? 'bg-purple-100 dark:bg-purple-900/30' : 'bg-emerald-100 dark:bg-emerald-900/30'}`}>
          <Gift className={`w-8 h-8 ${isDegen ? 'text-purple-600 dark:text-purple-400' : 'text-emerald-600 dark:text-emerald-400'}`} />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Donate {currency}
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Support the vault and help the community grow
        </p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="p-6 bg-white/95 dark:bg-gray-900/95 backdrop-blur-lg rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 w-full"
      >
        <div className="space-y-6">
          <div>
            <label
              htmlFor="donate-amount"
              className="block text-lg font-medium text-gray-700 dark:text-gray-300 mb-3"
            >
              Amount to Donate ({currency})
            </label>
            <Input
              id="donate-amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.0"
              className="w-full py-4 text-xl text-black dark:text-white bg-gray-100 dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 focus:border-purple-500 dark:focus:border-purple-400 transition-colors"
              min="0"
              step="0.01"
            />
            {tokenBalance && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                Available: {Number(formatEther(tokenBalance.value)).toFixed(4)} {currency}
              </p>
            )}
          </div>
          
          <Button
            onClick={handleSubmit}
            disabled={isPending || !amount}
            className={getDonateButtonClasses()}
            aria-label={`Donate ${currency}`}
          >
            {isPending ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <div className="flex items-center justify-center gap-3">
                <Send className="w-6 h-6" />
                <span className="text-lg">Donate {currency}</span>
              </div>
            )}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}