require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { MongoClient } = require('mongodb');
const { ethers } = require('ethers');
const { PrivyClient } = require('@privy-io/server-auth');

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize Privy client
const privyClient = new PrivyClient(
  process.env.PRIVY_APP_ID,
  process.env.PRIVY_API_KEY
);

// MongoDB connection
let db;
const connectDB = async () => {
  try {
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    db = client.db();
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Initialize MGID contract if private key is provided
let mgidContract;
let mgidSigner;
if (process.env.GAME_PRIVATE_KEY && process.env.GAME_PRIVATE_KEY !== 'your_private_key_here') {
  try {
    const provider = new ethers.JsonRpcProvider(process.env.MONAD_RPC_URL);
    mgidSigner = new ethers.Wallet(process.env.GAME_PRIVATE_KEY, provider);
    
    const contractABI = [
      "function updatePlayerData(address player, uint256 gameType, uint256 score, uint256 timestamp) external",
      "function getPlayerData(address player, uint256 gameType) external view returns (uint256 score, uint256 timestamp)"
    ];
    
    mgidContract = new ethers.Contract(
      process.env.MGID_CONTRACT_ADDRESS,
      contractABI,
      mgidSigner
    );
    console.log('MGID contract initialized');
  } catch (error) {
    console.error('MGID contract initialization error:', error);
  }
}

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Root API endpoint
app.get('/api', (req, res) => {
  res.json({
    message: 'Monad Playhouse API',
    endpoints: {
      health: '/api/health',
      config: '/api/config',
      submitScore: '/api/submit-score',
      leaderboard: '/api/leaderboard/:gameType'
    }
  });
});

// Configuration endpoint
app.get('/api/config', (req, res) => {
  res.json({
    privyAppId: process.env.PRIVY_APP_ID,
    mgidContractAddress: process.env.MGID_CONTRACT_ADDRESS,
    monadRpcUrl: process.env.MONAD_RPC_URL,
    mgidEnabled: !!mgidContract
  });
});

// Submit score endpoint - supports both wallet and Privy
app.post('/api/submit-score', async (req, res) => {
  try {
    const { score, gameType, playerAddress, privyId } = req.body;
    
    if (!score || !gameType) {
      return res.status(400).json({ error: 'Missing score or gameType' });
    }
    
    if (!playerAddress && !privyId) {
      return res.status(400).json({ error: 'Missing playerAddress or privyId' });
    }
    
    // Enforce MGID as source of truth: only accept wallet submissions for leaderboard
    if (!playerAddress) {
      return res.status(400).json({ error: 'Wallet address required. MGID-enforced leaderboard only accepts wallet submissions.' });
    }
    if (!mgidContract) {
      return res.status(503).json({ error: 'MGID contract not available. Please try again later.' });
    }
    
    // Validate Privy ID if provided
    if (privyId) {
      try {
        const user = await privyClient.getUser(privyId);
        if (!user) {
          return res.status(401).json({ error: 'Invalid Privy ID' });
        }
        console.log('Privy user validated:', user.id);
      } catch (error) {
        console.error('Privy validation error:', error);
        return res.status(401).json({ error: 'Privy validation failed' });
      }
    }
    
    // Submit to MGID FIRST (enforced). Only store in DB if on-chain succeeds
    try {
      const gameTypeId = parseInt(gameType);
      const timestamp = Math.floor(Date.now() / 1000);
      
      const tx = await mgidContract.updatePlayerData(
        playerAddress,
        gameTypeId,
        score,
        timestamp
      );
      const receipt = await tx.wait();
      console.log('Score submitted to MGID contract:', tx.hash);
      
      // Store in MongoDB as verified
      const scoreData = {
        score: parseInt(score),
        gameType: gameTypeId,
        timestamp: new Date(),
        playerAddress,
        privyId: privyId || null,
        verified: true,
        mgidTxHash: tx.hash,
        mgidBlockNumber: receipt?.blockNumber || null
      };
      const result = await db.collection('scores').insertOne(scoreData);
      console.log('Verified score stored in MongoDB:', result.insertedId);
      
      return res.json({
        success: true,
        message: 'Score submitted on-chain and recorded',
        mongoId: result.insertedId,
        mgidTxHash: tx.hash
      });
    } catch (error) {
      console.error('MGID submission failed (enforced):', error);
      return res.status(502).json({ error: 'MGID submission failed. Score not recorded.' });
    }
    
  } catch (error) {
    console.error('Submit score error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get leaderboard endpoint
app.get('/api/leaderboard/:gameType', async (req, res) => {
  try {
    const { gameType } = req.params;
    const gameTypeId = parseInt(gameType);
    
    // Show only verified (on-chain) scores
    const scores = await db.collection('scores')
      .find({ gameType: gameTypeId, verified: true })
      .sort({ score: -1 })
      .limit(20)
      .toArray();
    
    const leaderboard = scores.map((score, index) => ({
      rank: index + 1,
      score: score.score,
      playerId: score.playerAddress || `Player_${score.privyId?.slice(-6)}`,
      timestamp: score.timestamp,
      isWalletUser: !!score.playerAddress,
      verified: !!score.verified,
      mgidTxHash: score.mgidTxHash || null
    }));
    
    res.json(leaderboard);
  } catch (error) {
    console.error('Leaderboard error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Start server
const startServer = async () => {
  await connectDB();
  
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV}`);
    console.log(`CORS Origin: ${process.env.CORS_ORIGIN}`);
    console.log(`MGID Contract: ${mgidContract ? 'Enabled' : 'Disabled'}`);
    console.log(`Privy App ID: ${process.env.PRIVY_APP_ID}`);
  });
};

startServer().catch(console.error);
