// deployments/LoyaltyRewardsModule.ts
import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const LoyaltyRewardsModule = buildModule("LoyaltyRewardsModule", (m) => {
  // Parameters with default values
  const initialOwner = m.getParameter(
    "_initialOwner",
    "0xbE95bb47789E5f4Af467306C97DED0877BF817B5", // Same dev wallet as your example
  );

  // Deploy the LoyaltyRewards contract
  const loyaltyRewards = m.contract("LoyaltyRewards", [initialOwner]);

  // Optional: You can add post-deployment transactions here
  // For example, adding reward tokens immediately after deployment
  // m.call(loyaltyRewards, "addRewardToken", [
  //   "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE", // Example token address
  //   100 // Points required
  // ]);

  return { loyaltyRewards };
});

export default LoyaltyRewardsModule;
