import { useState, useEffect, useCallback } from "react";
import { usePublicClient } from "wagmi";
import { formatEther } from "viem";
import { toast } from "sonner";

import { useBankContract } from "~/hooks/contracts";

interface VaultStatus {
  currentBalance: string;
  minReserve: string;
  availableForClaims: string;
}

interface UseContractDataResult {
  vaultBalance: string;
  vaultStatus: VaultStatus;
  claimCooldown: number;
  lastClaimAt: number;
  maxClaim: string;
  isLoading: boolean;
  fetchContractData: () => Promise<void>;
}

export function useContractData(
  address: string | undefined,
  isCorrectChain: boolean,
): UseContractDataResult {
  const publicClient = usePublicClient();
  const { address: bankAddress, abi: bankAbi } = useBankContract();
  const [vaultBalance, setVaultBalance] = useState<string>("0");
  const [isLoading, setIsLoading] = useState(false);
  const [claimCooldown, setClaimCooldown] = useState<number>(0);
  const [lastClaimAt, setLastClaimAt] = useState<number>(0);
  const [maxClaim, setMaxClaim] = useState<string>("0");
  const [vaultStatus, setVaultStatus] = useState<VaultStatus>({
    currentBalance: "0",
    minReserve: "0",
    availableForClaims: "0",
  });

  const fetchContractData = useCallback(async () => {
    if (!publicClient || !address || !isCorrectChain) return;
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

      // Only update state if values have changed
      setVaultStatus((prev) => {
        if (
          prev.currentBalance === newVaultStatus.currentBalance &&
          prev.minReserve === newVaultStatus.minReserve &&
          prev.availableForClaims === newVaultStatus.availableForClaims
        ) {
          return prev;
        }
        return newVaultStatus;
      });
      setVaultBalance((prev) =>
        prev === formatEther(currentBalance)
          ? prev
          : formatEther(currentBalance),
      );
      setClaimCooldown((prev) =>
        prev === Number(cooldown) ? prev : Number(cooldown),
      );
      setLastClaimAt((prev) =>
        prev === Number(lastClaim) ? prev : Number(lastClaim),
      );
      setMaxClaim((prev) =>
        prev === formatEther(maxClaimAmount as bigint)
          ? prev
          : formatEther(maxClaimAmount as bigint),
      );
    } catch (error) {
      console.log("Failed to fetch contract data:", error);
      toast.error("Failed to fetch contract data. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [publicClient, address, isCorrectChain]);

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
