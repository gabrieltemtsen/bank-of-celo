// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract FootyScoresClaim is Ownable {
    IERC20 public scoresToken;
    
    // Mapping of address to claimable amount
    mapping(address => uint256) public claimableAmounts;
    
    // Mapping to track who has already claimed
    mapping(address => bool) public hasClaimed;
    
    // Event emitted when tokens are claimed
    event TokensClaimed(address indexed claimant, uint256 amount);
    
    // Event emitted when addresses are whitelisted
    event Whitelisted(address[] addresses, uint256[] amounts);
    
    /**
     * @dev Constructor that sets the Scores token address
     * @param _scoresToken Address of the Scores ERC20 token
     */
  constructor(address _scoresToken, address initialOwner) Ownable(initialOwner) {
        scoresToken = IERC20(_scoresToken);
    }
    
    /**
     * @dev Allows the owner to whitelist addresses and their claimable amounts
     * @param _addresses Array of addresses to whitelist
     * @param _amounts Array of corresponding amounts they can claim
     */
    function whitelistAddresses(address[] calldata _addresses, uint256[] calldata _amounts) external onlyOwner {
        require(_addresses.length == _amounts.length, "Arrays length mismatch");
        
        for (uint256 i = 0; i < _addresses.length; i++) {
            require(_addresses[i] != address(0), "Invalid address");
            claimableAmounts[_addresses[i]] = _amounts[i];
            hasClaimed[_addresses[i]] = false;
        }
        
        emit Whitelisted(_addresses, _amounts);
    }
    
    /**
     * @dev Allows whitelisted addresses to claim their tokens
     */
    function claimTokens() external {
        require(isEligible(msg.sender), "Address is not eligible to claim");
        
        uint256 amount = claimableAmounts[msg.sender];
        
        // Mark as claimed before transferring to prevent reentrancy
        hasClaimed[msg.sender] = true;
        
        // Transfer tokens
        require(scoresToken.transfer(msg.sender, amount), "Transfer failed");
        
        emit TokensClaimed(msg.sender, amount);
    }
    
    /**
     * @dev Check if an address is eligible to claim tokens
     * @param _address Address to check
     * @return bool True if eligible, false otherwise
     */
    function isEligible(address _address) public view returns (bool) {
        return claimableAmounts[_address] > 0 && !hasClaimed[_address];
    }
    
    /**
     * @dev Returns the claimable amount for a specific address
     * @param _address Address to check
     * @return Amount of tokens claimable (0 if already claimed or not whitelisted)
     */
    function getClaimableAmount(address _address) external view returns (uint256) {
        if (!isEligible(_address)) {
            return 0;
        }
        return claimableAmounts[_address];
    }
    
    /**
     * @dev Allows the owner to withdraw any remaining tokens
     */
    function withdrawRemainingTokens() external onlyOwner {
        uint256 balance = scoresToken.balanceOf(address(this));
        require(balance > 0, "No tokens to withdraw");
        require(scoresToken.transfer(owner(), balance), "Transfer failed");
    }
}