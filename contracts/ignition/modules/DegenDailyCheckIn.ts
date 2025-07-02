// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const DegenCheckInModule = buildModule("DegenCheckInModule", (m) => {
  const trustee = m.getParameter(
    "_trustedSigner",
    "0xC32ecED3420f59e38b0F719AAC67b3C36c6A5d97",
  );

  const DOG = m.contract("DegenDailyCheckIn", [trustee]);

  return { DOG };
});

export default DegenCheckInModule;
//deployed addy - 0xb2e22CdfaB5274186498CedD66b5801e80e98299
