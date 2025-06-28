import { useChainMode } from "~/app/chain-mode/context";
import {
  BANK_OF_CELO_CONTRACT_ADDRESS,
  BANK_OF_CELO_CONTRACT_ABI,
  CELO_CHECK_IN_CONTRACT_ADDRESS,
  CELO_CHECK_IN_ABI,
  CELO_JACKPOT_CONTRACT_ADDRESS,
  CELO_JACKPOT_ABI,
  BANK_OF_DEGEN_ADDRESS,
  BANK_OF_DEGEN_ABI,
  DEGEN_DAILY_CHECKIN_ADDRESS,
  DEGEN_DAILY_CHECKIN_ABI,
  DEGEN_JACKPOT_ADDRESS,
  DEGEN_JACKPOT_ABI,
} from "~/lib/constants";

export const ERC20_ABI = [
  { inputs: [], name: "decimals", outputs: [{ type: "uint8" }], stateMutability: "view", type: "function" },
  { inputs: [{ name: "owner", type: "address" }, { name: "spender", type: "address" }], name: "allowance", outputs: [{ type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [{ name: "spender", type: "address" }, { name: "amount", type: "uint256" }], name: "approve", outputs: [{ type: "bool" }], stateMutability: "nonpayable", type: "function" },
];

export function useBankContract() {
  const { mode } = useChainMode();
  return mode === "degen"
    ? { address: BANK_OF_DEGEN_ADDRESS, abi: BANK_OF_DEGEN_ABI }
    : { address: BANK_OF_CELO_CONTRACT_ADDRESS, abi: BANK_OF_CELO_CONTRACT_ABI };
}

export function useCheckinContract() {
  const { mode } = useChainMode();
  return mode === "degen"
    ? { address: DEGEN_DAILY_CHECKIN_ADDRESS, abi: DEGEN_DAILY_CHECKIN_ABI }
    : { address: CELO_CHECK_IN_CONTRACT_ADDRESS, abi: CELO_CHECK_IN_ABI };
}

export function useJackpotContract() {
  const { mode } = useChainMode();
  return mode === "degen"
    ? { address: DEGEN_JACKPOT_ADDRESS, abi: DEGEN_JACKPOT_ABI }
    : { address: CELO_JACKPOT_CONTRACT_ADDRESS, abi: CELO_JACKPOT_ABI };
}
