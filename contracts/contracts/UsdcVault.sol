// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract BaseUSDCVault is Ownable {
    // USDC token on Base mainnet: 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
    IERC20 public constant USDC = IERC20(0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913);
    
    // DEGEN token on Base mainnet: 0x4ed4E862860beD51a9570b96d89aF5E1B0Efefed
    IERC20 public constant rewardToken = IERC20(0x4ed4E862860beD51a9570b96d89aF5E1B0Efefed);
    
    struct Deposit {
        uint256 amount;
        uint256 timestamp;
        uint256 rewardDebt;
    }
    
    mapping(address => Deposit) public deposits;
    uint256 public totalDeposits;
    uint256 public rewardRate; // Reward tokens per second per USDC
    
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
        
        // Transfer USDC from user to contract
        USDC.transferFrom(msg.sender, address(this), amount);
        
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
        
        // Transfer USDC back to user
        USDC.transfer(msg.sender, amount);
        
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
        require(token != address(USDC) && token != address(rewardToken), 
            "Cannot withdraw vault tokens");
        IERC20(token).transfer(owner(), amount);
    }
    
    function getUserDeposit(address user) external view returns (uint256 amount, uint256 timestamp) {
        Deposit storage userDeposit = deposits[user];
        return (userDeposit.amount, userDeposit.timestamp);
    }
}