// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";

interface IBankOfCelo {
    function claim(uint256 fid) external;
}

contract BankOfCeloRelay is Ownable {
    IBankOfCelo public immutable bank;
    mapping(bytes32 => bool) public usedSignatures;
    mapping(address => uint256) public lastClaimTime;
    uint256 public claimCooldown = 1 days;
    
    event ClaimRelayed(address indexed user, uint256 fid);

    constructor(address bankAddress) Ownable(msg.sender) {
        bank = IBankOfCelo(bankAddress);
    }

    function relayClaim(
        address user,
        uint256 fid,
        uint256 deadline,
        bytes calldata signature
    ) external {
        // Prevent signature reuse
        bytes32 sigHash = keccak256(abi.encodePacked(signature));
        require(!usedSignatures[sigHash], "Signature already used");
        usedSignatures[sigHash] = true;

        // Verify claim cooldown
        require(block.timestamp >= lastClaimTime[user] + claimCooldown, "Claim cooldown active");

        // Verify deadline
        require(block.timestamp <= deadline, "Claim window expired");

        // Verify signature
        bytes32 messageHash = keccak256(abi.encodePacked(
            user, fid, deadline, address(this)
        ));
        require(recoverSigner(messageHash, signature) == user, "Invalid signature");

        // Update last claim time
        lastClaimTime[user] = block.timestamp;

        // Execute claim
        bank.claim(fid);

        // Forward funds to user
        (bool success,) = user.call{value: 0.5 ether}("");
        require(success, "Fund transfer failed");

        emit ClaimRelayed(user, fid);
    }

    function setClaimCooldown(uint256 cooldown) external onlyOwner {
        claimCooldown = cooldown;
    }

    function withdrawFunds() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }

    function recoverSigner(bytes32 hash, bytes memory signature) internal pure returns (address) {
        (bytes32 r, bytes32 s, uint8 v) = splitSignature(signature);
        return ecrecover(hash, v, r, s);
    }

    function splitSignature(bytes memory sig) internal pure returns (bytes32 r, bytes32 s, uint8 v) {
        require(sig.length == 65, "Invalid signature length");
        assembly {
            r := mload(add(sig, 32))
            s := mload(add(sig, 64))
            v := byte(0, mload(add(sig, 96)))
        }
    }
}