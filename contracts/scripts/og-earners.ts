/* eslint-disable @typescript-eslint/no-require-imports */
// scripts/deploy.js
const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  const OGEarners = await hre.ethers.getContractFactory("OGEarners");
  const ogearners = await OGEarners.deploy(
    "0xIdentityVerificationHubAddress",
    1, // scope
    [1, 2, 3], // attestationIds
    "0xCeloTokenAddress",
  );

  console.log("OGEarners deployed to:", ogearners.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
