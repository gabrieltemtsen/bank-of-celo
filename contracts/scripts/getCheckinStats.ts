import { ethers } from "ethers";
import fs from "fs";
import path from "path";

async function main() {
  const contractAddress = "0xaFbFAaac9c495C74de33c039C0B56172b393d2Ad";

  // Initialize provider (using Alchemy for Celo)
  const provider = new ethers.providers.JsonRpcProvider(
    "https://celo-mainnet.g.alchemy.com/v2/ImPte7otRAJ_4gDny9NLO_Ao9GT4_CiQ",
  );

  // Contract ABI (simplified with just what we need)
  const abi = [
    {
      inputs: [],
      name: "currentRound",
      outputs: [{ name: "", type: "uint256" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        { name: "", type: "uint256" },
        { name: "", type: "address" },
      ],
      name: "userRoundData",
      outputs: [
        { name: "checkInCount", type: "uint256" },
        { name: "hasClaimed", type: "bool" },
      ],
      stateMutability: "view",
      type: "function",
    },
  ];

  // Get contract instance
  const contract = new ethers.Contract(contractAddress, abi, provider);

  // Get current round
  const currentRound = await contract.currentRound();
  console.log(`ℹ️ Current Round: ${currentRound}`);

  // Read addresses from file (assuming one address per line)
  const addressesFilePath = path.join(__dirname, "addresses.txt");
  const addressesFileContent = fs.readFileSync(addressesFilePath, "utf-8");
  const addresses = addressesFileContent
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && ethers.utils.isAddress(line));

  if (addresses.length === 0) {
    console.error("❌ No valid addresses found in addresses.txt");
    process.exit(1);
  }

  console.log(`\n⏳ Checking ${addresses.length} addresses...`);

  // Fetch user data
  const userStats: {
    address: string;
    checkInCount: number;
    hasClaimed: boolean;
  }[] = [];

  // Process in batches to avoid rate limiting
  const BATCH_SIZE = 50;
  const DELAY_MS = 1000;

  for (let i = 0; i < addresses.length; i += BATCH_SIZE) {
    const batch = addresses.slice(i, i + BATCH_SIZE);
    console.log(
      `Processing batch ${i / BATCH_SIZE + 1} of ${Math.ceil(addresses.length / BATCH_SIZE)}...`,
    );

    const batchPromises = batch.map(async (address) => {
      try {
        const userData = await contract.userRoundData(currentRound, address);
        return {
          address,
          checkInCount: Number(userData.checkInCount),
          hasClaimed: userData.hasClaimed as boolean,
        };
      } catch (error) {
        console.warn(
          `⚠️ Error fetching data for ${address}: ${error instanceof Error ? error.message : String(error)}`,
        );
        return null;
      }
    });

    const batchResults = await Promise.all(batchPromises);
    userStats.push(...batchResults.filter((result): result is { address: string; checkInCount: number; hasClaimed: boolean; } => result !== null));

    // Delay between batches
    if (i + BATCH_SIZE < addresses.length) {
      await new Promise((resolve) => setTimeout(resolve, DELAY_MS));
    }
  }

  // Sort by check-in count (descending)
  userStats.sort((a, b) => b.checkInCount - a.checkInCount);

  // Calculate statistics
  const totalParticipants = userStats.length;
  const perfectCheckIns = userStats.filter((u) => u.checkInCount === 6).length;
  const averageCheckIns =
    totalParticipants > 0
      ? userStats.reduce((sum, u) => sum + u.checkInCount, 0) /
        totalParticipants
      : 0;
  const eligibleForRewards = userStats.filter(
    (u) => !u.hasClaimed && u.checkInCount >= 6,
  ).length;

  // Display results
  console.log("\n📊 Check-In Statistics:");
  console.log(`- Total Addresses Checked: ${addresses.length}`);
  console.log(`- Active Participants: ${totalParticipants}`);
  console.log(`- Users with all 6 days checked in: ${perfectCheckIns}`);
  console.log(`- Average check-ins per user: ${averageCheckIns.toFixed(2)}`);
  console.log(
    `- Users eligible for rewards (6+ check-ins, unclaimed): ${eligibleForRewards}`,
  );

  console.log("\n🏆 Top Participants by Check-Ins:");
  const topParticipants = userStats.slice(0, 10);
  topParticipants.forEach((user, index) => {
    console.log(
      `${index + 1}. ${user.address} - ${user.checkInCount} check-ins (Claimed: ${user.hasClaimed})`,
    );
  });

  // Save to JSON file
  const output = {
    round: Number(currentRound),
    totalAddressesChecked: addresses.length,
    activeParticipants: totalParticipants,
    perfectCheckIns,
    averageCheckIns: averageCheckIns.toFixed(2),
    eligibleForRewards,
    userStats,
  };

  fs.writeFileSync("check-in-stats.json", JSON.stringify(output, null, 2));
  console.log("\n📄 Results saved to check-in-stats.json");

  // Save CSV file for easy analysis
  const csvHeader = "Address,CheckInCount,HasClaimed\n";
  const csvContent =
    csvHeader +
    userStats
      .map((user) => `${user.address},${user.checkInCount},${user.hasClaimed}`)
      .join("\n");
  fs.writeFileSync("check-in-stats.csv", csvContent);
  console.log("📄 CSV results saved to check-in-stats.csv");
}

main().catch((err) => {
  console.error("Error:", err instanceof Error ? err.message : String(err));
  process.exit(1);
});
