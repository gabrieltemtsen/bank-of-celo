// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

contract LoyaltyRewards is Ownable {
    using EnumerableSet for EnumerableSet.AddressSet;

    // Track user interactions
    struct UserActivity {
        uint256 interactionCount;
        uint256 lastInteractionTimestamp;
        uint256 totalPoints;
        bool isActive;
    }

    // Events
    event UserRegistered(address indexed user);
    event InteractionRecorded(address indexed user, uint256 pointsEarned);
    event PointsRedeemed(address indexed user, uint256 points);
    event RewardAdded(address indexed rewardToken, uint256 pointsRequired);

    // State variables
    mapping(address => UserActivity) public userActivities;
    EnumerableSet.AddressSet private activeUsers;
    
    uint256 public pointsPerInteraction = 10;
    uint256 public cooldownPeriod = 86400; // 24 hours in seconds
    uint256 public minInteractionsForBonus = 3;
    uint256 public bonusMultiplier = 2;

    // Reward system
    mapping(address => uint256) public rewardPointsRequired; // token => points needed
    address[] public rewardTokens;

    constructor(address initialOwner) Ownable(initialOwner) {}

    // Modifier to check cooldown period
    modifier checkCooldown(address user) {
        require(
            block.timestamp >= userActivities[user].lastInteractionTimestamp + cooldownPeriod,
            "Must wait for cooldown period"
        );
        _;
    }

    // Register as an active user
    function register() external {
        require(!userActivities[msg.sender].isActive, "Already registered");
        
        userActivities[msg.sender] = UserActivity({
            interactionCount: 0,
            lastInteractionTimestamp: 0,
            totalPoints: 0,
            isActive: true
        });
        
        activeUsers.add(msg.sender);
        emit UserRegistered(msg.sender);
    }

    // Record an interaction
    function recordInteraction() external checkCooldown(msg.sender) {
        require(userActivities[msg.sender].isActive, "Not registered");
        
        UserActivity storage activity = userActivities[msg.sender];
        uint256 pointsEarned = pointsPerInteraction;
        
        // Bonus for frequent interactions
        if (activity.interactionCount > 0 && 
            activity.interactionCount % minInteractionsForBonus == 0) {
            pointsEarned *= bonusMultiplier;
        }
        
        activity.interactionCount++;
        activity.totalPoints += pointsEarned;
        activity.lastInteractionTimestamp = block.timestamp;
        
        emit InteractionRecorded(msg.sender, pointsEarned);
    }

    // Redeem points for rewards
    function redeemPoints(address rewardToken) external {
        require(userActivities[msg.sender].isActive, "Not registered");
        require(rewardPointsRequired[rewardToken] > 0, "Reward not available");
        
        UserActivity storage activity = userActivities[msg.sender];
        uint256 pointsRequired = rewardPointsRequired[rewardToken];
        
        require(activity.totalPoints >= pointsRequired, "Insufficient points");
        
        activity.totalPoints -= pointsRequired;
        
        // In a real implementation, you would transfer the reward token here
        emit PointsRedeemed(msg.sender, pointsRequired);
    }

    // Admin functions
    function addRewardToken(address token, uint256 pointsRequired) external onlyOwner {
        require(rewardPointsRequired[token] == 0, "Token already added");
        rewardTokens.push(token);
        rewardPointsRequired[token] = pointsRequired;
        emit RewardAdded(token, pointsRequired);
    }

    function setPointsPerInteraction(uint256 newPoints) external onlyOwner {
        pointsPerInteraction = newPoints;
    }

    function setCooldownPeriod(uint256 newCooldown) external onlyOwner {
        cooldownPeriod = newCooldown;
    }

    function getActiveUsersCount() external view returns (uint256) {
        return activeUsers.length();
    }

    function isActiveUser(address user) external view returns (bool) {
        return activeUsers.contains(user);
    }
}