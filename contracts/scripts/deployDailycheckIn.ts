/* eslint-disable @typescript-eslint/no-require-imports */
import * as dotenv from "dotenv";
dotenv.config();
const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  const TrusteeAddress = "0xC32ecED3420f59e38b0F719AAC67b3C36c6A5d97";

  const BocContract = await hre.ethers.getContractFactory("CeloDailyCheckIn");

  const factory = await BocContract.deploy(TrusteeAddress);
  await factory.waitForDeployment();
  console.log("CeloDailyCheckIn deployed at:", factory.target);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error deploying:", error);
    process.exit(1);
  });
