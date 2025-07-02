// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const CeloCheckInModule = buildModule("CeloCheckInModule", (m) => {
  const trustee = m.getParameter(
    "_trustedSigner",
    "0xC32ecED3420f59e38b0F719AAC67b3C36c6A5d97",
  );

  const BOC = m.contract("CeloDailyCheckIn", [trustee]);

  return { BOC };
});

export default CeloCheckInModule;
