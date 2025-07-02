// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import { parseEther } from "viem";

const MIN_BALANCE = parseEther("5");

const BocRelayModule = buildModule("BocRelayModule", (m) => {
  const bankAddress = m.getParameter("bankAddress", MIN_BALANCE);
  const devAddress = m.getParameter(
    "initialOwner",
    "0xc32eced3420f59e38b0f719aac67b3c36c6a5d97",
  );

  const BOC = m.contract("BankOfCelo", [bankAddress, devAddress]);

  return { BOC };
});

export default BocRelayModule;
