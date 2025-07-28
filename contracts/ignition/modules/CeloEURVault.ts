// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";


const CeloEURVault = buildModule("CeloEURVault", (m) => {


  const BOC = m.contract("CeloEURVault");

  return { BOC };
});

export default CeloEURVault;
