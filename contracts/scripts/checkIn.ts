/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-require-imports */
import hre from "hardhat";
import { formatEther, parseEther } from "viem";
import { ethers } from "ethers"; // For signature generation
import { config as dotenvConfig } from "dotenv";

dotenvConfig();

async function main() {
  // Initialize clients
  const [walletClient] = await hre.viem.getWalletClients();
  const publicClient = await hre.viem.getPublicClient();
  const userAddress = walletClient.account.address;

  // Contract details
  const contractAddress = "0x3d08dA4DcFB48488C421214330657De1dF77BB3b";
  const trustedSignerPrivateKey: string =
    process.env.TRUSTED_SIGNER_PRIVATE_KEY || "";
  if (!trustedSignerPrivateKey) {
    throw new Error("TRUSTED_SIGNER_PRIVATE_KEY not set in .env");
  }
  const trustedSigner = new ethers.Wallet(trustedSignerPrivateKey);

  // Contract ABI
  const abi = [
    {
      inputs: [
        {
          internalType: "address",
          name: "_trustedSigner",
          type: "address",
        },
      ],
      stateMutability: "nonpayable",
      type: "constructor",
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: "address",
          name: "user",
          type: "address",
        },
        {
          indexed: true,
          internalType: "uint256",
          name: "day",
          type: "uint256",
        },
        {
          indexed: false,
          internalType: "uint256",
          name: "round",
          type: "uint256",
        },
      ],
      name: "CheckedIn",
      type: "event",
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: "address",
          name: "depositor",
          type: "address",
        },
        {
          indexed: false,
          internalType: "uint256",
          name: "amount",
          type: "uint256",
        },
      ],
      name: "FundsDeposited",
      type: "event",
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: "address",
          name: "user",
          type: "address",
        },
        {
          indexed: false,
          internalType: "uint256",
          name: "round",
          type: "uint256",
        },
      ],
      name: "RewardClaimed",
      type: "event",
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: "uint256",
          name: "round",
          type: "uint256",
        },
      ],
      name: "RoundEnded",
      type: "event",
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: "uint256",
          name: "round",
          type: "uint256",
        },
      ],
      name: "RoundStarted",
      type: "event",
    },
    {
      inputs: [],
      name: "admin",
      outputs: [
        {
          internalType: "address",
          name: "",
          type: "address",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "uint256",
          name: "day",
          type: "uint256",
        },
        {
          internalType: "bytes",
          name: "signature",
          type: "bytes",
        },
      ],
      name: "checkIn",
      outputs: [],
      stateMutability: "payable",
      type: "function",
    },
    {
      inputs: [],
      name: "checkInFee",
      outputs: [
        {
          internalType: "uint256",
          name: "",
          type: "uint256",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "uint256",
          name: "fid",
          type: "uint256",
        },
        {
          internalType: "bytes",
          name: "signature",
          type: "bytes",
        },
      ],
      name: "claimReward",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [],
      name: "currentRound",
      outputs: [
        {
          internalType: "uint256",
          name: "",
          type: "uint256",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "uint256",
          name: "",
          type: "uint256",
        },
        {
          internalType: "address",
          name: "",
          type: "address",
        },
        {
          internalType: "uint256",
          name: "",
          type: "uint256",
        },
      ],
      name: "dailyCheckIns",
      outputs: [
        {
          internalType: "bool",
          name: "",
          type: "bool",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [],
      name: "deposit",
      outputs: [],
      stateMutability: "payable",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "uint256",
          name: "",
          type: "uint256",
        },
        {
          internalType: "uint256",
          name: "",
          type: "uint256",
        },
      ],
      name: "fidUsedInRound",
      outputs: [
        {
          internalType: "bool",
          name: "",
          type: "bool",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [],
      name: "getActiveRound",
      outputs: [
        {
          components: [
            {
              internalType: "uint256",
              name: "startTime",
              type: "uint256",
            },
            {
              internalType: "bool",
              name: "isActive",
              type: "bool",
            },
            {
              internalType: "uint256",
              name: "participantCount",
              type: "uint256",
            },
            {
              internalType: "uint256",
              name: "totalCheckIns",
              type: "uint256",
            },
          ],
          internalType: "struct CeloDailyCheckIn.Round",
          name: "",
          type: "tuple",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [],
      name: "getAllRounds",
      outputs: [
        {
          components: [
            {
              internalType: "uint256",
              name: "startTime",
              type: "uint256",
            },
            {
              internalType: "bool",
              name: "isActive",
              type: "bool",
            },
            {
              internalType: "uint256",
              name: "participantCount",
              type: "uint256",
            },
            {
              internalType: "uint256",
              name: "totalCheckIns",
              type: "uint256",
            },
          ],
          internalType: "struct CeloDailyCheckIn.Round[]",
          name: "",
          type: "tuple[]",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "address",
          name: "user",
          type: "address",
        },
      ],
      name: "getUserStatus",
      outputs: [
        {
          internalType: "uint256",
          name: "currentCheckIns",
          type: "uint256",
        },
        {
          internalType: "bool",
          name: "eligibleForReward",
          type: "bool",
        },
        {
          internalType: "bool",
          name: "hasClaimed",
          type: "bool",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [],
      name: "rewardAmount",
      outputs: [
        {
          internalType: "uint256",
          name: "",
          type: "uint256",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "uint256",
          name: "",
          type: "uint256",
        },
      ],
      name: "rounds",
      outputs: [
        {
          internalType: "uint256",
          name: "startTime",
          type: "uint256",
        },
        {
          internalType: "bool",
          name: "isActive",
          type: "bool",
        },
        {
          internalType: "uint256",
          name: "participantCount",
          type: "uint256",
        },
        {
          internalType: "uint256",
          name: "totalCheckIns",
          type: "uint256",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "uint256",
          name: "newFee",
          type: "uint256",
        },
      ],
      name: "setCheckInFee",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "address",
          name: "newSigner",
          type: "address",
        },
      ],
      name: "setTrustedSigner",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [],
      name: "startNewRound",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [],
      name: "stopRound",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [],
      name: "trustedSigner",
      outputs: [
        {
          internalType: "address",
          name: "",
          type: "address",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "uint256",
          name: "",
          type: "uint256",
        },
        {
          internalType: "address",
          name: "",
          type: "address",
        },
      ],
      name: "userRoundData",
      outputs: [
        {
          internalType: "uint256",
          name: "checkInCount",
          type: "uint256",
        },
        {
          internalType: "bool",
          name: "hasClaimed",
          type: "bool",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [],
      name: "withdrawFunds",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      stateMutability: "payable",
      type: "receive",
    },
  ];

  // Initialize contract
  const contract = await hre.viem.getContractAt(
    "CeloDailyCheckIn",
    contractAddress,
  );

  // Helper function to generate signatures
  async function signCheckIn(
    userAddress: string,
    day: number,
    round: number,
  ): Promise<string> {
    const messageHash = ethers.utils.solidityKeccak256(
      ["address", "uint256", "uint256"],
      [userAddress, day, round],
    );
    const signature = await trustedSigner.signMessage(
      ethers.utils.arrayify(messageHash),
    );
    return signature;
  }

  async function signClaimReward(
    userAddress: string,
    fid: number,
    round: number,
  ): Promise<string> {
    const messageHash = ethers.utils.solidityKeccak256(
      ["address", "uint256", "uint256"],
      [userAddress, fid, round],
    );
    const signature = await trustedSigner.signMessage(
      ethers.utils.arrayify(messageHash),
    );
    return signature;
  }

  console.log(`🚀 Testing CeloDailyCheckIn contract at ${contractAddress}`);
  console.log(`👤 User address: ${userAddress}`);

  // 1. Check contract balance and deposit funds if needed
  let balance = await publicClient.getBalance({ address: contractAddress });
  console.log(`💰 Contract balance: ${formatEther(balance)} CELO`);

  if (balance < parseEther("10")) {
    console.log("📤 Depositing 1 CELO to contract...");
    const depositHash = await walletClient.writeContract({
      address: contractAddress,
      abi,
      functionName: "deposit",
      value: parseEther("1"),
    });
    const receipt = await publicClient.waitForTransactionReceipt({
      hash: depositHash,
    });
    console.log(`✅ Deposit Tx: ${depositHash}, Status: ${receipt.status}`);
    balance = await publicClient.getBalance({ address: contractAddress });
    console.log(`✅ New contract balance: ${formatEther(balance)} CELO`);
  }

  // 2. Get current round
  const currentRound = Number(await contract.read.currentRound());
  console.log(`🔄 Current round: ${currentRound}`);

  // 3. Test checkIn for days 1-7
  const checkInFee = await contract.read.checkInFee();
  console.log(`💸 Check-in fee: ${formatEther(checkInFee)} CELO`);

  for (let day = 1; day <= 7; day++) {
    console.log(`📅 Attempting check-in for day ${day}...`);
    try {
      const signature = await signCheckIn(userAddress, day, currentRound);
      const hash = await walletClient.writeContract({
        address: contractAddress,
        abi,
        functionName: "checkIn",
        args: [day, signature],
        value: checkInFee,
      });
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      console.log(
        `✅ Check-in successful for day ${day}! Tx: ${hash}, Status: ${receipt.status}`,
      );
    } catch (error: any) {
      console.error(`❌ Check-in failed for day ${day}:`, error.message);
    }
  }

  // 4. Verify user status after check-ins
  const [checkInCount, eligibleForReward, hasClaimed] =
    await contract.read.getUserStatus([userAddress]);
  console.log(`👨‍💼 User status:
    Check-ins: ${checkInCount}
    Eligible for reward: ${eligibleForReward}
    Has claimed: ${hasClaimed}`);

  // 5. Test claimReward
  if (eligibleForReward && !hasClaimed) {
    console.log("🎁 Attempting to claim reward...");
    const fid = 12345; // Example FID
    try {
      const signature = await signClaimReward(userAddress, fid, currentRound);
      const initialBalance = await publicClient.getBalance({
        address: userAddress,
      });
      const hash = await walletClient.writeContract({
        address: contractAddress,
        abi,
        functionName: "claimReward",
        args: [fid, signature],
      });
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      const finalBalance = await publicClient.getBalance({
        address: userAddress,
      });
      console.log(`✅ Reward claimed! Tx: ${hash}, Status: ${receipt.status}`);
      console.log(
        `💰 User balance change: ${formatEther(initialBalance)} -> ${formatEther(finalBalance)} CELO`,
      );
    } catch (error: any) {
      console.error("❌ Claim reward failed:", error.message);
    }
  } else {
    console.log("⛔ User not eligible to claim reward or already claimed.");
  }

  // 6. Test edge cases
  console.log("🧪 Testing edge cases...");

  // Test duplicate check-in
  console.log("📅 Attempting duplicate check-in for day 1...");
  try {
    const signature = await signCheckIn(userAddress, 1, currentRound);
    const hash = await walletClient.writeContract({
      address: contractAddress,
      abi,
      functionName: "checkIn",
      args: [1, signature],
      value: checkInFee,
    });
    await publicClient.waitForTransactionReceipt({ hash });
    console.log("❌ Duplicate check-in did not revert as expected!");
  } catch (error: any) {
    console.log(`✅ Duplicate check-in correctly reverted: ${error.message}`);
  }

  // Test invalid signature
  console.log("🔑 Attempting check-in with invalid signature...");
  try {
    const invalidSigner = new ethers.Wallet(
      "0x0000000000000000000000000000000000000000000000000000000000000001",
    );
    const invalidSignature = await invalidSigner.signMessage(
      ethers.utils.arrayify(
        ethers.utils.solidityKeccak256(
          ["address", "uint256", "uint256"],
          [userAddress, 1, currentRound],
        ),
      ),
    );
    const hash = await walletClient.writeContract({
      address: contractAddress,
      abi,
      functionName: "checkIn",
      args: [1, invalidSignature],
      value: checkInFee,
    });
    await publicClient.waitForTransactionReceipt({ hash });
    console.log("❌ Invalid signature did not revert as expected!");
  } catch (error: any) {
    console.log(`✅ Invalid signature correctly reverted: ${error.message}`);
  }

  // Test admin function (startNewRound) with non-admin
  console.log("🔐 Attempting startNewRound with non-admin...");
  try {
    const hash = await walletClient.writeContract({
      address: contractAddress,
      abi,
      functionName: "startNewRound",
    });
    await publicClient.waitForTransactionReceipt({ hash });
    console.log("❌ Non-admin startNewRound did not revert as expected!");
  } catch (error: any) {
    console.log(
      `✅ Non-admin startNewRound correctly reverted: ${error.message}`,
    );
  }
  const addressesToWhitelist = [
    "0x6268689797cA15256AF2ce922836cd69940FA024", // replace with real addresses
    "0xC5337CeE97fF5B190F26C4A12341dd210f26e17c",
    "0xC32ecED3420f59e38b0F719AAC67b3C36c6A5d97",
  ];
  const amountsToWhitelist = [
    parseEther("100"), // 10 tokens
    parseEther("200"),
    parseEther("15"),
  ];

  // 7. Check active round details
  const activeRound = await contract.read.getActiveRound();
  console.log(`🏁 Active round details:
    Start time: ${new Date(Number(activeRound.startTime) * 1000).toISOString()}
    Is active: ${activeRound.isActive}
    Participant count: ${activeRound.participantCount}
    Total check-ins: ${activeRound.totalCheckIns}`);
}

main().catch((err) => {
  console.error("❌ Error in test script:", err);
  process.exit(1);
});
