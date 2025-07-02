// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const CeloCheckInModuleV2 = buildModule("CeloCheckInModuleV2", (m) => {
  const trustee = m.getParameter(
    "_trustedSigner",
    "0xC32ecED3420f59e38b0F719AAC67b3C36c6A5d97",
  );

  const BOC = m.contract("CeloDailyCheckInV2", [trustee]);

  return { BOC };
});

export default CeloCheckInModuleV2;
//deployed addy - 0xd9771bAE9A9647Fd83C9066f981ef91373A56B36
