/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-require-imports */
import hre from "hardhat";

async function main() {
  const publicClient = await hre.viem.getPublicClient();
  const contractAddress = "0x18Ea8d1D41A3307D159D2d3C1fCfBCF139354A8F";
  const deploymentBlock = 35469999n; // Your contract's deployment block
  const currentBlock = await publicClient.getBlockNumber();

  // Contract ABI (simplified to just the events we need)
  const abi = [
    {
      anonymous: false,
      inputs: [
        { indexed: true, name: "recipient", type: "address" },
        { indexed: false, name: "fid", type: "uint256" },
        { indexed: false, name: "amount", type: "uint256" },
      ],
      name: "Claimed",
      type: "event",
    },
    {
      anonymous: false,
      inputs: [
        { indexed: true, name: "operator", type: "address" },
        { indexed: true, name: "claimer", type: "address" },
        { indexed: false, name: "fid", type: "uint256" },
      ],
      name: "GaslessClaimExecuted",
      type: "event",
    },
  ];

  console.log(
    `⏳ Fetching all claimed FIDs from block ${deploymentBlock} to ${currentBlock}...`,
  );

  // Get all Claimed events
  const claimedEvents = await publicClient.getContractEvents({
    address: contractAddress,
    abi,
    eventName: "Claimed",
    fromBlock: deploymentBlock,
    toBlock: currentBlock,
  });

  // Get all GaslessClaimExecuted events
  const gaslessEvents = await publicClient.getContractEvents({
    address: contractAddress,
    abi,
    eventName: "GaslessClaimExecuted",
    fromBlock: deploymentBlock,
    toBlock: currentBlock,
  });

  console.log(
    `ℹ️ Found ${claimedEvents.length} Claimed events and ${gaslessEvents.length} GaslessClaimExecuted events`,
  );

  // Combine and deduplicate FIDs
  const allFids = new Set<bigint>();

  claimedEvents.forEach((event: any) => {
    if (event.args.fid) {
      allFids.add(event.args.fid);
    } else {
      console.warn("⚠️ Claimed event missing fid:", event);
    }
  });

  gaslessEvents.forEach((event: any) => {
    if (event.args.fid) {
      allFids.add(event.args.fid);
    } else {
      console.warn("⚠️ GaslessClaimExecuted event missing fid:", event);
    }
  });

  // Convert to sorted array
  const sortedFids = Array.from(allFids)
    .map((fid) => fid.toString())
    .sort((a, b) => (BigInt(a) - BigInt(b) < 0n ? -1 : 1));

  console.log(`\n✅ Found ${sortedFids.length} unique claimed FIDs:`);
  console.log(sortedFids.join(", "));

  // Save to a file
  if (sortedFids.length > 0) {
    const fs = require("fs");
    fs.writeFileSync("claimed-fids.json", JSON.stringify(sortedFids, null, 2));
    console.log("\n📄 Saved to claimed-fids.json");
  } else {
    console.log("\n❌ No claimed FIDs found. Possible issues:");
    console.log("- Contract address is incorrect");
    console.log("- No claims have been made yet");
    console.log("- The RPC endpoint doesn't have historical data");
  }
}

main().catch((err) => {
  console.error("Error fetching FIDs:", err);
  process.exit(1);
});
