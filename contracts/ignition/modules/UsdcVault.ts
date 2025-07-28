// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";


const BaseUSDCVault = buildModule("BaseUSDCVault", (m) => {


  const BOC = m.contract("BaseUSDCVault");

  return { BOC };
});

export default BaseUSDCVault;
