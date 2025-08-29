// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title Bakhryaan Blessed Playhouse Leaderboard
 * @dev Smart contract for managing game leaderboards and entry fees on Monad Chain
 * @author BamzzStudio
 * @notice This contract handles 0.1 MON entry fees and distributes rewards to top players
 */
contract BlessedPlayhouseLeaderboard {
    
    // Events
    event GameStarted(address indexed player, uint256 gameType, uint256 entryFee);
    event ScoreSubmitted(address indexed player, uint256 gameType, uint256 score, uint256 timestamp);
    event RewardClaimed(address indexed player, uint256 amount);
    event LeaderboardUpdated(uint256 gameType, address indexed newLeader);
    
    // Structs
    struct PlayerScore {
        address player;
        uint256 score;
        uint256 timestamp;
        string playerName;
    }
    
    struct GameStats {
        uint256 totalPlayers;
        uint256 totalEntryFees;
        uint256 lastReset;
    }
    
    // State variables
    address public owner;
    uint256 public constant ENTRY_FEE = 100000000000000000; // 0.1 MON (18 decimals)
    uint256 public constant MAX_LEADERBOARD_SIZE = 100;
    uint256 public constant REWARD_PERCENTAGE = 80; // 80% of entry fees go to winners
    uint256 public constant PLATFORM_FEE_PERCENTAGE = 20; // 20% platform fee
    
    // Monad chain specific configurations
    uint256 public constant CHAIN_ID = 0x1; // Monad mainnet chain ID
    address public constant MON_TOKEN = 0x0000000000000000000000000000000000000000; // MON token address on Monad
    
    // Game types: 1=Snake, 2=Memory, 3=Math, 4=Color, 5=Tetris, 6=Flappy, 7=Spelling, 8=CarRace
    mapping(uint256 => PlayerScore[]) public leaderboards;
    mapping(uint256 => GameStats) public gameStats;
    mapping(address => uint256) public playerBalances;
    mapping(address => bool) public hasPlayed;
    
    // Anti-cheat and validation mechanisms
    mapping(address => uint256) public lastGameStartTime;
    mapping(address => uint256) public playerGameCount;
    mapping(address => mapping(uint256 => bool)) public hasPlayedGameType;
    mapping(bytes32 => bool) public usedNonces; // Prevent replay attacks
    
    // Game-specific validation rules
    mapping(uint256 => uint256) public maxPossibleScores; // Max possible score per game
    mapping(uint256 => uint256) public minGameDuration; // Minimum game duration in seconds
    
    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }
    
    modifier validGameType(uint256 gameType) {
        require(gameType >= 1 && gameType <= 8, "Invalid game type");
        _;
    }
    
    modifier hasEntryFee() {
        require(msg.value >= ENTRY_FEE, "Insufficient entry fee");
        _;
    }
    
    constructor() {
        owner = msg.sender;
        
        // Initialize game validation rules
        maxPossibleScores[1] = 10000; // Snake: Max 10k points
        maxPossibleScores[2] = 1000;  // Memory: Max 1k points
        maxPossibleScores[3] = 500;   // Math: Max 500 points
        maxPossibleScores[4] = 2000;  // Color: Max 2k points
        maxPossibleScores[5] = 5000;  // Tetris: Max 5k points
        maxPossibleScores[6] = 1000;  // Flappy: Max 1k points
        maxPossibleScores[7] = 100;   // Spelling: Max 100 words
        maxPossibleScores[8] = 1000;  // Car Race: Max 1k laps
        
        // Minimum game durations (in seconds)
        minGameDuration[1] = 10;  // Snake: Min 10 seconds
        minGameDuration[2] = 30;  // Memory: Min 30 seconds
        minGameDuration[3] = 15;  // Math: Min 15 seconds
        minGameDuration[4] = 20;  // Color: Min 20 seconds
        minGameDuration[5] = 30;  // Tetris: Min 30 seconds
        minGameDuration[6] = 5;   // Flappy: Min 5 seconds
        minGameDuration[7] = 60;  // Spelling: Min 60 seconds
        minGameDuration[8] = 15;  // Car Race: Min 15 seconds
    }
    
    /**
     * @dev Start a game by paying entry fee with real validation
     * @param gameType The type of game (1-8)
     * @param playerName Player's display name
     * @param nonce Unique nonce to prevent replay attacks
     */
    function startGame(uint256 gameType, string memory playerName, uint256 nonce) 
        external 
        payable 
        validGameType(gameType) 
        hasEntryFee 
    {
        require(bytes(playerName).length > 0 && bytes(playerName).length <= 20, "Invalid player name");
        require(!hasPlayedGameType[msg.sender][gameType], "Already played this game type");
        
        // Create and validate nonce
        bytes32 nonceHash = keccak256(abi.encodePacked(msg.sender, gameType, nonce, block.timestamp));
        require(!usedNonces[nonceHash], "Nonce already used");
        usedNonces[nonceHash] = true;
        
        // Refund excess payment
        if (msg.value > ENTRY_FEE) {
            payable(msg.sender).transfer(msg.value - ENTRY_FEE);
        }
        
        // Update game stats
        gameStats[gameType].totalPlayers++;
        gameStats[gameType].totalEntryFees += ENTRY_FEE;
        
        // Update player state
        hasPlayed[msg.sender] = true;
        hasPlayedGameType[msg.sender][gameType] = true;
        lastGameStartTime[msg.sender] = block.timestamp;
        playerGameCount[msg.sender]++;
        
        emit GameStarted(msg.sender, gameType, ENTRY_FEE);
    }
    
    /**
     * @dev Submit a score for a specific game with real validation
     * @param gameType The type of game (1-8)
     * @param score The player's score
     * @param playerName Player's display name
     * @param gameDuration Duration of the game in seconds
     * @param nonce Unique nonce to prevent replay attacks
     */
    function submitScore(
        uint256 gameType, 
        uint256 score, 
        string memory playerName,
        uint256 gameDuration,
        uint256 nonce
    ) external validGameType(gameType) {
        require(hasPlayedGameType[msg.sender][gameType], "Must pay entry fee first");
        require(score > 0, "Score must be greater than 0");
        require(score <= maxPossibleScores[gameType], "Score exceeds maximum possible");
        require(gameDuration >= minGameDuration[gameType], "Game duration too short");
        require(bytes(playerName).length > 0 && bytes(playerName).length <= 20, "Invalid player name");
        
        // Validate nonce
        bytes32 nonceHash = keccak256(abi.encodePacked(msg.sender, gameType, score, nonce, block.timestamp));
        require(!usedNonces[nonceHash], "Nonce already used");
        usedNonces[nonceHash] = true;
        
        // Validate game timing
        require(block.timestamp >= lastGameStartTime[msg.sender] + minGameDuration[gameType], "Game ended too quickly");
        
        PlayerScore memory newScore = PlayerScore({
            player: msg.sender,
            score: score,
            timestamp: block.timestamp,
            playerName: playerName
        });
        
        // Add score to leaderboard
        leaderboards[gameType].push(newScore);
        
        // Sort leaderboard (keep only top scores)
        _sortLeaderboard(gameType);
        
        // Check if this is a new leader
        if (leaderboards[gameType].length > 0 && 
            leaderboards[gameType][0].player == msg.sender) {
            emit LeaderboardUpdated(gameType, msg.sender);
        }
        
        emit ScoreSubmitted(msg.sender, gameType, score, block.timestamp);
    }
    
    /**
     * @dev Get top scores for a specific game
     * @param gameType The type of game (1-8)
     * @param count Number of top scores to return
     */
    function getLeaderboard(uint256 gameType, uint256 count) 
        external 
        view 
        validGameType(gameType) 
        returns (PlayerScore[] memory) 
    {
        uint256 length = leaderboards[gameType].length;
        if (length == 0) {
            return new PlayerScore[](0);
        }
        
        uint256 returnCount = count > length ? length : count;
        PlayerScore[] memory topScores = new PlayerScore[](returnCount);
        
        for (uint256 i = 0; i < returnCount; i++) {
            topScores[i] = leaderboards[gameType][i];
        }
        
        return topScores;
    }
    
    /**
     * @dev Calculate and claim rewards for top players
     * @param gameType The type of game (1-8)
     */
    function claimReward(uint256 gameType) external validGameType(gameType) {
        require(leaderboards[gameType].length > 0, "No scores available");
        
        uint256 totalReward = (gameStats[gameType].totalEntryFees * REWARD_PERCENTAGE) / 100;
        uint256 playerCount = leaderboards[gameType].length;
        
        // Distribute rewards: 1st place gets 50%, 2nd gets 30%, 3rd gets 20%
        uint256 firstPlaceReward = (totalReward * 50) / 100;
        uint256 secondPlaceReward = (totalReward * 30) / 100;
        uint256 thirdPlaceReward = (totalReward * 20) / 100;
        
        // Check if player is in top 3 and hasn't claimed yet
        bool hasClaimed = false;
        uint256 rewardAmount = 0;
        
        if (leaderboards[gameType][0].player == msg.sender) {
            rewardAmount = firstPlaceReward;
            hasClaimed = true;
        } else if (playerCount > 1 && leaderboards[gameType][1].player == msg.sender) {
            rewardAmount = secondPlaceReward;
            hasClaimed = true;
        } else if (playerCount > 2 && leaderboards[gameType][2].player == msg.sender) {
            rewardAmount = thirdPlaceReward;
            hasClaimed = true;
        }
        
        require(hasClaimed && rewardAmount > 0, "No reward available");
        require(address(this).balance >= rewardAmount, "Insufficient contract balance");
        
        // Transfer reward
        payable(msg.sender).transfer(rewardAmount);
        playerBalances[msg.sender] += rewardAmount;
        
        emit RewardClaimed(msg.sender, rewardAmount);
    }
    
    /**
     * @dev Get player's current balance
     */
    function getPlayerBalance(address player) external view returns (uint256) {
        return playerBalances[player];
    }
    
    /**
     * @dev Get game statistics
     */
    function getGameStats(uint256 gameType) 
        external 
        view 
        validGameType(gameType) 
        returns (GameStats memory) 
    {
        return gameStats[gameType];
    }
    
    /**
     * @dev Internal function to sort leaderboard by score (descending)
     */
    function _sortLeaderboard(uint256 gameType) internal {
        PlayerScore[] storage scores = leaderboards[gameType];
        uint256 length = scores.length;
        
        // Simple bubble sort for small arrays
        for (uint256 i = 0; i < length - 1; i++) {
            for (uint256 j = 0; j < length - i - 1; j++) {
                if (scores[j].score < scores[j + 1].score) {
                    PlayerScore memory temp = scores[j];
                    scores[j] = scores[j + 1];
                    scores[j + 1] = temp;
                }
            }
        }
        
        // Keep only top scores
        if (length > MAX_LEADERBOARD_SIZE) {
            // Remove excess scores
            for (uint256 i = MAX_LEADERBOARD_SIZE; i < length; i++) {
                delete scores[i];
            }
        }
    }
    
    /**
     * @dev Owner function to withdraw contract balance (for maintenance)
     */
    function withdrawFunds() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");
        payable(owner).transfer(balance);
    }
    
    /**
     * @dev Emergency function to reset leaderboard (only owner)
     */
    function resetLeaderboard(uint256 gameType) external onlyOwner validGameType(gameType) {
        delete leaderboards[gameType];
        gameStats[gameType].lastReset = block.timestamp;
    }
    
    /**
     * @dev Receive function to accept ETH/MON
     */
    receive() external payable {}
}
