// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
    function allowance(address owner, address spender) external view returns (uint256);
}

contract DegenJackpot {
    address public owner;
    address public devWallet;
    
    IERC20 public constant degenToken = IERC20(0x4ed4E862860beD51a9570b96d89aF5E1B0Efefed); // DEGEN on Base
    
    uint256 public constant TICKET_PRICE = 250 * 1e18; // 250 DEGEN (18 decimals)
    uint256 public constant DEV_FEE_PERCENT = 5; // 5% fee on winnings
    uint256 public constant WIN_PROBABILITY = 9; // 9% chance to win
    
    struct Round {
        uint256 roundId;
        uint256 startTime;
        uint256 endTime;
        uint256 pot;
        uint256 participantCount;
        address[] participants;
        address winner;
        uint256 winningAmount;
        bool claimed;
        bool drawCompleted;
    }
    
    mapping(uint256 => Round) public rounds;
    mapping(address => mapping(uint256 => uint256)) public userTickets;
    mapping(address => uint256[]) public userRounds;
    mapping(address => uint256[]) public userWins;
    
    // Frontend optimization
    address[] public allParticipants;
    mapping(address => bool) public isParticipant;
    mapping(uint256 => address[]) public roundWinners;
    
    uint256 public currentRoundId;
    uint256 public drawInterval = 1 days;
    uint256 public totalJackpot;
    
    // Events
    event TicketPurchased(address indexed buyer, uint256 roundId, uint256 amount);
    event WinnerSelected(uint256 roundId, address indexed winner, uint256 amount);
    event WinningsClaimed(uint256 roundId, address indexed winner, uint256 amount);
    event RoundAdvanced(uint256 newRoundId, uint256 carryOverPot);

    constructor(address _devWallet) {
        require(_devWallet != address(0), "Invalid dev wallet");
        owner = msg.sender;
        devWallet = _devWallet;
        _startNewRound(0);
    }

    // ========================
    // Core Functions
    // ========================

    function buyTickets(uint256 ticketCount) external {
        require(ticketCount > 0, "Must buy at least one ticket");
        uint256 totalCost = ticketCount * TICKET_PRICE;
        require(degenToken.transferFrom(msg.sender, address(this), totalCost), "DEGEN transfer failed");
        
        Round storage currentRound = rounds[currentRoundId];
        require(!currentRound.drawCompleted, "Round completed");

        if (userTickets[msg.sender][currentRoundId] == 0) {
            currentRound.participants.push(msg.sender);
            currentRound.participantCount++;
            userRounds[msg.sender].push(currentRoundId);
            
            if (!isParticipant[msg.sender]) {
                isParticipant[msg.sender] = true;
                allParticipants.push(msg.sender);
            }
        }

        userTickets[msg.sender][currentRoundId] += ticketCount;
        currentRound.pot += totalCost;
        totalJackpot += totalCost;

        emit TicketPurchased(msg.sender, currentRoundId, ticketCount);
    }

    function triggerDraw() external {
        Round storage currentRound = rounds[currentRoundId];
        require(block.timestamp >= currentRound.startTime + drawInterval, "Too soon");
        require(!currentRound.drawCompleted, "Already drawn");

        currentRound.drawCompleted = true;
        currentRound.endTime = block.timestamp;

        uint256 randomNumber = uint256(
            keccak256(
                abi.encodePacked(
                    blockhash(block.number - 1),
                    block.timestamp,
                    currentRound.participants.length,
                    currentRound.pot
                )
            )
        );

        bool hasWinner = (randomNumber % 100) < WIN_PROBABILITY;
        uint256 carryOverPot = 0;

        if (hasWinner && currentRound.participantCount > 0) {
            uint256 winningTicket = randomNumber % currentRound.pot;
            uint256 runningTotal;
            address winner;
            
            for (uint256 i = 0; i < currentRound.participantCount; i++) {
                address participant = currentRound.participants[i];
                runningTotal += userTickets[participant][currentRoundId] * TICKET_PRICE;
                if (runningTotal > winningTicket) {
                    winner = participant;
                    break;
                }
            }

            currentRound.winner = winner;
            currentRound.winningAmount = (currentRound.pot * (100 - DEV_FEE_PERCENT)) / 100;
            
            userWins[winner].push(currentRoundId);
            roundWinners[currentRoundId].push(winner);

            emit WinnerSelected(currentRoundId, winner, currentRound.winningAmount);
        } else {
            carryOverPot = currentRound.pot;
        }

        _startNewRound(carryOverPot);
    }

    function claimWinnings(uint256 roundId) external {
        Round storage round = rounds[roundId];
        require(round.winner == msg.sender, "Not winner");
        require(!round.claimed, "Already claimed");
        require(round.winningAmount > 0, "No winnings");

        uint256 devFee = (round.winningAmount * DEV_FEE_PERCENT) / (100 - DEV_FEE_PERCENT);
        uint256 totalPayout = round.winningAmount + devFee;

        round.claimed = true;
        totalJackpot -= totalPayout;

        require(degenToken.transfer(devWallet, devFee), "Dev fee transfer failed");
        require(degenToken.transfer(msg.sender, round.winningAmount), "Winner transfer failed");

        emit WinningsClaimed(roundId, msg.sender, round.winningAmount);
    }

    // ========================
    // View Functions
    // ========================

    function getTimeUntilDraw() public view returns (uint256) {
        Round memory currentRound = rounds[currentRoundId];
        if (block.timestamp >= currentRound.startTime + drawInterval) {
            return 0;
        }
        return (currentRound.startTime + drawInterval) - block.timestamp;
    }

    function getCurrentRound() public view returns (Round memory) {
        return rounds[currentRoundId];
    }

    function getRoundParticipants(uint256 roundId) public view returns (address[] memory) {
        return rounds[roundId].participants;
    }

    function getUserRounds(address user) public view returns (uint256[] memory) {
        return userRounds[user];
    }

    function getUserWins(address user) public view returns (uint256[] memory) {
        return userWins[user];
    }

    function hasUnclaimedWinnings(address user) public view returns (bool) {
        uint256[] memory wins = userWins[user];
        for (uint256 i = 0; i < wins.length; i++) {
            if (!rounds[wins[i]].claimed) {
                return true;
            }
        }
        return false;
    }

    function getUnclaimedRounds(address user) public view returns (uint256[] memory) {
        uint256[] memory wins = userWins[user];
        uint256 count = 0;
        
        for (uint256 i = 0; i < wins.length; i++) {
            if (!rounds[wins[i]].claimed) {
                count++;
            }
        }
        
        uint256[] memory unclaimed = new uint256[](count);
        uint256 index = 0;
        for (uint256 i = 0; i < wins.length; i++) {
            if (!rounds[wins[i]].claimed) {
                unclaimed[index] = wins[i];
                index++;
            }
        }
        
        return unclaimed;
    }

    function getDashboardData(address user) public view returns (
        uint256 currentRound,
        uint256 timeUntilDraw,
        uint256 currentPot,
        uint256 userTicketsCurrentRound,
        bool hasUnclaimed,
        uint256 totalWinnings,
        uint256 totalParticipants
    ) {
        currentRound = currentRoundId;
        timeUntilDraw = getTimeUntilDraw();
        currentPot = rounds[currentRoundId].pot;
        userTicketsCurrentRound = userTickets[user][currentRoundId];
        hasUnclaimed = hasUnclaimedWinnings(user);
        totalWinnings = getTotalWinnings(user);
        totalParticipants = allParticipants.length;
        
        return (
            currentRound,
            timeUntilDraw,
            currentPot,
            userTicketsCurrentRound,
            hasUnclaimed,
            totalWinnings,
            totalParticipants
        );
    }

    function getTotalWinnings(address user) public view returns (uint256) {
        uint256[] memory wins = userWins[user];
        uint256 total = 0;
        for (uint256 i = 0; i < wins.length; i++) {
            total += rounds[wins[i]].winningAmount;
        }
        return total;
    }

    // ========================
    // Admin Functions
    // ========================

    function setDrawInterval(uint256 newInterval) external onlyOwner {
        require(newInterval >= 1 hours && newInterval <= 7 days, "Invalid interval");
        drawInterval = newInterval;
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Invalid address");
        owner = newOwner;
    }

    function emergencyWithdraw() external onlyOwner {
        uint256 balance = degenToken.balanceOf(address(this));
        require(degenToken.transfer(owner, balance), "Emergency withdraw failed");
    }

    // ========================
    // Private Functions
    // ========================

    function _startNewRound(uint256 carryOverPot) private {
        currentRoundId++;
        rounds[currentRoundId] = Round({
            roundId: currentRoundId,
            startTime: block.timestamp,
            endTime: 0,
            pot: carryOverPot,
            participantCount: 0,
            participants: new address[](0),
            winner: address(0),
            winningAmount: 0,
            claimed: false,
            drawCompleted: false
        });
        emit RoundAdvanced(currentRoundId, carryOverPot);
    }

    // ========================
    // Modifiers
    // ========================

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    // ========================
    // Fallback
    // ========================

    receive() external payable {
        revert("Use buyTickets() for DEGEN");
    }
}