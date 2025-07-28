// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract CeloEURVault is Ownable {
    // cEUR token on Celo mainnet: 0xD8763CBa276a3738E6DE85b4b3bF5FDed6D6cA73
    IERC20 public constant cEUR = IERC20(0xD8763CBa276a3738E6DE85b4b3bF5FDed6D6cA73);
    
    // CELO token on Celo mainnet: 0x471EcE3750Da237f93B8E339c536989b8978a438
    IERC20 public constant rewardToken = IERC20(0x471EcE3750Da237f93B8E339c536989b8978a438);
    
    struct Deposit {
        uint256 amount;
        uint256 timestamp;
        uint256 rewardDebt;
    }
    
    mapping(address => Deposit) public deposits;
    uint256 public totalDeposits;
    uint256 public rewardRate; // Reward tokens per second per cEUR
    
    event Deposited(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount, uint256 reward);
    event RewardRateUpdated(uint256 newRate);
    event RewardsDistributed(address indexed user, uint256 amount);
    
    constructor() Ownable(msg.sender) {}  // Initialize Ownable with deployer as owner
    
    // User functions
    
    function deposit(uint256 amount) external {
        require(amount > 0, "Amount must be greater than 0");
        
        Deposit storage userDeposit = deposits[msg.sender];
        
        // Claim any pending rewards first
        if (userDeposit.amount > 0) {
            uint256 pending = pendingReward(msg.sender);
            if (pending > 0) {
                rewardToken.transfer(msg.sender, pending);
                emit RewardsDistributed(msg.sender, pending);
            }
        }
        
        // Transfer cEUR from user to contract
        cEUR.transferFrom(msg.sender, address(this), amount);
        
        // Update deposit
        userDeposit.amount += amount;
        userDeposit.timestamp = block.timestamp;
        userDeposit.rewardDebt = userDeposit.amount * rewardRate * (block.timestamp - userDeposit.timestamp);
        
        totalDeposits += amount;
        
        emit Deposited(msg.sender, amount);
    }
    
    function withdraw(uint256 amount) external {
        Deposit storage userDeposit = deposits[msg.sender];
        require(userDeposit.amount >= amount, "Insufficient balance");
        
        // Calculate and transfer rewards
        uint256 reward = pendingReward(msg.sender);
        if (reward > 0) {
            rewardToken.transfer(msg.sender, reward);
            emit RewardsDistributed(msg.sender, reward);
        }
        
        // Transfer cEUR back to user
        cEUR.transfer(msg.sender, amount);
        
        // Update deposit
        userDeposit.amount -= amount;
        userDeposit.timestamp = block.timestamp;
        userDeposit.rewardDebt = userDeposit.amount * rewardRate * (block.timestamp - userDeposit.timestamp);
        
        totalDeposits -= amount;
        
        emit Withdrawn(msg.sender, amount, reward);
    }
    
    function pendingReward(address user) public view returns (uint256) {
        Deposit storage userDeposit = deposits[user];
        if (userDeposit.amount == 0) return 0;
        
        uint256 timeElapsed = block.timestamp - userDeposit.timestamp;
        return (userDeposit.amount * rewardRate * timeElapsed) - userDeposit.rewardDebt;
    }
    
    // Admin functions
    
    function setRewardRate(uint256 _rewardRate) external onlyOwner {
        rewardRate = _rewardRate;
        emit RewardRateUpdated(_rewardRate);
    }
    
    function depositRewards(uint256 amount) external onlyOwner {
        rewardToken.transferFrom(msg.sender, address(this), amount);
    }
    
    function emergencyWithdraw(address token, uint256 amount) external onlyOwner {
        require(token != address(cEUR) && token != address(rewardToken), 
            "Cannot withdraw vault tokens");
        IERC20(token).transfer(owner(), amount);
    }
    
    function getUserDeposit(address user) external view returns (uint256 amount, uint256 timestamp) {
        Deposit storage userDeposit = deposits[user];
        return (userDeposit.amount, userDeposit.timestamp);
    }
}