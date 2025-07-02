// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract CeloDailyCheckIn {
    address public admin;
    uint256 public currentRound;
    uint256 public rewardAmount = 1 ether; // 1 CELO
    address public trustedSigner;
    uint256 public checkInFee = 0.001 ether; // ~0.1¢ at $0.50/CELO

    struct Round {
        uint256 startTime;
        bool isActive;
        uint256 participantCount;
        uint256 totalCheckIns;
    }

    struct UserRoundData {
        uint256 checkInCount;
        bool hasClaimed;
    }

    // Storage
    mapping(uint256 => Round) public rounds;
    mapping(uint256 => mapping(address => mapping(uint256 => bool))) public dailyCheckIns;
    mapping(uint256 => mapping(address => UserRoundData)) public userRoundData;
    mapping(uint256 => mapping(uint256 => bool)) public fidUsedInRound;

    // Events
    event CheckedIn(address indexed user, uint256 indexed day, uint256 round);
    event RewardClaimed(address indexed user, uint256 round);
    event FundsDeposited(address indexed depositor, uint256 amount);
    event RoundStarted(uint256 indexed round);
    event RoundEnded(uint256 indexed round);

    constructor(address _trustedSigner) {
        admin = msg.sender;
        trustedSigner = _trustedSigner;
        currentRound = 1;
        rounds[currentRound] = Round(block.timestamp, true, 0, 0);
        emit RoundStarted(currentRound);
    }

    // ========================
    // Core User Functions
    // ========================

    function checkIn(
        uint256 day,
        bytes memory signature
    ) external payable {
        require(rounds[currentRound].isActive, "Round inactive");
        require(msg.value == checkInFee, "Incorrect fee");
        require(day >= 1 && day <= 7, "Invalid day");
        require(!dailyCheckIns[currentRound][msg.sender][day], "Already checked in");

        // Verify signature for check-in
        bytes32 messageHash = keccak256(abi.encodePacked(msg.sender, day, currentRound));
        bytes32 ethSignedMessageHash = getEthSignedMessageHash(messageHash);
        require(verifySignature(ethSignedMessageHash, signature), "Invalid signature");

        // First check-in this round? Count as new participant
        if (userRoundData[currentRound][msg.sender].checkInCount == 0) {
            rounds[currentRound].participantCount++;
        }

        dailyCheckIns[currentRound][msg.sender][day] = true;
        userRoundData[currentRound][msg.sender].checkInCount++;
        rounds[currentRound].totalCheckIns++;

        emit CheckedIn(msg.sender, day, currentRound);
    }

    function claimReward(
        uint256 fid,
        bytes memory signature
    ) external {
        require(rounds[currentRound].isActive, "Round inactive");
        require(!userRoundData[currentRound][msg.sender].hasClaimed, "Already claimed");
        require(!fidUsedInRound[currentRound][fid], "FID used");
        require(_hasCheckedIn7Days(msg.sender), "Missing check-ins");

        // Verify signature for claim
        bytes32 messageHash = keccak256(abi.encodePacked(msg.sender, fid, currentRound));
        bytes32 ethSignedMessageHash = getEthSignedMessageHash(messageHash);
        require(verifySignature(ethSignedMessageHash, signature), "Invalid signature");

        userRoundData[currentRound][msg.sender].hasClaimed = true;
        fidUsedInRound[currentRound][fid] = true;
        payable(msg.sender).transfer(rewardAmount);

        emit RewardClaimed(msg.sender, currentRound);
    }

    // ========================
    // Signature Verification
    // ========================

    function verifySignature(bytes32 ethSignedMessageHash, bytes memory signature) internal view returns (bool) {
        return recoverSigner(ethSignedMessageHash, signature) == trustedSigner;
    }

    function getEthSignedMessageHash(bytes32 messageHash) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", messageHash));
    }

    function recoverSigner(bytes32 ethSignedMessageHash, bytes memory signature) internal pure returns (address) {
        (uint8 v, bytes32 r, bytes32 s) = splitSignature(signature);
        return ecrecover(ethSignedMessageHash, v, r, s);
    }

    function splitSignature(bytes memory sig) internal pure returns (uint8 v, bytes32 r, bytes32 s) {
        require(sig.length == 65, "Invalid signature length");

        assembly {
            r := mload(add(sig, 32))
            s := mload(add(sig, 64))
            v := byte(0, mload(add(sig, 96)))
        }

        return (v, r, s);
    }

    // ========================
    // Analytics Functions
    // ========================

    function getActiveRound() public view returns (Round memory) {
        return rounds[currentRound];
    }

    function getAllRounds() public view returns (Round[] memory) {
        Round[] memory allRounds = new Round[](currentRound);
        for (uint256 i = 1; i <= currentRound; i++) {
            allRounds[i-1] = rounds[i];
        }
        return allRounds;
    }

    function getUserStatus(address user) public view returns (
        uint256 currentCheckIns,
        bool eligibleForReward,
        bool hasClaimed
    ) {
        UserRoundData memory data = userRoundData[currentRound][user];
        return (
            data.checkInCount,
            data.checkInCount >= 7,
            data.hasClaimed
        );
    }

    // ========================
    // Admin Functions
    // ========================

    function startNewRound() external onlyAdmin {
        currentRound++;
        rounds[currentRound] = Round(block.timestamp, true, 0, 0);
        emit RoundStarted(currentRound);
    }

    function stopRound() external onlyAdmin {
        rounds[currentRound].isActive = false;
        emit RoundEnded(currentRound);
    }

    function withdrawFunds() external onlyAdmin {
        payable(admin).transfer(address(this).balance);
    }

    function setCheckInFee(uint256 newFee) external onlyAdmin {
        checkInFee = newFee;
    }

    function setTrustedSigner(address newSigner) external onlyAdmin {
        trustedSigner = newSigner;
    }

    // ========================
    // Internal Helpers
    // ========================

    function _hasCheckedIn7Days(address user) internal view returns (bool) {
        for (uint256 day = 1; day <= 7; day++) {
            if (!dailyCheckIns[currentRound][user][day]) return false;
        }
        return true;
    }

    function deposit() external payable {
        require(msg.value > 0, "Must send some CELO");
        emit FundsDeposited(msg.sender, msg.value);
    }

    modifier onlyAdmin() {
        require(msg.sender == admin, "Not admin");
        _;
    }

    // Accept direct deposits
    receive() external payable {
        emit FundsDeposited(msg.sender, msg.value);
    }
}