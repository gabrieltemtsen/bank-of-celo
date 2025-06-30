import { useState, useEffect, useCallback } from "react";
import { usePublicClient } from "wagmi";
import { formatEther } from "viem";
import { toast } from "sonner";
import { useBankContract } from "~/hooks/contracts";

export function useContractData(address?: `0x${string}`, isCorrectChain?: boolean) {
  const publicClient = usePublicClient();
  const { address: bankAddress, abi: bankAbi } = useBankContract();

  const [vaultBalance, setVaultBalance] = useState<string>("0");
  const [vaultStatus, setVaultStatus] = useState({
    currentBalance: "0",
    minReserve: "0",
    availableForClaims: "0",
  });
  const [claimCooldown, setClaimCooldown] = useState<number>(0);
  const [lastClaimAt, setLastClaimAt] = useState<number>(0);
  const [maxClaim, setMaxClaim] = useState<string>("0");
  const [isLoading, setIsLoading] = useState(false);

  const fetchContractData = useCallback(async () => {
    if (!publicClient || !address || !isCorrectChain) return;
    setIsLoading(true);
    try {
      const data = await Promise.all([
        publicClient.readContract({
          address: bankAddress as `0x${string}`,
          abi: bankAbi,
          functionName: "getVaultStatus",
        }),
        publicClient.readContract({
          address: bankAddress as `0x${string}`,
          abi: bankAbi,
          functionName: "claimCooldown",
        }),
        publicClient.readContract({
          address: bankAddress as `0x${string}`,
          abi: bankAbi,
          functionName: "lastClaimAt",
          args: [address],
        }),
        publicClient.readContract({
          address: bankAddress as `0x${string}`,
          abi: bankAbi,
          functionName: "MAX_CLAIM",
        }),
      ]);

      const [status, cooldown, lastClaim, maxClaimAmount] = data;
      const [currentBalance, minReserve, availableForClaims] = status as [
        bigint,
        bigint,
        bigint,
      ];

      const newVaultStatus = {
        currentBalance: formatEther(currentBalance),
        minReserve: formatEther(minReserve),
        availableForClaims: formatEther(availableForClaims),
      };

      setVaultStatus(newVaultStatus);
      setVaultBalance(formatEther(currentBalance));
      setClaimCooldown(Number(cooldown));
      setLastClaimAt(Number(lastClaim));
      setMaxClaim(formatEther(maxClaimAmount as bigint));
    } catch (error) {
      console.error("Failed to fetch contract data:", error);
      toast.error("Failed to fetch contract data. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [publicClient, address, isCorrectChain, bankAddress, bankAbi]);

  useEffect(() => {
    fetchContractData();
    const interval = setInterval(fetchContractData, 3000);
    return () => clearInterval(interval);
  }, [fetchContractData]);

  return {
    vaultBalance,
    vaultStatus,
    claimCooldown,
    lastClaimAt,
    maxClaim,
    isLoading,
    fetchContractData,
  };
}
