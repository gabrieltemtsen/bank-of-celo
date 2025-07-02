// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract CeloDailyCheckInV2 {
    address public admin;
    uint256 public currentRound;
    uint256 public rewardAmount;
    address public trustedSigner;
    uint256 public checkInFee = 0.001 ether; // ~0.1¢ at $0.50/CELO
    address[] public allParticipants;
    mapping(address => bool) public isParticipant;

    struct Round {
        uint256 startTime;
        bool isActive;
        uint256 participantCount;
        uint256 totalCheckIns;
        uint256 duration; // In days
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
    mapping(uint256 => mapping(uint256 => address[])) public addressesClaimedPerDay;
    mapping(uint256 => mapping(uint256 => uint256)) public claimCountPerDay;
    mapping(uint256 => mapping(address => bool)) public hasClaimedDay;

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
        rounds[currentRound] = Round(block.timestamp, true, 0, 0, 7); // 7-day round
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
        // Track new participants
    if (!isParticipant[msg.sender]) {
        isParticipant[msg.sender] = true;
        allParticipants.push(msg.sender);
    }

        // First check-in this round? Count as new participant
        if (userRoundData[currentRound][msg.sender].checkInCount == 0) {
            rounds[currentRound].participantCount++;
        }

        dailyCheckIns[currentRound][msg.sender][day] = true;
        userRoundData[currentRound][msg.sender].checkInCount++;
        rounds[currentRound].totalCheckIns++;
        addressesClaimedPerDay[currentRound][day].push(msg.sender);
        claimCountPerDay[currentRound][day]++;
        hasClaimedDay[currentRound][msg.sender] = true;

        emit CheckedIn(msg.sender, day, currentRound);
    }
    // Get all addresses that checked in on a specific day
    function getAddressesForDay(uint256 round, uint256 day) public view onlyAdmin returns (address[] memory) {
        require(day >= 1 && day <= 7, "Invalid day");
        return addressesClaimedPerDay[round][day];
    }

    // Get check-in count for a specific day
    function getCheckInCountForDay(uint256 round, uint256 day) public view returns (uint256) {
        require(day >= 1 && day <= 7, "Invalid day");
        return claimCountPerDay[round][day];
    }

    // Check if a specific address has checked in on a day
    function hasAddressCheckedInDay(uint256 round, uint256 day, address user) public view returns (bool) {
        require(day >= 1 && day <= 7, "Invalid day");
        return dailyCheckIns[round][user][day];
    }

    function claimReward(
        uint256 fid,
        bytes memory signature
    ) external {
        require(rounds[currentRound].isActive, "Round inactive");
        require(address(this).balance >= rewardAmount, "Insufficient contract balance");
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
    function setRewardAmount(uint256 newAmount) external onlyAdmin {
        require(newAmount > 0, "Reward must be positive");
        rewardAmount = newAmount;
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
        bool hasClaimed,
        bool _hasCheckedInToday,
        uint256 lastCheckInTimestamp,
        bool[7] memory checkInStatus
    ) {
        UserRoundData memory data = userRoundData[currentRound][user];
        uint256 lastCheckIn = 0;

         // Find most recent check-in timestamp
        for (uint256 day = 1; day <= 7; day++) {
            if (dailyCheckIns[currentRound][user][day]) {
                lastCheckIn = rounds[currentRound].startTime + (day * 86400);
            }
        }
        return (

           data.checkInCount,
            _hasCheckedIn7Days(user),
            data.hasClaimed,
            dailyCheckIns[currentRound][user][getCurrentDay()],
            lastCheckIn,
            getUserCheckInStatus(user)
        );
    }

    // ========================
    // Admin Functions
    // ========================

    function startNewRound() external onlyAdmin {
        currentRound++;
        rounds[currentRound] = Round(block.timestamp, true, 0, 0, 7);
        emit RoundStarted(currentRound);
    }
    function getRoundTimeInfo() public view returns (
    uint256 startTime,
    uint256 endTime,
    uint256 currentDay,
    uint256 daysRemaining
    ) {
        Round memory round = rounds[currentRound];
        uint256 durationInSeconds = round.duration * 86400;
        uint256 elapsed = block.timestamp - round.startTime;
        currentDay = (elapsed / 86400) + 1;
        daysRemaining = round.duration - (elapsed / 86400);
        return (
            round.startTime,
            round.startTime + durationInSeconds,
            currentDay > round.duration ? round.duration : currentDay,
            daysRemaining
        );
    }
    function batchCheckClaimStatus(address[] calldata users) external view returns (bool[] memory) {
    bool[] memory statuses = new bool[](users.length);
    for (uint i = 0; i < users.length; i++) {
        statuses[i] = canUserClaim(users[i]);
    }
    return statuses;
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
    // Get current day of the round (1-7)
    function getCurrentDay() public view returns (uint256) {
        uint256 secondsPerDay = 86400;
        uint256 elapsedDays = (block.timestamp - rounds[currentRound].startTime) / secondsPerDay + 1;
        return elapsedDays % 7 == 0 ? 7 : elapsedDays % 7;
    }

    // Check if user has checked in today
    function hasCheckedInToday(address user) public view returns (bool) {
        return dailyCheckIns[currentRound][user][getCurrentDay()];
    }

    // Get user's check-in status for all days in current round
    function getUserCheckInStatus(address user) public view returns (bool[7] memory) {
        bool[7] memory status;
        for (uint256 day = 1; day <= 7; day++) {
            status[day-1] = dailyCheckIns[currentRound][user][day];
        }
        return status;
    }
    function getContractBalance() public view returns (uint256) {
    return address(this).balance;
    }

    function getRewardAmount() public view returns (uint256) {
        return rewardAmount;
    }

    function getCheckInFee() public view returns (uint256) {
        return checkInFee;
    }

    function canUserClaim(address user) public view returns (bool) {
        return _hasCheckedIn7Days(user) && 
            !userRoundData[currentRound][user].hasClaimed;
    }
    // Get all relevant data in one call
    function getUserDashboard(address user) public view returns (
        uint256 currentRoundNumber,
        uint256 userCheckIns,
        bool canClaim,
        bool checkedInToday,
        uint256 contractBalance,
        uint256 currentReward,
        uint256 currentFee,
        bool roundActive,
        uint256 roundStart,
        uint256 roundEnd,
        uint256 currentDay
    ) {
        currentRoundNumber = currentRound;
        userCheckIns = userRoundData[currentRound][user].checkInCount;
        canClaim = canUserClaim(user);
        checkedInToday = hasCheckedInToday(user);
        contractBalance = getContractBalance();
        currentReward = getRewardAmount();
        currentFee = getCheckInFee();
        roundActive = rounds[currentRound].isActive;
        roundStart = rounds[currentRound].startTime;
        roundEnd = rounds[currentRound].startTime + (rounds[currentRound].duration * 86400);
        currentDay = getCurrentDay();
        
        return (
            currentRoundNumber,
            userCheckIns,
            canClaim,
            checkedInToday,
            contractBalance,
            currentReward,
            currentFee,
            roundActive,
            roundStart,
            roundEnd,
            currentDay
        );
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