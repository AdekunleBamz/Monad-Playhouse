// Monad Playhouse - MGID-focused Leaderboard Server
// Handles score submission to MGID contract and local leaderboard

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { MongoClient } = require('mongodb');
const { ethers } = require('ethers');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// MongoDB connection
let db;
const connectDB = async () => {
    try {
        const client = new MongoClient(process.env.MONGODB_URI);
        await client.connect();
        db = client.db();
        console.log('✅ Connected to MongoDB');
    } catch (error) {
        console.error('❌ MongoDB connection error:', error);
        process.exit(1);
    }
};

// MGID Contract Setup
const MGID_CONTRACT_ADDRESS = '0xceCBFF203C8B6044F52CE23D914A1bfD997541A4';
const MGID_CONTRACT_ABI = [
    "function updatePlayerData(address player, uint256 scoreAmount, uint256 transactionAmount) external",
    "function getPlayerData(address player) external view returns (uint256 totalScore, uint256 totalTransactions, string memory username)"
];

let mgidContract;
let mgidSigner;

// Initialize MGID contract
const initMGIDContract = async () => {
    try {
        if (!process.env.MGID_PRIVATE_KEY || process.env.MGID_PRIVATE_KEY === 'your_private_key_here') {
            console.warn('⚠️ MGID_PRIVATE_KEY not set, MGID integration disabled');
            return;
        }

        const provider = new ethers.JsonRpcProvider(process.env.MONAD_RPC_URL || 'https://testnet-rpc.monad.xyz');
        mgidSigner = new ethers.Wallet(process.env.MGID_PRIVATE_KEY, provider);
        mgidContract = new ethers.Contract(MGID_CONTRACT_ADDRESS, MGID_CONTRACT_ABI, mgidSigner);
        
        console.log('✅ MGID contract initialized');
        console.log('📝 Contract Address:', MGID_CONTRACT_ADDRESS);
        console.log('🔑 Signer Address:', mgidSigner.address);
    } catch (error) {
        console.error('❌ Failed to initialize MGID contract:', error);
    }
};

// Game validation rules
const GAME_RULES = {
    1: { name: 'Snake', maxScore: 10000, minDuration: 10 },
    2: { name: 'Memory', maxScore: 5000, minDuration: 15 },
    3: { name: 'Math', maxScore: 20000, minDuration: 30 },
    4: { name: 'Color', maxScore: 15000, minDuration: 20 },
    5: { name: 'Tetris', maxScore: 50000, minDuration: 60 },
    6: { name: 'Flappy', maxScore: 1000, minDuration: 10 },
    7: { name: 'Spelling', maxScore: 8000, minDuration: 30 },
    8: { name: 'Car Race', maxScore: 25000, minDuration: 45 },
    9: { name: 'Monad Runner', maxScore: 30000, minDuration: 30 },
    10: { name: 'Crypto Puzzle', maxScore: 12000, minDuration: 60 },
    11: { name: 'Token Collector', maxScore: 18000, minDuration: 40 },
    12: { name: 'Blockchain Tetris', maxScore: 60000, minDuration: 90 }
};

// Validate score submission
const validateScore = (gameType, score, gameDuration, playerAddress) => {
    const rules = GAME_RULES[gameType];
    if (!rules) {
        return { valid: false, error: 'Invalid game type' };
    }

    if (!playerAddress || !ethers.isAddress(playerAddress)) {
        return { valid: false, error: 'Invalid player address' };
    }

    if (score <= 0 || score > rules.maxScore) {
        return { valid: false, error: `Score must be between 1 and ${rules.maxScore}` };
    }

    if (gameDuration < rules.minDuration) {
        return { valid: false, error: `Game duration must be at least ${rules.minDuration} seconds` };
    }

    return { valid: true };
};

// Submit score to MGID contract
const submitToMGIDContract = async (playerAddress, scoreAmount, transactionAmount = 1) => {
    try {
        if (!mgidContract) {
            console.warn('⚠️ MGID contract not available');
            return { success: false, error: 'MGID contract not initialized' };
        }

        console.log('🎯 Submitting to MGID contract:', {
            player: playerAddress,
            scoreAmount,
            transactionAmount
        });

        // Estimate gas first
        const gasEstimate = await mgidContract.updatePlayerData.estimateGas(
            playerAddress,
            scoreAmount,
            transactionAmount
        );

        console.log('⛽ Gas estimate:', gasEstimate.toString());

        // Submit with higher gas limit for safety
        const tx = await mgidContract.updatePlayerData(
            playerAddress,
            scoreAmount,
            transactionAmount,
            {
                gasLimit: gasEstimate * BigInt(120) / BigInt(100) // 20% buffer
            }
        );

        console.log('📝 MGID transaction hash:', tx.hash);
        
        // Wait for confirmation
        const receipt = await tx.wait();
        console.log('✅ MGID transaction confirmed in block:', receipt.blockNumber);

        return {
            success: true,
            transactionHash: tx.hash,
            blockNumber: receipt.blockNumber
        };

    } catch (error) {
        console.error('❌ MGID contract submission failed:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

// Get MGID username
const getMGIDUsername = async (walletAddress) => {
    try {
        const response = await fetch(`https://monad-games-id-site.vercel.app/api/check-wallet?wallet=${walletAddress}`);
        const data = await response.json();
        
        if (data.hasUsername && data.user) {
            return data.user.username;
        }
        return null;
    } catch (error) {
        console.error('❌ Failed to get MGID username:', error);
        return null;
    }
};

// API Routes

// Health check
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'healthy',
        timestamp: new Date().toISOString(),
        mgidEnabled: !!mgidContract,
        mongoConnected: !!db,
        server: 'mgid-leaderboard-server',
        version: '3.0.1'
    });
});

// Get configuration
app.get('/api/config', (req, res) => {
    res.json({
        mgidContractAddress: MGID_CONTRACT_ADDRESS,
        mgidEnabled: !!mgidContract,
        supportedGames: Object.keys(GAME_RULES).map(key => ({
            id: parseInt(key),
            name: GAME_RULES[key].name
        }))
    });
});

// Submit score
app.post('/api/submit-score', async (req, res) => {
    try {
        const { gameType, score, playerName, gameDuration, playerAddress, mgidUsername } = req.body;

        console.log('📥 Score submission received:', {
            gameType,
            score,
            playerName,
            gameDuration,
            playerAddress: playerAddress?.slice(0, 6) + '...' + playerAddress?.slice(-4),
            mgidUsername
        });

        // Validate input
        if (!gameType || !score || !playerAddress) {
            return res.status(400).json({ error: 'Missing required fields: gameType, score, playerAddress' });
        }

        // Validate score
        const validation = validateScore(gameType, score, gameDuration, playerAddress);
        if (!validation.valid) {
            return res.status(400).json({ error: validation.error });
        }

        // Check for recent duplicate submission
        if (db) {
            const oneMinuteAgo = new Date(Date.now() - 60000);
            const existingScore = await db.collection('mgid_scores').findOne({
                gameType,
                playerAddress,
                score,
                timestamp: { $gte: oneMinuteAgo }
            });

            if (existingScore) {
                return res.status(400).json({ error: 'Duplicate score submission detected' });
            }
        }

        // Get MGID username if not provided
        let finalUsername = mgidUsername;
        if (!finalUsername) {
            finalUsername = await getMGIDUsername(playerAddress);
        }

        // Create score document
        const scoreDoc = {
            gameType,
            score,
            playerName: finalUsername || playerName || 'Anonymous',
            gameDuration,
            playerAddress,
            mgidUsername: finalUsername,
            timestamp: new Date(),
            gameName: GAME_RULES[gameType].name
        };

        // Save to MongoDB
        let mongoResult = null;
        if (db) {
            try {
                mongoResult = await db.collection('mgid_scores').insertOne(scoreDoc);
                console.log('✅ Score saved to MongoDB:', mongoResult.insertedId);
            } catch (error) {
                console.error('❌ MongoDB save failed:', error);
            }
        }

        // Submit to MGID contract
        const mgidResult = await submitToMGIDContract(playerAddress, score, 1);

        // Response
        const response = {
            success: true,
            message: 'Score submitted successfully',
            score: scoreDoc,
            mgid: mgidResult,
            mongodb: mongoResult ? { id: mongoResult.insertedId } : null
        };

        if (mgidResult.success) {
            console.log('✅ Complete score submission successful');
        } else {
            console.warn('⚠️ Score saved locally but MGID submission failed');
        }

        res.json(response);

    } catch (error) {
        console.error('❌ Score submission error:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            details: error.message 
        });
    }
});

// Get global leaderboard (all games) - MUST BE BEFORE :gameType route
app.get('/api/leaderboard/global', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 50;

        let globalScores = [];

        if (db) {
            // Aggregate scores across all games
            globalScores = await db.collection('mgid_scores').aggregate([
                {
                    $group: {
                        _id: '$playerAddress',
                        totalScore: { $sum: '$score' },
                        playerName: { $first: '$mgidUsername' },
                        fallbackName: { $first: '$playerName' },
                        gamesPlayed: { $sum: 1 },
                        lastPlayed: { $max: '$timestamp' }
                    }
                },
                {
                    $project: {
                        playerAddress: '$_id',
                        totalScore: 1,
                        playerName: { $ifNull: ['$playerName', '$fallbackName'] },
                        gamesPlayed: 1,
                        lastPlayed: 1
                    }
                },
                { $sort: { totalScore: -1, lastPlayed: -1 } },
                { $limit: limit }
            ]).toArray();
        }

        const leaderboard = globalScores.map((player, index) => ({
            rank: index + 1,
            playerName: player.playerName || 'Anonymous',
            totalScore: player.totalScore,
            gamesPlayed: player.gamesPlayed,
            lastPlayed: player.lastPlayed,
            playerAddress: player.playerAddress
        }));

        res.json({
            type: 'global',
            leaderboard,
            total: globalScores.length
        });

    } catch (error) {
        console.error('❌ Global leaderboard fetch error:', error);
        res.status(500).json({ error: 'Failed to fetch global leaderboard' });
    }
});

// Get leaderboard for specific game
app.get('/api/leaderboard/:gameType', async (req, res) => {
    try {
        const gameType = parseInt(req.params.gameType);
        const limit = parseInt(req.query.limit) || 10;

        if (!GAME_RULES[gameType]) {
            return res.status(400).json({ error: 'Invalid game type' });
        }

        let scores = [];

        // Get from MongoDB if available
        if (db) {
            scores = await db.collection('mgid_scores')
                .find({ gameType })
                .sort({ score: -1, timestamp: -1 })
                .limit(limit)
                .toArray();
        }

        // Format response
        const leaderboard = scores.map((score, index) => ({
            rank: index + 1,
            playerName: score.mgidUsername || score.playerName,
            score: score.score,
            timestamp: score.timestamp,
            gameDuration: score.gameDuration,
            playerAddress: score.playerAddress
        }));

        res.json({
            gameType,
            gameName: GAME_RULES[gameType].name,
            leaderboard,
            total: scores.length
        });

    } catch (error) {
        console.error('❌ Leaderboard fetch error:', error);
        res.status(500).json({ error: 'Failed to fetch leaderboard' });
    }
});

// Initialize server
const startServer = async () => {
    try {
        await connectDB();
        await initMGIDContract();
        
        app.listen(PORT, '0.0.0.0', () => {
            console.log(`🚀 MGID Leaderboard Server running on port ${PORT}`);
            console.log(`🌍 CORS Origin: ${process.env.CORS_ORIGIN || '*'}`);
            console.log(`🎯 MGID Integration: ${mgidContract ? 'Enabled' : 'Disabled'}`);
            console.log(`📊 MongoDB: ${db ? 'Connected' : 'Disconnected'}`);
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
};

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('🛑 Received SIGTERM, shutting down gracefully');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('🛑 Received SIGINT, shutting down gracefully');
    process.exit(0);
});

startServer();
