import hre from "hardhat";
import { ethers } from "ethers";
import { config as dotenvConfig } from "dotenv";

dotenvConfig();

async function main() {
  const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
  const userWallet = new ethers.Wallet(process.env.PRIVATE_KEY || "", provider);

  const contractAddress = "0x18Ea8d1D41A3307D159D2d3C1fCfBCF139354A8F";

  // Paste your ABI here (without getRewardTokensLength)
  const abi = [
    {
      inputs: [
        {
          internalType: "address",
          name: "initialOwner",
          type: "address",
        },
      ],
      stateMutability: "nonpayable",
      type: "constructor",
    },
    {
      inputs: [
        {
          internalType: "address",
          name: "owner",
          type: "address",
        },
      ],
      name: "OwnableInvalidOwner",
      type: "error",
    },
    {
      inputs: [
        {
          internalType: "address",
          name: "account",
          type: "address",
        },
      ],
      name: "OwnableUnauthorizedAccount",
      type: "error",
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
          name: "pointsEarned",
          type: "uint256",
        },
      ],
      name: "InteractionRecorded",
      type: "event",
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: "address",
          name: "previousOwner",
          type: "address",
        },
        {
          indexed: true,
          internalType: "address",
          name: "newOwner",
          type: "address",
        },
      ],
      name: "OwnershipTransferred",
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
          name: "points",
          type: "uint256",
        },
      ],
      name: "PointsRedeemed",
      type: "event",
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: "address",
          name: "rewardToken",
          type: "address",
        },
        {
          indexed: false,
          internalType: "uint256",
          name: "pointsRequired",
          type: "uint256",
        },
      ],
      name: "RewardAdded",
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
      ],
      name: "UserRegistered",
      type: "event",
    },
    {
      inputs: [
        {
          internalType: "address",
          name: "token",
          type: "address",
        },
        {
          internalType: "uint256",
          name: "pointsRequired",
          type: "uint256",
        },
      ],
      name: "addRewardToken",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [],
      name: "bonusMultiplier",
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
      inputs: [],
      name: "cooldownPeriod",
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
      inputs: [],
      name: "getActiveUsersCount",
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
          internalType: "address",
          name: "user",
          type: "address",
        },
      ],
      name: "isActiveUser",
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
      name: "minInteractionsForBonus",
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
      inputs: [],
      name: "owner",
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
      inputs: [],
      name: "pointsPerInteraction",
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
      inputs: [],
      name: "recordInteraction",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "address",
          name: "rewardToken",
          type: "address",
        },
      ],
      name: "redeemPoints",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [],
      name: "register",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [],
      name: "renounceOwnership",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "address",
          name: "",
          type: "address",
        },
      ],
      name: "rewardPointsRequired",
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
      name: "rewardTokens",
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
          name: "newCooldown",
          type: "uint256",
        },
      ],
      name: "setCooldownPeriod",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "uint256",
          name: "newPoints",
          type: "uint256",
        },
      ],
      name: "setPointsPerInteraction",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "address",
          name: "newOwner",
          type: "address",
        },
      ],
      name: "transferOwnership",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "address",
          name: "",
          type: "address",
        },
      ],
      name: "userActivities",
      outputs: [
        {
          internalType: "uint256",
          name: "interactionCount",
          type: "uint256",
        },
        {
          internalType: "uint256",
          name: "lastInteractionTimestamp",
          type: "uint256",
        },
        {
          internalType: "uint256",
          name: "totalPoints",
          type: "uint256",
        },
        {
          internalType: "bool",
          name: "isActive",
          type: "bool",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
  ];

  const loyaltyContract = new ethers.Contract(contractAddress, abi, userWallet);

  // 1. Check if user is registered
  const isActive = await loyaltyContract.isActiveUser(userWallet.address);
  console.log(`Is user registered? ${isActive}`);

  if (!isActive) {
    console.log("Registering user...");
    const txRegister = await loyaltyContract.register();
    await txRegister.wait();
    console.log("User registered successfully!");
  } else {
    console.log("User already registered.");
  }

  // 2. Record interaction (catch cooldown error)
  try {
    console.log("Recording interaction...");
    const txInteract = await loyaltyContract.recordInteraction();
    await txInteract.wait();
    console.log("Interaction recorded.");
  } catch (err: any) {
    console.error(
      "Failed to record interaction. Maybe cooldown not passed?",
      err.reason || err.message,
    );
  }

  // 3. Read rewardTokens length from storage slot 1
  const slotIndex = 1; // Assuming rewardTokens is stored at slot 1
  const rawLength = await provider.getStorageAt(contractAddress, slotIndex);
  const rewardTokensLength = ethers.BigNumber.from(rawLength).toNumber();
  console.log("Reward tokens count (from storage):", rewardTokensLength);

  // 4. Calculate base slot for array elements
  const baseSlot = ethers.utils.keccak256(
    ethers.utils.defaultAbiCoder.encode(["uint256"], [slotIndex]),
  );
  const baseSlotBN = ethers.BigNumber.from(baseSlot);

  // 5. Fetch each reward token address
  const rewardTokens: string[] = [];

  for (let i = 0; i < rewardTokensLength; i++) {
    const elementSlot = baseSlotBN.add(i);
    const rawAddress = await provider.getStorageAt(
      contractAddress,
      elementSlot,
    );
    // Addresses are stored as right-padded 32 bytes, last 20 bytes are address
    const tokenAddress = ethers.utils.getAddress("0x" + rawAddress.slice(26));
    rewardTokens.push(tokenAddress);
  }

  console.log("Reward tokens:", rewardTokens);

  // 6. For each reward token, get points required and check if user has enough points
  const userActivity = await loyaltyContract.userActivities(userWallet.address);
  const userPoints = userActivity.totalPoints.toNumber
    ? userActivity.totalPoints.toNumber()
    : userActivity.totalPoints;

  for (const token of rewardTokens) {
    const pointsRequired = await loyaltyContract.rewardPointsRequired(token);
    console.log(
      `Token: ${token}, Points Required: ${pointsRequired.toString()}`,
    );

    if (userPoints >= pointsRequired) {
      console.log(`Attempting to redeem points for token ${token}...`);
      try {
        const txRedeem = await loyaltyContract.redeemPoints(token);
        const receipt = await txRedeem.wait();
        console.log(
          `Redeemed points for ${token}. Tx: ${receipt.transactionHash}`,
        );
      } catch (err: any) {
        console.error(
          `Redeem failed for token ${token}:`,
          err.reason || err.message,
        );
      }
    } else {
      console.log(
        `Not enough points to redeem token ${token}. User points: ${userPoints}`,
      );
    }
  }
}

main().catch((error) => {
  console.error("Error running script:", error);
  process.exit(1);
});
