// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract FarQuest {
    address public owner;
    uint256 public registrationFee = 0.1 ether; // 0.1 Celo
    uint256 public rewardAmount = 1 ether; // 1 Celo
    
    // Secret hash that will be verified during reward claiming
    bytes32 public secretHash;
    
    struct User {
        bool registered;
        uint256 totalRewards;
        uint256 lastClaimedLevel;
    }
    
    mapping(address => User) public users;
    address[] public registeredUsers;
    
    event UserRegistered(address indexed user);
    event RewardClaimed(address indexed user, uint256 level, uint256 amount);
    
    constructor(bytes32 _secretHash) {
        owner = msg.sender;
        secretHash = _secretHash;
    }
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }
    
    // Register function - pays 0.1 Celo to join
    function register() external payable {
        require(!users[msg.sender].registered, "Already registered");
        require(msg.value == registrationFee, "Incorrect registration fee");
        
        users[msg.sender].registered = true;
        registeredUsers.push(msg.sender);
        
        emit UserRegistered(msg.sender);
    }
    
    // Claim reward function - requires level and secret from frontend
    function claimReward(uint256 level, string memory secret) external {
        require(users[msg.sender].registered, "Not registered");
        require(level > users[msg.sender].lastClaimedLevel, "Already claimed this level");
        require(keccak256(abi.encodePacked(secret)) == secretHash, "Invalid secret");
        
        // Update user stats
        users[msg.sender].totalRewards += rewardAmount;
        users[msg.sender].lastClaimedLevel = level;
        
        // Transfer reward
        payable(msg.sender).transfer(rewardAmount);
        
        emit RewardClaimed(msg.sender, level, rewardAmount);
    }
    
    // Owner function to update the secret hash
    function setSecretHash(bytes32 _secretHash) external onlyOwner {
        secretHash = _secretHash;
    }
    
    // Owner function to withdraw contract balance
    function withdrawFunds() external onlyOwner {
        payable(owner).transfer(address(this).balance);
    }
    
    // Get total number of registered users
    function getTotalUsers() external view returns (uint256) {
        return registeredUsers.length;
    }
    
    // Get top users for leaderboard (sorted by total rewards)
    function getLeaderboard(uint256 count) external view returns (address[] memory, uint256[] memory) {
        uint256 actualCount = count < registeredUsers.length ? count : registeredUsers.length;
        
        address[] memory topUsers = new address[](actualCount);
        uint256[] memory rewards = new uint256[](actualCount);
        
        // This is a simplified approach. For a real leaderboard with many users,
        // you might want to sort off-chain or implement a more efficient on-chain sorting mechanism.
        
        // Copy all users (simplified - in production you'd want a better sorting mechanism)
        for (uint256 i = 0; i < actualCount; i++) {
            topUsers[i] = registeredUsers[i];
            rewards[i] = users[registeredUsers[i]].totalRewards;
        }
        
        return (topUsers, rewards);
    }
    
    // Function to receive Celo
    receive() external payable {}
}