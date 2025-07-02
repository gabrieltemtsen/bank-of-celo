// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import { keccak256, toBytes } from "viem";

const secret = "gabedevcodes";

const secretHash = keccak256(toBytes(secret));
console.log("Secret Hash:", secretHash);

//0x80695F4477eF8480A3084D027983E14Eb7e86476

const FarQuestModule = buildModule("FarQuestModule", (m) => {
  const _secret = m.getParameter("_secretHash", secretHash);

  const BOC = m.contract("FarQuest", [_secret]);

  return { BOC };
});

export default FarQuestModule;
