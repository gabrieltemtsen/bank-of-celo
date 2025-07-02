// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const FootyClaimModule = buildModule("FootyClaim", (m) => {
  const trustee = m.getParameter(
    "_scoresToken",
    "0xba1afff81a239c926446a67d73f73ec51c37c777",
  );
  const trustee1 = m.getParameter(
    "initialOwner",
    "0x6268689797cA15256AF2ce922836cd69940FA024",
  );
  const BOC = m.contract("FootyScoresClaim", [trustee, trustee1]);

  return { BOC };
});

export default FootyClaimModule;
//deployed addy - 0x9602d02Bd17d9f1c1EB09028fCea26dD29383611
