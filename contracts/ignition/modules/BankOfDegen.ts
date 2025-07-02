// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import { parseEther } from "viem";

const MIN_BALANCE = parseEther("0.5");

const BodModule = buildModule("BodModule", (m) => {
  const minBalance = m.getParameter("_minVaultBalance", MIN_BALANCE);
  const devAddress = m.getParameter(
    "_devWallet",
    "0xbE95bb47789E5f4Af467306C97DED0877BF817B5",
  );
  const gaslessOperator = m.getParameter(
    "_gaslessOperator",
    "0xC32ecED3420f59e38b0F719AAC67b3C36c6A5d97",
  );

  const BOD = m.contract("BankOfDegen", [
    minBalance,
    devAddress,
    gaslessOperator,
  ]);

  return { BOD };
});

export default BodModule;
//0xaFbFAaac9c495C74de33c039C0B56172b393d2Ad
