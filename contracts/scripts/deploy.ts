/* eslint-disable @typescript-eslint/no-require-imports */
import * as dotenv from "dotenv";
import { parseEther } from "viem";
dotenv.config();
const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  const BocContract = await hre.ethers.getContractFactory("BankOfCelo");

  const factory = await BocContract.deploy(parseEther("5"));
  await factory.waitForDeployment();
  console.log("Bank Of Celo deployed at:", factory.target);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.log("Error deploying:", error);
    process.exit(1);
  });