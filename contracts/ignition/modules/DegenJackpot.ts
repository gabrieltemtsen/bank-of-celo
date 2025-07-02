// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const DegenJackpotModule = buildModule("DegenJackpot", (m) => {
  const trustee = m.getParameter(
    "_devWallet",
    "0xbE95bb47789E5f4Af467306C97DED0877BF817B5",
  );

  const BOG = m.contract("DegenJackpot", [trustee]);

  return { BOG };
});

export default DegenJackpotModule;
//deployed addy - 0xD8407eE0b2B1008FAb9e2bD8Ab9005F2dA8BEE67
